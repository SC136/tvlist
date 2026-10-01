import { NextResponse } from "next/server";
import { and, asc, eq, inArray, isNotNull, lte, or, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { getMediaDetails } from "@/lib/tmdb";
import { upsertMedia } from "@/lib/queries/media";
import { notify } from "@/lib/notify";
import { todayIso } from "@/lib/format";

export const maxDuration = 60;

/**
 * Daily job (Vercel Cron): for shows whose stored "next episode" has now aired,
 * notify everyone watching/planning them, then refresh the snapshot so the
 * next air date is current. Also refreshes a batch of stale airing shows.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET" automatically once CRON_SECRET is set.
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayIso();
  const dayAgo = new Date(Date.now() - 86_400_000);
  const due = await db
    .select()
    .from(schema.media)
    .where(
      and(
        eq(schema.media.type, "tv"),
        or(
          and(isNotNull(schema.media.nextEpisodeAirDate), lte(schema.media.nextEpisodeAirDate, today)),
          and(inArray(schema.media.status, ["Airing", "Returning", "In Production", "Upcoming"]), lt(schema.media.updatedAt, dayAgo)),
        ),
      ),
    )
    .orderBy(asc(schema.media.updatedAt))
    .limit(40);

  let notified = 0;
  for (const media of due) {
    if (media.nextEpisodeAirDate && media.nextEpisodeAirDate <= today && media.nextEpisodeNumber) {
      const watchers = await db
        .select({ userId: schema.listEntry.userId })
        .from(schema.listEntry)
        .where(and(eq(schema.listEntry.mediaId, media.id), inArray(schema.listEntry.status, ["CURRENT", "REPEATING", "PLANNING"])));
      for (const w of watchers) {
        await notify({ userId: w.userId, type: "AIRING", mediaId: media.id, context: String(media.nextEpisodeNumber) });
        notified++;
      }
    }
    const details = await getMediaDetails("tv", media.tmdbId).catch(() => null);
    if (details) await upsertMedia(details);
    else await db.update(schema.media).set({ nextEpisodeAirDate: null, updatedAt: new Date() }).where(eq(schema.media.id, media.id));
  }

  return NextResponse.json({ refreshed: due.length, notified });
}
