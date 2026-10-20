import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ListStatus } from "@/lib/format";
import type { MediaType } from "@/lib/media";

type EntryState = { status: ListStatus; progress: number; private?: boolean } | null;

/**
 * Records a list activity ("Watched episode 4 - 6 of …",
 * "Completed …"). Consecutive episode updates within an hour are merged into
 * a single activity instead of spamming the feed.
 */
export async function recordListActivity(
  userId: string,
  media: { id: number; type: MediaType },
  prev: EntryState,
  next: EntryState,
) {
  if (!next || next.private) return;
  const statusChanged = !prev || prev.status !== next.status;
  const progressUp = next.progress > (prev?.progress ?? 0);

  let status: string | null = null;
  let progress: string | null = null;
  const isManga = media.type === "manga";
  const isBook = media.type === "book";
  const isMusic = media.type === "music";
  const isGame = media.type === "game";
  const hasUnits = media.type === "tv" || media.type === "anime" || media.type === "manga" || media.type === "book";
  const unit = isBook ? "page" : isManga ? "chapter" : "episode";

  switch (next.status) {
    case "PLANNING":
      if (statusChanged) status = isGame ? "plans to play" : isBook || isManga ? "plans to read" : isMusic ? "plans to listen" : "plans to watch";
      break;
    case "COMPLETED":
      if (statusChanged) status = isMusic ? "listened to" : "completed";
      break;
    case "DROPPED":
      if (statusChanged) {
        status = "dropped";
        if (hasUnits && next.progress > 0) progress = `${unit} ${next.progress}`;
      }
      break;
    case "PAUSED":
      if (statusChanged) {
        status = isGame ? "paused playing" : isBook || isManga ? "paused reading" : isMusic ? "paused listening" : "paused watching";
        if (hasUnits && next.progress > 0) progress = `${unit} ${next.progress}`;
      }
      break;
    case "CURRENT":
    case "REPEATING": {
      const verb = isBook
        ? next.status === "REPEATING" ? "reread page" : "read page"
        : isManga
          ? next.status === "REPEATING" ? "reread chapter" : "read chapter"
          : isMusic
            ? next.status === "REPEATING" ? "relistened to" : "listened to"
            : next.status === "REPEATING" ? "rewatched episode" : "watched episode";
      if (hasUnits && progressUp) {
        status = verb;
        const from = statusChanged && next.status === "REPEATING" ? 1 : (prev?.progress ?? 0) + 1;
        progress = from >= next.progress ? String(next.progress) : `${from} - ${next.progress}`;
      } else if (statusChanged) {
        status = isGame
          ? next.status === "REPEATING" ? "is replaying" : "is playing"
          : isBook || isManga
            ? next.status === "REPEATING" ? "is rereading" : "started reading"
            : isMusic
              ? next.status === "REPEATING" ? "is relistening" : "started listening"
              : next.status === "REPEATING" ? "is rewatching" : media.type === "movie" ? "is watching" : "started watching";
      }
      break;
    }
  }
  if (!status) return;

  // Merge with a recent episode/chapter/page activity for the same title.
  if (
    status === "watched episode" ||
    status === "rewatched episode" ||
    status === "read chapter" ||
    status === "reread chapter" ||
    status === "read page" ||
    status === "reread page"
  ) {
    const recent = await db.query.activity.findFirst({
      where: and(
        eq(schema.activity.userId, userId),
        eq(schema.activity.type, "LIST"),
        gt(schema.activity.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
      orderBy: desc(schema.activity.createdAt),
    });
    if (recent && recent.mediaId === media.id && recent.status === status && recent.progress) {
      const [likes, replies] = await Promise.all([
        db.query.activityLike.findFirst({ where: eq(schema.activityLike.activityId, recent.id) }),
        db.query.activityReply.findFirst({ where: eq(schema.activityReply.activityId, recent.id) }),
      ]);
      // Only fold into activities nobody has interacted with yet; re-insert so it sorts as newest.
      if (!likes && !replies) {
        const start = Number(recent.progress.split(" - ")[0]);
        progress = start >= next.progress ? String(next.progress) : `${start} - ${next.progress}`;
        await db.delete(schema.activity).where(eq(schema.activity.id, recent.id));
      }
    }
  }

  await db.insert(schema.activity).values({ userId, type: "LIST", mediaId: media.id, status, progress });
}

/** Sentence for a list activity, e.g. "Watched episode 4 - 6 of". */
export function describeListActivity(status: string | null, progress: string | null): { lead: string; suffix: string } {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!status) return { lead: "", suffix: "" };
  if (progress) return { lead: `${cap(status)} ${progress} of`, suffix: "" };
  return { lead: cap(status), suffix: "" };
}
