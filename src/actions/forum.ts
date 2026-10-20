"use server";

import { refresh } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer, isModerator } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { notify, notifyMentions } from "@/lib/notify";
import { withinLimit } from "@/lib/rate-limit";
import { FORUM_CATEGORIES } from "@/lib/forum";
import type { ForumCategory } from "@/db/schema";
import type { ActionResult } from "./list";

const categories = FORUM_CATEGORIES.map((c) => c.key) as [ForumCategory, ...ForumCategory[]];

const threadInput = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(150),
  body: z.string().trim().min(1, "Write something first.").max(20000),
  category: z.enum(categories),
  mediaType: z.enum(["movie", "tv", "anime", "game", "manga", "book", "music"]).nullable(),
  tmdbId: z.number().int().positive().nullable(),
});

export async function createThread(raw: z.infer<typeof threadInput>): Promise<ActionResult<{ id: number }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = threadInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid thread." };
  if (!(await withinLimit(schema.forumThread, viewer.id, 5, 60 * 30))) return { ok: false, error: "You've started a lot of threads recently. Try again later." };
  let mediaId: number | null = null;
  if (parsed.data.mediaType && parsed.data.tmdbId) {
    const media = await ensureMedia(parsed.data.mediaType, parsed.data.tmdbId);
    mediaId = media?.id ?? null;
  }
  const [row] = await db
    .insert(schema.forumThread)
    .values({
      userId: viewer.id,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      mediaId,
      lastReplyAt: new Date(),
      lastReplyUserId: viewer.id,
    })
    .returning({ id: schema.forumThread.id });
  await notifyMentions(parsed.data.body, viewer.id, { threadId: row.id });
  return { ok: true, data: { id: row.id } };
}

export async function editThread(id: number, raw: { title: string; body: string }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = threadInput.pick({ title: true, body: true }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid thread." };
  const thread = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, Number(id)) });
  if (!thread || (thread.userId !== viewer.id && !isModerator(viewer))) return { ok: false, error: "You can't edit that." };
  await db.update(schema.forumThread).set(parsed.data).where(eq(schema.forumThread.id, thread.id));
  refresh();
  return { ok: true };
}

export async function deleteThread(id: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const thread = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, Number(id)) });
  if (!thread) return { ok: true };
  if (thread.userId !== viewer.id && !isModerator(viewer)) return { ok: false, error: "You can't delete that." };
  await db.delete(schema.forumThread).where(eq(schema.forumThread.id, thread.id));
  return { ok: true };
}

export async function setThreadFlags(id: number, flags: { pinned?: boolean; locked?: boolean }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !isModerator(viewer)) return { ok: false, error: "Moderators only." };
  const set: { pinned?: boolean; locked?: boolean } = {};
  if (typeof flags.pinned === "boolean") set.pinned = flags.pinned;
  if (typeof flags.locked === "boolean") set.locked = flags.locked;
  if (Object.keys(set).length) await db.update(schema.forumThread).set(set).where(eq(schema.forumThread.id, Number(id)));
  refresh();
  return { ok: true };
}

const commentBody = z.string().trim().min(1, "Write something first.").max(10000);

async function syncThreadCounters(threadId: number) {
  const [stats] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.forumComment)
    .where(eq(schema.forumComment.threadId, threadId));
  const last = await db.query.forumComment.findFirst({
    where: eq(schema.forumComment.threadId, threadId),
    orderBy: desc(schema.forumComment.createdAt),
  });
  const thread = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, threadId) });
  await db
    .update(schema.forumThread)
    .set({
      replyCount: stats?.n ?? 0,
      lastReplyAt: last?.createdAt ?? thread?.createdAt ?? new Date(),
      lastReplyUserId: last?.userId ?? thread?.userId ?? null,
    })
    .where(eq(schema.forumThread.id, threadId));
}

export async function postComment(threadId: number, body: string, parentId?: number | null): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = commentBody.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  const thread = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, Number(threadId)) });
  if (!thread) return { ok: false, error: "Thread not found." };
  if (thread.locked && !isModerator(viewer)) return { ok: false, error: "This thread is locked." };
  if (!(await withinLimit(schema.forumComment, viewer.id, 20, 60 * 10))) return { ok: false, error: "You're commenting too fast. Try again in a few minutes." };

  let parent: typeof schema.forumComment.$inferSelect | undefined;
  if (parentId) {
    parent = await db.query.forumComment.findFirst({ where: eq(schema.forumComment.id, Number(parentId)) });
    if (!parent || parent.threadId !== thread.id) return { ok: false, error: "Comment not found." };
    // Keep nesting to one level.
    if (parent.parentId) parent = await db.query.forumComment.findFirst({ where: eq(schema.forumComment.id, parent.parentId) });
  }

  await db.insert(schema.forumComment).values({ threadId: thread.id, userId: viewer.id, body: parsed.data, parentId: parent?.id ?? null });
  await syncThreadCounters(thread.id);
  await notify({ userId: thread.userId, type: "THREAD_REPLY", actorId: viewer.id, threadId: thread.id });
  if (parent && parent.userId !== thread.userId) {
    await notify({ userId: parent.userId, type: "THREAD_REPLY", actorId: viewer.id, threadId: thread.id });
  }
  await notifyMentions(parsed.data, viewer.id, { threadId: thread.id }, [thread.userId, parent?.userId ?? ""]);
  refresh();
  return { ok: true };
}

export async function editComment(id: number, body: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = commentBody.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  const comment = await db.query.forumComment.findFirst({ where: eq(schema.forumComment.id, Number(id)) });
  if (!comment || (comment.userId !== viewer.id && !isModerator(viewer))) return { ok: false, error: "You can't edit that." };
  await db.update(schema.forumComment).set({ body: parsed.data }).where(eq(schema.forumComment.id, comment.id));
  refresh();
  return { ok: true };
}

export async function deleteComment(id: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const comment = await db.query.forumComment.findFirst({ where: eq(schema.forumComment.id, Number(id)) });
  if (!comment) return { ok: true };
  if (comment.userId !== viewer.id && !isModerator(viewer)) return { ok: false, error: "You can't delete that." };
  // Children go with their parent.
  await db.delete(schema.forumComment).where(eq(schema.forumComment.parentId, comment.id));
  await db.delete(schema.forumComment).where(eq(schema.forumComment.id, comment.id));
  await syncThreadCounters(comment.threadId);
  refresh();
  return { ok: true };
}

export async function toggleForumLike(target: "THREAD" | "COMMENT", id: number): Promise<ActionResult<{ liked: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const kind = target === "THREAD" ? "THREAD" : "COMMENT";
  let owner: { id: number; userId: string; threadId: number } | undefined;
  if (kind === "THREAD") {
    const t = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, Number(id)), columns: { id: true, userId: true } });
    owner = t ? { ...t, threadId: t.id } : undefined;
  } else {
    owner = await db.query.forumComment.findFirst({ where: eq(schema.forumComment.id, Number(id)), columns: { id: true, userId: true, threadId: true } });
  }
  if (!owner) return { ok: false, error: "Not found." };
  const where = and(eq(schema.contentLike.target, kind), eq(schema.contentLike.targetId, owner.id), eq(schema.contentLike.userId, viewer.id));
  const existing = await db.query.contentLike.findFirst({ where });
  if (existing) await db.delete(schema.contentLike).where(where);
  else {
    await db.insert(schema.contentLike).values({ target: kind, targetId: owner.id, userId: viewer.id }).onConflictDoNothing();
    await notify({
      userId: owner.userId,
      type: "THREAD_COMMENT_LIKE",
      actorId: viewer.id,
      threadId: owner.threadId,
      context: `${kind}:${owner.id}`,
    });
  }
  return { ok: true, data: { liked: !existing } };
}
