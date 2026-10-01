import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import { getMediaDetails } from "@/lib/tmdb";
import { findMedia, refreshMediaIfStale } from "@/lib/queries/media";
import type { SavedEntry } from "@/actions/list";
import { isMediaType, type MediaType } from "@/lib/media";
import type { ScoreFormat } from "@/lib/format";

async function viewerRegion(): Promise<string> {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
  return country && /^[A-Z]{2}$/.test(country) ? country : "US";
}

/** Everything the media layout + tabs need, deduped per request. */
export const getMediaPage = cache(async (typeParam: string, idParam: string) => {
  if (!isMediaType(typeParam)) return null;
  const type: MediaType = typeParam;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;

  const details = await getMediaDetails(type, id, await viewerRegion());
  if (!details) return null;

  const [viewer, row] = await Promise.all([getViewer(), refreshMediaIfStale(details).then((r) => r ?? findMedia(type, id))]);

  let entry: SavedEntry | null = null;
  let favourite = false;
  if (viewer && row) {
    const [e, f] = await Promise.all([
      db.query.listEntry.findFirst({
        where: and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, row.id)),
      }),
      db.query.favourite.findFirst({
        where: and(eq(schema.favourite.userId, viewer.id), eq(schema.favourite.mediaId, row.id)),
      }),
    ]);
    if (e) {
      entry = {
        status: e.status,
        score: e.score,
        progress: e.progress,
        repeat: e.repeat,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        notes: e.notes,
        private: e.private,
      };
    }
    favourite = Boolean(f);
  }

  let favourites = 0;
  if (row) {
    const [r] = await db.select({ n: count() }).from(schema.favourite).where(eq(schema.favourite.mediaId, row.id));
    favourites = r?.n ?? 0;
  }

  return {
    type,
    id,
    details,
    row: row ?? null,
    viewer,
    entry,
    favourite,
    favourites,
    scoreFormat: (viewer?.scoreFormat ?? "POINT_10_DECIMAL") as ScoreFormat,
  };
});
