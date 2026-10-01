"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer, isModerator } from "@/lib/session";
import { notify, notifyMentions } from "@/lib/notify";
import { withinLimit } from "@/lib/rate-limit";
import { getActivities, getReplyItem, type ActivityItem, type ActivityScope, type ReplyItem } from "@/lib/queries/activity";
import { replySchema, textPostSchema } from "@/lib/validation";
import type { ActionResult } from "./list";

/* ------------------------------- Feed ------------------------------------ */

const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("home"), mode: z.enum(["following", "global"]), filter: z.enum(["all", "text", "list"]) }),
  z.object({ kind: z.literal("user"), userId: z.string().min(1).max(64), filter: z.enum(["all", "text", "list", "messages"]) }),
  z.object({ kind: z.literal("media"), mediaId: z.number().int().positive() }),
]);

/** Next page of a feed (client "Load more"). */
export async function loadActivities(scope: ActivityScope, beforeId?: number): Promise<ActivityItem[]> {
  const parsed = scopeSchema.safeParse(scope);
  if (!parsed.success) return [];
  const viewer = await getViewer();
  return getActivities(parsed.data, viewer?.id ?? null, beforeId && Number.isInteger(beforeId) ? beforeId : undefined);
}

/* ----------------------------- Posting ----------------------------------- */

export async function postStatus(text: string): Promise<ActionResult<ActivityItem>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = textPostSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid text." };
  if (!(await withinLimit(schema.activity, viewer.id, 20, 60 * 10))) return { ok: false, error: "You're posting too fast. Try again in a few minutes." };
  const [row] = await db.insert(schema.activity).values({ userId: viewer.id, type: "TEXT", text: parsed.data }).returning();
  await notifyMentions(parsed.data, viewer.id, { activityId: row.id });
  const [item] = await getActivities({ kind: "single", activityId: row.id }, viewer.id);
  refresh();
  return { ok: true, data: item };
}

/** A message posted on someone's profile (optionally private). */
export async function postMessage(recipientId: string, text: string, isPrivate: boolean): Promise<ActionResult<ActivityItem>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = textPostSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid text." };
  const recipient = await db.query.user.findFirst({ where: eq(schema.user.id, String(recipientId)), columns: { id: true } });
  if (!recipient) return { ok: false, error: "User not found." };
  if (!(await withinLimit(schema.activity, viewer.id, 20, 60 * 10))) return { ok: false, error: "You're posting too fast. Try again in a few minutes." };
  const [row] = await db
    .insert(schema.activity)
    .values({ userId: viewer.id, type: "MESSAGE", recipientId: recipient.id, text: parsed.data, private: Boolean(isPrivate) })
    .returning();
  await notify({ userId: recipient.id, type: "ACTIVITY_MESSAGE", actorId: viewer.id, activityId: row.id });
  if (!isPrivate) await notifyMentions(parsed.data, viewer.id, { activityId: row.id }, [recipient.id]);
  const [item] = await getActivities({ kind: "single", activityId: row.id }, viewer.id);
  refresh();
  return { ok: true, data: item };
}

export async function editActivityText(activityId: number, text: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = textPostSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid text." };
  const row = await db.query.activity.findFirst({ where: eq(schema.activity.id, Number(activityId)) });
  if (!row || row.userId !== viewer.id || row.type === "LIST") return { ok: false, error: "You can't edit that." };
  await db.update(schema.activity).set({ text: parsed.data }).where(eq(schema.activity.id, row.id));
  refresh();
  return { ok: true };
}

export async function deleteActivity(activityId: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await db.query.activity.findFirst({ where: eq(schema.activity.id, Number(activityId)) });
  if (!row) return { ok: true };
  const allowed = row.userId === viewer.id || row.recipientId === viewer.id || isModerator(viewer);
  if (!allowed) return { ok: false, error: "You can't delete that." };
  await db.delete(schema.activity).where(eq(schema.activity.id, row.id));
  refresh();
  return { ok: true };
}

/* ------------------------------ Likes ------------------------------------ */

export async function toggleActivityLike(activityId: number): Promise<ActionResult<{ liked: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await db.query.activity.findFirst({ where: eq(schema.activity.id, Number(activityId)) });
  if (!row) return { ok: false, error: "Activity not found." };
  const where = and(eq(schema.activityLike.activityId, row.id), eq(schema.activityLike.userId, viewer.id));
  const existing = await db.query.activityLike.findFirst({ where });
  if (existing) {
    await db.delete(schema.activityLike).where(where);
  } else {
    await db.insert(schema.activityLike).values({ activityId: row.id, userId: viewer.id }).onConflictDoNothing();
    await notify({ userId: row.userId, type: "ACTIVITY_LIKE", actorId: viewer.id, activityId: row.id });
  }
  return { ok: true, data: { liked: !existing } };
}

export async function toggleReplyLike(replyId: number): Promise<ActionResult<{ liked: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const reply = await db.query.activityReply.findFirst({ where: eq(schema.activityReply.id, Number(replyId)) });
  if (!reply) return { ok: false, error: "Reply not found." };
  const where = and(
    eq(schema.contentLike.target, "REPLY"),
    eq(schema.contentLike.targetId, reply.id),
    eq(schema.contentLike.userId, viewer.id),
  );
  const existing = await db.query.contentLike.findFirst({ where });
  if (existing) {
    await db.delete(schema.contentLike).where(where);
  } else {
    await db.insert(schema.contentLike).values({ target: "REPLY", targetId: reply.id, userId: viewer.id }).onConflictDoNothing();
    await notify({ userId: reply.userId, type: "REPLY_LIKE", actorId: viewer.id, activityId: reply.activityId, context: String(reply.id) });
  }
  return { ok: true, data: { liked: !existing } };
}

/* ----------------------------- Replies ----------------------------------- */

export async function postReply(activityId: number, text: string): Promise<ActionResult<ReplyItem>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = replySchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  const activity = await db.query.activity.findFirst({ where: eq(schema.activity.id, Number(activityId)) });
  if (!activity) return { ok: false, error: "Activity not found." };
  if (activity.private && activity.userId !== viewer.id && activity.recipientId !== viewer.id) return { ok: false, error: "Activity not found." };
  if (!(await withinLimit(schema.activityReply, viewer.id, 30, 60 * 10))) return { ok: false, error: "You're replying too fast. Try again in a few minutes." };
  const [row] = await db.insert(schema.activityReply).values({ activityId: activity.id, userId: viewer.id, text: parsed.data }).returning();
  await notify({ userId: activity.userId, type: "ACTIVITY_REPLY", actorId: viewer.id, activityId: activity.id });
  if (activity.recipientId && activity.recipientId !== activity.userId) {
    await notify({ userId: activity.recipientId, type: "ACTIVITY_REPLY", actorId: viewer.id, activityId: activity.id });
  }
  await notifyMentions(parsed.data, viewer.id, { activityId: activity.id }, [activity.userId, activity.recipientId ?? ""]);
  const item = await getReplyItem(row.id, viewer.id);
  return item ? { ok: true, data: item } : { ok: false, error: "Couldn't load reply." };
}

export async function deleteReply(replyId: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const reply = await db.query.activityReply.findFirst({ where: eq(schema.activityReply.id, Number(replyId)) });
  if (!reply) return { ok: true };
  const activity = await db.query.activity.findFirst({ where: eq(schema.activity.id, reply.activityId) });
  const allowed = reply.userId === viewer.id || activity?.userId === viewer.id || isModerator(viewer);
  if (!allowed) return { ok: false, error: "You can't delete that." };
  await db.delete(schema.activityReply).where(eq(schema.activityReply.id, reply.id));
  await db.delete(schema.contentLike).where(and(eq(schema.contentLike.target, "REPLY"), eq(schema.contentLike.targetId, reply.id)));
  return { ok: true };
}

/* ----------------------------- Following --------------------------------- */

export async function toggleFollow(userId: string): Promise<ActionResult<{ following: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const target = String(userId);
  if (target === viewer.id) return { ok: false, error: "You can't follow yourself." };
  const exists = await db.query.user.findFirst({ where: eq(schema.user.id, target), columns: { id: true } });
  if (!exists) return { ok: false, error: "User not found." };
  const where = and(eq(schema.follow.followerId, viewer.id), eq(schema.follow.followingId, target));
  const existing = await db.query.follow.findFirst({ where });
  if (existing) {
    await db.delete(schema.follow).where(where);
  } else {
    await db.insert(schema.follow).values({ followerId: viewer.id, followingId: target }).onConflictDoNothing();
    await notify({ userId: target, type: "FOLLOWING", actorId: viewer.id });
  }
  refresh();
  return { ok: true, data: { following: !existing } };
}
