import "server-only";
import { and, desc, eq, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "@/db";

export interface ActivityUser {
  username: string;
  name: string;
  image: string | null;
}

export interface ReplyItem {
  id: number;
  createdAt: string;
  user: ActivityUser;
  userId: string;
  text: string;
  likeCount: number;
  liked: boolean;
}

export interface ActivityItem {
  id: number;
  type: "LIST" | "TEXT" | "MESSAGE";
  createdAt: string;
  userId: string;
  user: ActivityUser;
  recipient: ActivityUser | null;
  recipientId: string | null;
  media: { type: "movie" | "tv"; tmdbId: number; title: string; posterPath: string | null } | null;
  status: string | null;
  progress: string | null;
  text: string | null;
  private: boolean;
  likeCount: number;
  liked: boolean;
  replyCount: number;
  replies: ReplyItem[];
}

export type ActivityScope =
  | { kind: "home"; mode: "following" | "global"; filter: "all" | "text" | "list" }
  | { kind: "user"; userId: string; filter: "all" | "text" | "list" | "messages" }
  | { kind: "media"; mediaId: number }
  | { kind: "single"; activityId: number };

export const FEED_PAGE = 20;

function toUser(u: { username: string | null; displayUsername: string | null; name: string; image: string | null }): ActivityUser {
  return { username: u.username ?? "", name: u.displayUsername || u.username || u.name, image: u.image };
}

/** Visibility: private messages only for sender and recipient. */
function visibleTo(viewerId: string | null): SQL {
  if (!viewerId) return eq(schema.activity.private, false);
  return or(
    eq(schema.activity.private, false),
    eq(schema.activity.userId, viewerId),
    eq(schema.activity.recipientId, viewerId),
  )!;
}

async function scopeCondition(scope: ActivityScope, viewerId: string | null): Promise<SQL | undefined> {
  switch (scope.kind) {
    case "home": {
      const typeCond =
        scope.filter === "text"
          ? eq(schema.activity.type, "TEXT")
          : scope.filter === "list"
            ? eq(schema.activity.type, "LIST")
            : inArray(schema.activity.type, ["LIST", "TEXT"]);
      if (scope.mode === "global" || !viewerId) return typeCond;
      const following = db
        .select({ id: schema.follow.followingId })
        .from(schema.follow)
        .where(eq(schema.follow.followerId, viewerId));
      return and(typeCond, or(eq(schema.activity.userId, viewerId), inArray(schema.activity.userId, following)));
    }
    case "user": {
      if (scope.filter === "messages") return eq(schema.activity.recipientId, scope.userId);
      if (scope.filter === "text") return and(eq(schema.activity.userId, scope.userId), eq(schema.activity.type, "TEXT"));
      if (scope.filter === "list") return and(eq(schema.activity.userId, scope.userId), eq(schema.activity.type, "LIST"));
      return or(
        and(eq(schema.activity.userId, scope.userId), inArray(schema.activity.type, ["LIST", "TEXT"])),
        eq(schema.activity.recipientId, scope.userId),
      );
    }
    case "media":
      return eq(schema.activity.mediaId, scope.mediaId);
    case "single":
      return eq(schema.activity.id, scope.activityId);
  }
}

/** Newest-first activities for a scope; pass the last seen id to page. */
export async function getActivities(scope: ActivityScope, viewerId: string | null, beforeId?: number): Promise<ActivityItem[]> {
  const author = alias(schema.user, "author");
  const recipient = alias(schema.user, "recipient");
  const cond = await scopeCondition(scope, viewerId);
  const likeCount = sql<number>`(select count(*) from ${schema.activityLike} where ${schema.activityLike.activityId} = ${schema.activity.id})::int`;
  const replyCount = sql<number>`(select count(*) from ${schema.activityReply} where ${schema.activityReply.activityId} = ${schema.activity.id})::int`;
  const liked = viewerId
    ? sql<boolean>`exists(select 1 from ${schema.activityLike} where ${schema.activityLike.activityId} = ${schema.activity.id} and ${schema.activityLike.userId} = ${viewerId})`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      id: schema.activity.id,
      type: schema.activity.type,
      createdAt: schema.activity.createdAt,
      userId: schema.activity.userId,
      recipientId: schema.activity.recipientId,
      status: schema.activity.status,
      progress: schema.activity.progress,
      text: schema.activity.text,
      private: schema.activity.private,
      author: { username: author.username, displayUsername: author.displayUsername, name: author.name, image: author.image },
      recipient: { username: recipient.username, displayUsername: recipient.displayUsername, name: recipient.name, image: recipient.image },
      media: {
        type: schema.media.type,
        tmdbId: schema.media.tmdbId,
        title: schema.media.title,
        posterPath: schema.media.posterPath,
      },
      likeCount,
      replyCount,
      liked,
    })
    .from(schema.activity)
    .innerJoin(author, eq(author.id, schema.activity.userId))
    .leftJoin(recipient, eq(recipient.id, schema.activity.recipientId))
    .leftJoin(schema.media, eq(schema.media.id, schema.activity.mediaId))
    .where(and(cond, visibleTo(viewerId), beforeId ? lt(schema.activity.id, beforeId) : undefined))
    .orderBy(desc(schema.activity.id))
    .limit(scope.kind === "single" ? 1 : FEED_PAGE);

  const ids = rows.map((r) => r.id);
  const replies = ids.length ? await getReplies(ids, viewerId) : [];

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.createdAt.toISOString(),
    userId: r.userId,
    user: toUser(r.author),
    recipient: r.recipient?.name ? toUser(r.recipient as Parameters<typeof toUser>[0]) : null,
    recipientId: r.recipientId,
    media: r.media?.tmdbId ? (r.media as ActivityItem["media"]) : null,
    status: r.status,
    progress: r.progress,
    text: r.text,
    private: r.private,
    likeCount: r.likeCount,
    liked: Boolean(r.liked),
    replyCount: r.replyCount,
    replies: replies.filter((x) => x.activityId === r.id).map(({ activityId: _a, ...rest }) => rest),
  }));
}

async function getReplies(activityIds: number[], viewerId: string | null) {
  const likeCount = sql<number>`(select count(*) from ${schema.contentLike} where ${schema.contentLike.target} = 'REPLY' and ${schema.contentLike.targetId} = ${schema.activityReply.id})::int`;
  const liked = viewerId
    ? sql<boolean>`exists(select 1 from ${schema.contentLike} where ${schema.contentLike.target} = 'REPLY' and ${schema.contentLike.targetId} = ${schema.activityReply.id} and ${schema.contentLike.userId} = ${viewerId})`
    : sql<boolean>`false`;
  const rows = await db
    .select({
      id: schema.activityReply.id,
      activityId: schema.activityReply.activityId,
      createdAt: schema.activityReply.createdAt,
      text: schema.activityReply.text,
      userId: schema.activityReply.userId,
      user: { username: schema.user.username, displayUsername: schema.user.displayUsername, name: schema.user.name, image: schema.user.image },
      likeCount,
      liked,
    })
    .from(schema.activityReply)
    .innerJoin(schema.user, eq(schema.user.id, schema.activityReply.userId))
    .where(inArray(schema.activityReply.activityId, activityIds))
    .orderBy(schema.activityReply.createdAt);
  return rows.map((r) => ({
    id: r.id,
    activityId: r.activityId,
    createdAt: r.createdAt.toISOString(),
    user: toUser(r.user),
    userId: r.userId,
    text: r.text,
    likeCount: r.likeCount,
    liked: Boolean(r.liked),
  }));
}

export async function getReplyItem(replyId: number, viewerId: string | null): Promise<ReplyItem | null> {
  const [row] = await db
    .select({
      id: schema.activityReply.id,
      activityId: schema.activityReply.activityId,
    })
    .from(schema.activityReply)
    .where(eq(schema.activityReply.id, replyId));
  if (!row) return null;
  const replies = await getReplies([row.activityId], viewerId);
  const found = replies.find((r) => r.id === replyId);
  if (!found) return null;
  const { activityId: _a, ...rest } = found;
  return rest;
}
