"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { recordListActivity } from "@/lib/activity";
import { withinLimit } from "@/lib/rate-limit";
import { todayIso } from "@/lib/format";
import type { ActionResult } from "./list";

const logInput = z.object({
  type: z.enum(["movie", "tv", "anime", "game", "manga", "book", "music"]),
  tmdbId: z.number().int().positive(),
  watchedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int().min(0).max(100),
  rewatch: z.boolean(),
  liked: z.boolean(),
  season: z.number().int().min(0).max(500).nullable(),
  note: z.string().max(2000).nullable(),
});

export type LogInput = z.infer<typeof logInput>;

/** "Log": records a viewing in the diary and keeps the list entry in sync. */
export async function logWatch(raw: LogInput): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = logInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Some of those values aren't valid." };
  const input = parsed.data;
  if (input.watchedOn > todayIso()) return { ok: false, error: "The watch date can't be in the future." };
  if (!(await withinLimit(schema.diaryEntry, viewer.id, 60, 60 * 10))) return { ok: false, error: "Slow down a little and try again shortly." };
  const media = await ensureMedia(input.type, input.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };

  await db.insert(schema.diaryEntry).values({
    userId: viewer.id,
    mediaId: media.id,
    watchedOn: input.watchedOn,
    score: input.score,
    rewatch: input.rewatch,
    liked: input.liked,
    season: input.type === "tv" ? input.season : null,
    note: input.note?.trim() || null,
  });

  // Movies: logging means you've seen it. Mark complete (counting rewatches) and carry the rating.
  if (media.type === "movie") {
    const entry = await db.query.listEntry.findFirst({
      where: and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, media.id)),
    });
    const wasCompleted = entry?.status === "COMPLETED";
    const values = {
      status: "COMPLETED" as const,
      progress: 1,
      score: input.score || entry?.score || 0,
      repeat: (entry?.repeat ?? 0) + (wasCompleted && input.rewatch ? 1 : 0),
      completedAt: input.watchedOn > (entry?.completedAt ?? "") ? input.watchedOn : entry?.completedAt ?? input.watchedOn,
      startedAt: entry?.startedAt ?? input.watchedOn,
    };
    if (entry) await db.update(schema.listEntry).set(values).where(eq(schema.listEntry.id, entry.id));
    else await db.insert(schema.listEntry).values({ userId: viewer.id, mediaId: media.id, ...values });
    if (!wasCompleted) {
      await recordListActivity(viewer.id, media, entry ? { status: entry.status, progress: entry.progress } : null, {
        status: "COMPLETED",
        progress: 1,
        private: entry?.private,
      });
    }
  }

  refresh();
  return { ok: true };
}

export async function deleteDiaryEntry(id: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  await db.delete(schema.diaryEntry).where(and(eq(schema.diaryEntry.id, Number(id)), eq(schema.diaryEntry.userId, viewer.id)));
  refresh();
  return { ok: true };
}
