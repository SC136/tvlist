"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { discover } from "@/lib/tmdb";
import { LIST_STATUSES, type ListStatus } from "@/lib/format";

export type ImportKind = "letterboxd-watched" | "letterboxd-ratings" | "letterboxd-diary" | "letterboxd-watchlist" | "tvlist";

const letterboxdRow = z.object({
  name: z.string().min(1).max(300),
  year: z.number().int().min(1870).max(2100).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  rewatch: z.boolean(),
});

const tvlistRow = z.object({
  type: z.enum(["movie", "tv"]),
  tmdbId: z.number().int().positive(),
  status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]),
  score: z.number().int().min(0).max(100),
  progress: z.number().int().min(0).max(100000),
  repeat: z.number().int().min(0).max(1000),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().max(2000).nullable(),
  private: z.boolean(),
});

export interface ImportResult {
  imported: number;
  skipped: string[];
}

async function resolveMovie(name: string, year: number | null) {
  const exact = await discover("movie", { query: name, year: year ?? undefined });
  const pick = exact.results.find((r) => r.title.toLowerCase() === name.toLowerCase()) ?? exact.results[0];
  if (pick) return pick.id;
  if (year) {
    const loose = await discover("movie", { query: name });
    return loose.results[0]?.id ?? null;
  }
  return null;
}

/**
 * Imports one batch (≤ 25 rows). The client sends files in batches so a long
 * history never hits a function timeout. No feed activity is generated.
 */
export async function importBatch(kind: ImportKind, rows: unknown[]): Promise<ImportResult> {
  const viewer = await getViewer();
  if (!viewer) return { imported: 0, skipped: ["Not logged in."] };
  if (!Array.isArray(rows) || rows.length > 25) return { imported: 0, skipped: ["Batch too large."] };
  let imported = 0;
  const skipped: string[] = [];

  for (const raw of rows) {
    try {
      if (kind === "tvlist") {
        const r = tvlistRow.safeParse(raw);
        if (!r.success) {
          skipped.push("Invalid row");
          continue;
        }
        const media = await ensureMedia(r.data.type, r.data.tmdbId);
        if (!media) {
          skipped.push(`TMDB ${r.data.type} ${r.data.tmdbId}`);
          continue;
        }
        const { type: _t, tmdbId: _i, ...values } = r.data;
        await db
          .insert(schema.listEntry)
          .values({ userId: viewer.id, mediaId: media.id, ...values })
          .onConflictDoUpdate({ target: [schema.listEntry.userId, schema.listEntry.mediaId], set: values });
        imported++;
        continue;
      }

      const r = letterboxdRow.safeParse(raw);
      if (!r.success) {
        skipped.push("Invalid row");
        continue;
      }
      const tmdbId = await resolveMovie(r.data.name, r.data.year);
      if (!tmdbId) {
        skipped.push(`${r.data.name}${r.data.year ? ` (${r.data.year})` : ""}`);
        continue;
      }
      const media = await ensureMedia("movie", tmdbId);
      if (!media) {
        skipped.push(r.data.name);
        continue;
      }
      const existing = await db.query.listEntry.findFirst({
        where: and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, media.id)),
      });
      const score = r.data.rating ? Math.round(r.data.rating * 20) : 0;
      const watched = r.data.watchedDate ?? r.data.date;

      if (kind === "letterboxd-watchlist") {
        if (!existing) await db.insert(schema.listEntry).values({ userId: viewer.id, mediaId: media.id, status: "PLANNING" });
      } else {
        const values = {
          status: "COMPLETED" as const,
          progress: 1,
          score: score || existing?.score || 0,
          completedAt: existing?.completedAt && watched && existing.completedAt > watched ? existing.completedAt : (watched ?? existing?.completedAt ?? null),
          startedAt: existing?.startedAt ?? watched,
          repeat: existing?.repeat ?? 0,
        };
        if (existing) await db.update(schema.listEntry).set(values).where(eq(schema.listEntry.id, existing.id));
        else await db.insert(schema.listEntry).values({ userId: viewer.id, mediaId: media.id, ...values });
        if (kind === "letterboxd-diary" && watched) {
          await db.insert(schema.diaryEntry).values({ userId: viewer.id, mediaId: media.id, watchedOn: watched, score, rewatch: r.data.rewatch });
        }
      }
      imported++;
    } catch {
      skipped.push("Row failed");
    }
  }
  return { imported, skipped };
}
