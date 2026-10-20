import "server-only";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { MediaPerson } from "@/db/schema";
import { fetchUnifiedMediaDetails as getMediaDetails } from "@/lib/media-loader";
import type { MediaDetails } from "@/lib/media";
import type { ListStatus } from "@/lib/format";
import type { MediaType } from "@/lib/media";

function detailsToRow(d: MediaDetails) {
  const people: MediaPerson[] = [
    ...d.creators.slice(0, 3).map((c) => ({ id: c.id, name: c.name, profilePath: c.profilePath, role: d.type === "movie" ? "director" : "creator" })),
    ...d.cast.slice(0, 6).map((c) => ({ id: c.id, name: c.name, profilePath: c.profilePath, role: "cast" })),
  ];
  return {
    type: d.type,
    tmdbId: d.id,
    title: d.title,
    originalTitle: d.originalTitle,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
    releaseDate: d.date,
    year: d.year,
    format: d.format,
    genres: d.genres,
    studios: (d.type === "tv" && d.networks.length ? d.networks.map((n) => n.name) : d.studios).slice(0, 4),
    people,
    country: d.countries[0] ?? null,
    originalLanguage: d.originalLanguage,
    runtime: d.runtime,
    episodes: d.type === "movie" ? 1 : d.episodes,
    seasons: d.seasons,
    status: d.status,
    voteAverage: d.score !== null ? d.score / 10 : null,
    nextEpisodeAirDate: d.nextEpisode?.airDate ?? null,
    nextEpisodeNumber: d.nextEpisode?.episode ?? null,
    nextEpisodeSeason: d.nextEpisode?.season ?? null,
    updatedAt: new Date(),
  };
}

/** Insert or refresh the cached snapshot of a title. */
export async function upsertMedia(details: MediaDetails): Promise<schema.Media> {
  const row = detailsToRow(details);
  const [saved] = await db
    .insert(schema.media)
    .values(row)
    .onConflictDoUpdate({
      target: [schema.media.type, schema.media.tmdbId],
      set: row,
    })
    .returning();
  return saved;
}

/** Local media row for a TMDB title, fetching and caching it when first seen. */
export async function ensureMedia(type: MediaType, tmdbId: number): Promise<schema.Media | null> {
  const existing = await db.query.media.findFirst({
    where: and(eq(schema.media.type, type), eq(schema.media.tmdbId, tmdbId)),
  });
  // Refresh snapshots older than a day so episode counts / air dates stay current.
  if (existing && Date.now() - existing.updatedAt.getTime() < 86_400_000) return existing;
  const details = await getMediaDetails(type, tmdbId);
  if (!details) return existing ?? null;
  return upsertMedia(details);
}

export async function findMedia(type: MediaType, tmdbId: number) {
  return db.query.media.findFirst({
    where: and(eq(schema.media.type, type), eq(schema.media.tmdbId, tmdbId)),
  });
}

/** Refresh an existing cached row from details we already fetched (cheap, no extra TMDB call). */
export async function refreshMediaIfStale(details: MediaDetails) {
  const existing = await findMedia(details.type, details.id);
  if (existing && Date.now() - existing.updatedAt.getTime() > 6 * 3_600_000) {
    await upsertMedia(details);
  }
  return existing ?? null;
}

/** Map of "type:tmdbId" → the viewer's list status, for decorating cards. */
export async function getStatusesFor(
  userId: string | null | undefined,
  items: { type: MediaType; id: number }[],
): Promise<Record<string, ListStatus>> {
  if (!userId || items.length === 0) return {};
  const conditions = [];
  for (const t of ["movie", "tv", "anime", "game", "manga", "book", "music"] as const) {
    const ids = items.filter((i) => i.type === t).map((i) => i.id);
    if (ids.length) conditions.push(and(eq(schema.media.type, t), inArray(schema.media.tmdbId, ids)));
  }
  if (!conditions.length) return {};
  const rows = await db
    .select({ type: schema.media.type, tmdbId: schema.media.tmdbId, status: schema.listEntry.status })
    .from(schema.listEntry)
    .innerJoin(schema.media, eq(schema.media.id, schema.listEntry.mediaId))
    .where(and(eq(schema.listEntry.userId, userId), or(...conditions)));
  return Object.fromEntries(rows.map((r) => [`${r.type}:${r.tmdbId}`, r.status]));
}

/** Community stats for a title from Omnilist users: list status and score distribution. */
export async function getCommunityStats(mediaId: number) {
  const [statusRows, scoreRows, [avg]] = await Promise.all([
    db
      .select({ status: schema.listEntry.status, n: sql<number>`count(*)::int` })
      .from(schema.listEntry)
      .where(and(eq(schema.listEntry.mediaId, mediaId), eq(schema.listEntry.private, false)))
      .groupBy(schema.listEntry.status),
    db
      .select({ bucket: sql<number>`(greatest(1, ceil(${schema.listEntry.score} / 10.0)) * 10)::int`, n: sql<number>`count(*)::int` })
      .from(schema.listEntry)
      .where(and(eq(schema.listEntry.mediaId, mediaId), eq(schema.listEntry.private, false), sql`${schema.listEntry.score} > 0`))
      .groupBy(sql`1`),
    db
      .select({ mean: sql<number | null>`round(avg(${schema.listEntry.score}))::int` })
      .from(schema.listEntry)
      .where(and(eq(schema.listEntry.mediaId, mediaId), eq(schema.listEntry.private, false), sql`${schema.listEntry.score} > 0`)),
  ]);
  return {
    statuses: statusRows,
    scores: scoreRows.sort((a, b) => a.bucket - b.bucket),
    members: statusRows.reduce((a, r) => a + r.n, 0),
    mean: avg?.mean ?? null,
  };
}
