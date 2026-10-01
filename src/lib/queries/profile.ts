import "server-only";
import { cache } from "react";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";

/** Profile owner + relationship to the viewer, deduped per request. */
export const getProfile = cache(async (usernameParam: string) => {
  const username = decodeURIComponent(usernameParam).toLowerCase();
  if (!/^[a-z0-9_]{1,30}$/.test(username)) return null;
  const user = await db.query.user.findFirst({ where: eq(schema.user.username, username) });
  if (!user) return null;
  const viewer = await getViewer();
  const [[followers], [following], followRow] = await Promise.all([
    db.select({ n: count() }).from(schema.follow).where(eq(schema.follow.followingId, user.id)),
    db.select({ n: count() }).from(schema.follow).where(eq(schema.follow.followerId, user.id)),
    viewer && viewer.id !== user.id
      ? db.query.follow.findFirst({
          where: and(eq(schema.follow.followerId, viewer.id), eq(schema.follow.followingId, user.id)),
        })
      : null,
  ]);
  return {
    user,
    name: user.displayUsername || user.username || user.name,
    viewer,
    isSelf: viewer?.id === user.id,
    isFollowing: Boolean(followRow),
    followers: followers?.n ?? 0,
    following: following?.n ?? 0,
  };
});
