import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { NotificationType } from "@/db/schema";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  activityId?: number | null;
  threadId?: number | null;
  collectionId?: number | null;
  mediaId?: number | null;
  context?: string | null;
};

/** Creates a notification unless it would notify someone about their own action. */
export async function notify(input: NotificationInput) {
  if (input.actorId && input.actorId === input.userId) return;
  // Avoid duplicates from like/unlike/like toggling.
  if (input.type.endsWith("_LIKE") && input.actorId) {
    const existing = await db.query.notification.findFirst({
      where: and(
        eq(schema.notification.userId, input.userId),
        eq(schema.notification.type, input.type),
        eq(schema.notification.actorId, input.actorId),
        input.activityId ? eq(schema.notification.activityId, input.activityId) : undefined,
        input.threadId ? eq(schema.notification.threadId, input.threadId) : undefined,
        input.collectionId ? eq(schema.notification.collectionId, input.collectionId) : undefined,
        input.context ? eq(schema.notification.context, input.context) : undefined,
      ),
    });
    if (existing) return;
  }
  await db.insert(schema.notification).values({
    userId: input.userId,
    type: input.type,
    actorId: input.actorId ?? null,
    activityId: input.activityId ?? null,
    threadId: input.threadId ?? null,
    collectionId: input.collectionId ?? null,
    mediaId: input.mediaId ?? null,
    context: input.context ?? null,
  });
}

const MENTION = /(?:^|[^A-Za-z0-9_])@([A-Za-z0-9_]{3,20})/g;

/** Usernames mentioned with @name in a piece of text. */
export function extractMentions(text: string): string[] {
  const names = new Set<string>();
  for (const m of text.matchAll(MENTION)) names.add(m[1].toLowerCase());
  return [...names].slice(0, 10);
}

export async function notifyMentions(text: string, actorId: string, target: { activityId?: number; threadId?: number }, skip: string[] = []) {
  const names = extractMentions(text);
  if (!names.length) return;
  const users = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(isNotNull(schema.user.username), inArray(schema.user.username, names)));
  for (const u of users) {
    if (skip.includes(u.id)) continue;
    await notify({ userId: u.id, type: "ACTIVITY_MENTION", actorId, ...target });
  }
}
