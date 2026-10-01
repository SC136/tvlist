import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { MediaPerson } from "@/db/schema";
import type { ListStatus } from "@/lib/format";
import type { MediaType } from "@/lib/media";

export interface ListRow {
  entryId: number;
  status: ListStatus;
  score: number;
  progress: number;
  repeat: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  private: boolean;
  updatedAt: string;
  createdAt: string;
  media: {
    id: number;
    type: MediaType;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    year: number | null;
    releaseDate: string | null;
    format: string | null;
    genres: string[];
    studios: string[];
    people: MediaPerson[];
    country: string | null;
    runtime: number | null;
    episodes: number | null;
    status: string | null;
    voteAverage: number | null;
    nextEpisodeAirDate: string | null;
    nextEpisodeNumber: number | null;
  };
}

/** A user's full list for one media type (private rows only for the owner). */
export async function getUserList(userId: string, type: MediaType, includePrivate: boolean): Promise<ListRow[]> {
  const rows = await db
    .select({ entry: schema.listEntry, media: schema.media })
    .from(schema.listEntry)
    .innerJoin(schema.media, eq(schema.media.id, schema.listEntry.mediaId))
    .where(
      and(
        eq(schema.listEntry.userId, userId),
        eq(schema.media.type, type),
        includePrivate ? undefined : eq(schema.listEntry.private, false),
      ),
    )
    .orderBy(desc(schema.listEntry.updatedAt));
  return rows.map(({ entry: e, media: m }) => ({
    entryId: e.id,
    status: e.status,
    score: e.score,
    progress: e.progress,
    repeat: e.repeat,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
    notes: includePrivate ? e.notes : null,
    private: e.private,
    updatedAt: e.updatedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    media: {
      id: m.id,
      type: m.type,
      tmdbId: m.tmdbId,
      title: m.title,
      posterPath: m.posterPath,
      backdropPath: m.backdropPath,
      year: m.year,
      releaseDate: m.releaseDate,
      format: m.format,
      genres: m.genres,
      studios: m.studios,
      people: m.people,
      country: m.country,
      runtime: m.runtime,
      episodes: m.episodes,
      status: m.status,
      voteAverage: m.voteAverage,
      nextEpisodeAirDate: m.nextEpisodeAirDate,
      nextEpisodeNumber: m.nextEpisodeNumber,
    },
  }));
}

function minutesFor(r: ListRow): number {
  const runtime = r.media.runtime ?? (r.media.type === "movie" ? 110 : 45);
  if (r.media.type === "movie") {
    const watched = r.progress > 0 || r.status === "COMPLETED" ? 1 : 0;
    return runtime * (watched + r.repeat);
  }
  return runtime * (r.progress + r.repeat * (r.media.episodes ?? 0));
}

function episodesFor(r: ListRow): number {
  if (r.media.type === "movie") return 0;
  return r.progress + r.repeat * (r.media.episodes ?? 0);
}

type Bucket = { key: string; count: number; minutes: number; scoreSum: number; scored: number };

function bump(map: Map<string, Bucket>, key: string, r: ListRow) {
  const b = map.get(key) ?? { key, count: 0, minutes: 0, scoreSum: 0, scored: 0 };
  b.count++;
  b.minutes += minutesFor(r);
  if (r.score > 0) {
    b.scoreSum += r.score;
    b.scored++;
  }
  map.set(key, b);
}

function finish(map: Map<string, Bucket>) {
  return [...map.values()]
    .map((b) => ({ key: b.key, count: b.count, minutes: b.minutes, meanScore: b.scored ? Math.round(b.scoreSum / b.scored) : null }))
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes);
}

export type UserStats = ReturnType<typeof computeStats>;

export function computeStats(rows: ListRow[], type: MediaType) {
  const counted = rows.filter((r) => r.status !== "PLANNING");
  const scored = counted.filter((r) => r.score > 0);
  const mean = scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : 0;
  const std = scored.length
    ? Math.sqrt(scored.reduce((a, r) => a + (r.score - mean) ** 2, 0) / scored.length)
    : 0;
  const minutes = counted.reduce((a, r) => a + minutesFor(r), 0);
  const planningMinutes = rows
    .filter((r) => r.status === "PLANNING")
    .reduce((a, r) => a + (r.media.runtime ?? (type === "movie" ? 110 : 45)) * (type === "movie" ? 1 : r.media.episodes ?? 0), 0);

  const status = new Map<string, Bucket>();
  const scores = new Map<string, Bucket>();
  const formats = new Map<string, Bucket>();
  const countries = new Map<string, Bucket>();
  const releaseYears = new Map<string, Bucket>();
  const watchYears = new Map<string, Bucket>();
  const genres = new Map<string, Bucket>();
  const studios = new Map<string, Bucket>();
  const lengths = new Map<string, Bucket>();
  const cast = new Map<string, Bucket & { person: MediaPerson }>();
  const directors = new Map<string, Bucket & { person: MediaPerson }>();

  for (const r of rows) bump(status, r.status, r);
  for (const r of counted) {
    if (r.score > 0) bump(scores, String(Math.max(10, Math.ceil(r.score / 10) * 10)), r);
    bump(formats, r.media.format ?? (type === "movie" ? "Movie" : "TV"), r);
    if (r.media.country) bump(countries, r.media.country, r);
    if (r.media.year) bump(releaseYears, String(r.media.year), r);
    if (r.completedAt) bump(watchYears, r.completedAt.slice(0, 4), r);
    for (const g of r.media.genres) bump(genres, g, r);
    for (const s of r.media.studios.slice(0, 2)) bump(studios, s, r);
    bump(lengths, lengthBucket(r, type), r);
    for (const p of r.media.people) {
      const map = p.role === "cast" ? cast : directors;
      const key = String(p.id);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.minutes += minutesFor(r);
        if (r.score > 0) {
          existing.scoreSum += r.score;
          existing.scored++;
        }
      } else {
        map.set(key, {
          key,
          person: p,
          count: 1,
          minutes: minutesFor(r),
          scoreSum: r.score > 0 ? r.score : 0,
          scored: r.score > 0 ? 1 : 0,
        });
      }
    }
  }

  const people = (map: typeof cast) =>
    [...map.values()]
      .filter((p) => p.count > 0)
      .map((p) => ({ person: p.person, count: p.count, minutes: p.minutes, meanScore: p.scored ? Math.round(p.scoreSum / p.scored) : null }))
      .sort((a, b) => b.count - a.count || (b.meanScore ?? 0) - (a.meanScore ?? 0))
      .slice(0, 30);

  return {
    type,
    total: counted.length,
    planning: rows.length - counted.length,
    episodes: counted.reduce((a, r) => a + episodesFor(r), 0),
    minutes,
    planningMinutes,
    meanScore: Math.round(mean * 10) / 10,
    stdDev: Math.round(std * 10) / 10,
    status: finish(status),
    scores: finish(scores).sort((a, b) => Number(a.key) - Number(b.key)),
    formats: finish(formats),
    countries: finish(countries),
    releaseYears: finish(releaseYears).sort((a, b) => Number(a.key) - Number(b.key)),
    watchYears: finish(watchYears).sort((a, b) => Number(a.key) - Number(b.key)),
    genres: finish(genres),
    studios: finish(studios).slice(0, 30),
    lengths: finish(lengths).sort((a, b) => LENGTH_ORDER.indexOf(a.key) - LENGTH_ORDER.indexOf(b.key)),
    cast: people(cast),
    directors: people(directors),
  };
}

const LENGTH_ORDER = ["< 90 min", "90–120 min", "120–150 min", "150+ min", "1", "2–6", "7–16", "17–28", "29–55", "56–100", "101+", "Unknown"];

function lengthBucket(r: ListRow, type: MediaType): string {
  if (type === "movie") {
    const m = r.media.runtime;
    if (!m) return "Unknown";
    if (m < 90) return "< 90 min";
    if (m <= 120) return "90–120 min";
    if (m <= 150) return "120–150 min";
    return "150+ min";
  }
  const e = r.media.episodes;
  if (!e) return "Unknown";
  if (e === 1) return "1";
  if (e <= 6) return "2–6";
  if (e <= 16) return "7–16";
  if (e <= 28) return "17–28";
  if (e <= 55) return "29–55";
  if (e <= 100) return "56–100";
  return "101+";
}

/** Activity counts per day for the last 12 months (aggregated into months by the chart). */
export async function getActivityHistory(userId: string): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 366 * 86_400_000);
  const rows = await db
    .select({ day: sql<string>`to_char(${schema.activity.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
    .from(schema.activity)
    .where(and(eq(schema.activity.userId, userId), gt(schema.activity.createdAt, since)))
    .groupBy(sql`1`);
  return Object.fromEntries(rows.map((r) => [r.day, r.n]));
}
