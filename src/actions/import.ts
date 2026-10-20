"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { discover } from "@/lib/tmdb";
import { LIST_STATUSES, type ListStatus } from "@/lib/format";

export type ImportKind =
  | "letterboxd-watched"
  | "letterboxd-ratings"
  | "letterboxd-diary"
  | "letterboxd-watchlist"
  | "anilist"
  | "myanimelist"
  | "omnilist"
  | "tvlist";

const cleanDateSchema = z
  .string()
  .nullish()
  .transform((v) => {
    if (!v) return null;
    const s = v.trim();
    if (s === "0000-00-00" || s.startsWith("0000") || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return s;
  });

const letterboxdRow = z.object({
  name: z.string().min(1).max(300),
  year: z.number().int().min(1870).max(2100).nullable(),
  date: cleanDateSchema,
  watchedDate: cleanDateSchema,
  rating: z.number().min(0).max(5).nullable(),
  rewatch: z.boolean().default(false),
});

const omnilistRow = z.object({
  type: z.enum(["movie", "tv", "anime", "game", "manga", "book", "music"]),
  tmdbId: z.number().int().positive(),
  status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]),
  score: z.number().int().min(0).max(100),
  progress: z.number().int().min(0).max(100000),
  repeat: z.number().int().min(0).max(1000),
  startedAt: cleanDateSchema,
  completedAt: cleanDateSchema,
  notes: z.string().max(2000).nullable().optional(),
  private: z.boolean().default(false),
});

const anilistRow = z.object({
  mediaId: z.number().int().positive(),
  type: z.enum(["anime", "manga"]).default("anime"),
  title: z.string().optional(),
  status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]),
  score: z.number().int().min(0).max(100),
  progress: z.number().int().min(0).max(100000).default(0),
  repeat: z.number().int().min(0).max(1000).default(0),
  startedAt: cleanDateSchema,
  completedAt: cleanDateSchema,
  notes: z.string().max(2000).nullable().optional(),
});

const malRow = z.object({
  malId: z.number().int().positive().nullable().optional(),
  type: z.enum(["anime", "manga"]).default("anime"),
  title: z.string().min(1).max(300),
  status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]),
  score: z.number().int().min(0).max(100),
  progress: z.number().int().min(0).max(100000).default(0),
  repeat: z.number().int().min(0).max(1000).default(0),
  startedAt: cleanDateSchema,
  completedAt: cleanDateSchema,
});

export interface ImportResult {
  imported: number;
  skipped: string[];
}

interface AniListBatchMedia {
  id: number;
  idMal?: number | null;
  type?: string | null;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
    userPreferred?: string | null;
  };
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  } | null;
  bannerImage?: string | null;
  format?: string | null;
  status?: string | null;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  duration?: number | null;
  genres?: string[] | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  seasonYear?: number | null;
}

const ANILIST_API = "https://graphql.anilist.co";

async function batchResolveMal(malIds: number[]): Promise<Map<string, AniListBatchMedia>> {
  const map = new Map<string, AniListBatchMedia>();
  if (!malIds.length) return map;

  const query = `
    query ($idMals: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $idMals) {
          id
          idMal
          type
          title { romaji english native userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          format
          status
          episodes
          chapters
          volumes
          duration
          genres
          startDate { year month day }
          seasonYear
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { idMals: malIds } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return map;
    const json = (await res.json()) as { data?: { Page?: { media?: AniListBatchMedia[] } } };
    const items = json.data?.Page?.media || [];
    for (const m of items) {
      if (m.idMal && m.type) {
        map.set(`${m.type.toLowerCase()}:${m.idMal}`, m);
      }
    }
  } catch (err) {
    console.warn("[import] batchResolveMal error:", err instanceof Error ? err.message : err);
  }
  return map;
}

async function batchResolveAniList(ids: number[]): Promise<Map<number, AniListBatchMedia>> {
  const map = new Map<number, AniListBatchMedia>();
  if (!ids.length) return map;

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids) {
          id
          idMal
          type
          title { romaji english native userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          format
          status
          episodes
          chapters
          volumes
          duration
          genres
          startDate { year month day }
          seasonYear
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { ids } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return map;
    const json = (await res.json()) as { data?: { Page?: { media?: AniListBatchMedia[] } } };
    const items = json.data?.Page?.media || [];
    for (const m of items) {
      if (m.id) map.set(m.id, m);
    }
  } catch (err) {
    console.warn("[import] batchResolveAniList error:", err instanceof Error ? err.message : err);
  }
  return map;
}

async function resolveAnimeByTitle(title: string, type: "anime" | "manga"): Promise<AniListBatchMedia | null> {
  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        id
        idMal
        type
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        chapters
        volumes
        duration
        genres
        startDate { year month day }
        seasonYear
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { search: title, type: type.toUpperCase() } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { Media?: AniListBatchMedia } };
    return json.data?.Media ?? null;
  } catch {
    return null;
  }
}

async function upsertAniListMedia(item: AniListBatchMedia, fallbackType: "anime" | "manga"): Promise<number | null> {
  const type: "anime" | "manga" = item.type?.toLowerCase() === "manga" ? "manga" : fallbackType;
  const existing = await db.query.media.findFirst({
    where: and(eq(schema.media.type, type), eq(schema.media.tmdbId, item.id)),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const dateStr = item.startDate?.year
    ? `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, "0")}-${String(item.startDate.day || 1).padStart(2, "0")}`
    : null;
  const title = item.title.userPreferred || item.title.english || item.title.romaji || "Untitled";
  const poster = item.coverImage?.large || item.coverImage?.extraLarge || item.coverImage?.medium || null;

  const [saved] = await db
    .insert(schema.media)
    .values({
      type,
      tmdbId: item.id,
      title,
      originalTitle: item.title.romaji || null,
      posterPath: poster,
      backdropPath: item.bannerImage || null,
      releaseDate: dateStr,
      year: item.seasonYear || item.startDate?.year || null,
      format: item.format || (type === "manga" ? "Manga" : "TV"),
      genres: item.genres || [],
      studios: [],
      people: [],
      country: "JP",
      originalLanguage: "ja",
      runtime: item.duration || null,
      episodes: type === "manga" ? item.chapters || null : item.episodes || null,
      status: item.status || "Finished",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.media.type, schema.media.tmdbId],
      set: {
        title,
        posterPath: poster,
        updatedAt: new Date(),
      },
    })
    .returning({ id: schema.media.id });

  return saved?.id ?? null;
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
 * Imports one batch (≤ 25 rows). Batched resolution prevents external API rate limits.
 */
export async function importBatch(kind: ImportKind, rows: unknown[]): Promise<ImportResult> {
  const viewer = await getViewer();
  if (!viewer) return { imported: 0, skipped: ["Not logged in."] };
  if (!Array.isArray(rows) || rows.length > 25) return { imported: 0, skipped: ["Batch too large."] };
  let imported = 0;
  const skipped: string[] = [];

  // 1. MyAnimeList batch resolution
  if (kind === "myanimelist") {
    const parsedRows = rows
      .map((raw) => {
        const r = malRow.safeParse(raw);
        return r.success ? r.data : null;
      })
      .filter((r): r is z.infer<typeof malRow> => r !== null);

    const malIds = parsedRows.map((r) => r.malId).filter((id): id is number => Boolean(id));
    const malMap = await batchResolveMal(malIds);

    for (const item of parsedRows) {
      try {
        const key = `${item.type}:${item.malId}`;
        let mediaInfo: AniListBatchMedia | null = item.malId ? malMap.get(key) ?? null : null;
        if (!mediaInfo && item.title) {
          mediaInfo = await resolveAnimeByTitle(item.title, item.type);
        }

        if (!mediaInfo) {
          skipped.push(`${item.title} (not found on AniList)`);
          continue;
        }

        const mediaId = await upsertAniListMedia(mediaInfo, item.type);
        if (!mediaId) {
          skipped.push(item.title);
          continue;
        }

        const values = {
          status: item.status,
          score: item.score,
          progress: item.progress,
          repeat: item.repeat,
          startedAt: item.startedAt ?? null,
          completedAt: item.completedAt ?? null,
          private: false,
        };

        await db
          .insert(schema.listEntry)
          .values({ userId: viewer.id, mediaId, ...values })
          .onConflictDoUpdate({
            target: [schema.listEntry.userId, schema.listEntry.mediaId],
            set: values,
          });
        imported++;
      } catch (err) {
        console.warn(`[import] MAL row failed for ${item.title}:`, err);
        skipped.push(item.title);
      }
    }
    return { imported, skipped };
  }

  // 2. AniList batch resolution
  if (kind === "anilist") {
    const parsedRows = rows
      .map((raw) => {
        const r = anilistRow.safeParse(raw);
        return r.success ? r.data : null;
      })
      .filter((r): r is z.infer<typeof anilistRow> => r !== null);

    const aniListIds = parsedRows.map((r) => r.mediaId);
    const aniListMap = await batchResolveAniList(aniListIds);

    for (const item of parsedRows) {
      try {
        const mediaInfo = aniListMap.get(item.mediaId);
        let mediaId: number | null = null;
        if (mediaInfo) {
          mediaId = await upsertAniListMedia(mediaInfo, item.type);
        } else {
          const m = await ensureMedia(item.type, item.mediaId);
          mediaId = m?.id ?? null;
        }

        if (!mediaId) {
          skipped.push(`AniList ${item.type} ${item.mediaId}`);
          continue;
        }

        const values = {
          status: item.status,
          score: item.score,
          progress: item.progress,
          repeat: item.repeat,
          startedAt: item.startedAt ?? null,
          completedAt: item.completedAt ?? null,
          notes: item.notes ?? null,
          private: false,
        };

        await db
          .insert(schema.listEntry)
          .values({ userId: viewer.id, mediaId, ...values })
          .onConflictDoUpdate({
            target: [schema.listEntry.userId, schema.listEntry.mediaId],
            set: values,
          });
        imported++;
      } catch (err) {
        console.warn(`[import] AniList row failed:`, err);
        skipped.push(`AniList ${item.mediaId}`);
      }
    }
    return { imported, skipped };
  }

  // 3. Omnilist / TVlist native backup import
  if (kind === "omnilist" || kind === "tvlist") {
    for (const raw of rows) {
      try {
        const r = omnilistRow.safeParse(raw);
        if (!r.success) {
          skipped.push("Invalid row");
          continue;
        }
        const media = await ensureMedia(r.data.type, r.data.tmdbId);
        if (!media) {
          skipped.push(`${r.data.type} ${r.data.tmdbId}`);
          continue;
        }
        const { type: _t, tmdbId: _i, ...values } = r.data;
        await db
          .insert(schema.listEntry)
          .values({ userId: viewer.id, mediaId: media.id, ...values })
          .onConflictDoUpdate({ target: [schema.listEntry.userId, schema.listEntry.mediaId], set: values });
        imported++;
      } catch {
        skipped.push("Row failed");
      }
    }
    return { imported, skipped };
  }

  // 4. Letterboxd CSV exports
  for (const raw of rows) {
    try {
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
