import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, schema } from "@/db";
import { Comments, ThreadPost } from "@/components/forum/thread-client";
import { Cover } from "@/components/ui/cover";
import { Page } from "@/components/ui/basics";
import { getViewer, isModerator, displayName } from "@/lib/session";
import { categoryInfo } from "@/lib/forum";

export async function generateMetadata({ params }: PageProps<"/forum/thread/[id]">): Promise<Metadata> {
  const { id } = await params;
  const thread = await db.query.forumThread.findFirst({ where: eq(schema.forumThread.id, Number(id)), columns: { title: true, body: true } });
  return thread ? { title: thread.title, description: thread.body.slice(0, 160) } : {};
}

const likesOf = (target: "THREAD" | "COMMENT", idCol: typeof schema.forumThread.id | typeof schema.forumComment.id) =>
  sql<number>`(select count(*) from ${schema.contentLike} where ${schema.contentLike.target} = ${target} and ${schema.contentLike.targetId} = ${idCol})::int`;

export default async function ThreadPage({ params }: PageProps<"/forum/thread/[id]">) {
  const { id } = await params;
  const threadId = Number(id);
  if (!Number.isInteger(threadId) || threadId <= 0) notFound();
  const viewer = await getViewer();
  const thread = await db.query.forumThread.findFirst({
    where: eq(schema.forumThread.id, threadId),
    with: {
      user: { columns: { username: true, displayUsername: true, name: true, image: true } },
      media: { columns: { type: true, tmdbId: true, title: true, posterPath: true } },
    },
  });
  if (!thread) notFound();

  const likedBy = (target: "THREAD" | "COMMENT", idCol: typeof schema.forumThread.id | typeof schema.forumComment.id) =>
    viewer
      ? sql<boolean>`exists(select 1 from ${schema.contentLike} where ${schema.contentLike.target} = ${target} and ${schema.contentLike.targetId} = ${idCol} and ${schema.contentLike.userId} = ${viewer.id})`
      : sql<boolean>`false`;

  const [[threadLikes], comments] = await Promise.all([
    db
      .select({ likes: likesOf("THREAD", schema.forumThread.id), liked: likedBy("THREAD", schema.forumThread.id) })
      .from(schema.forumThread)
      .where(eq(schema.forumThread.id, threadId)),
    db
      .select({
        id: schema.forumComment.id,
        parentId: schema.forumComment.parentId,
        userId: schema.forumComment.userId,
        body: schema.forumComment.body,
        createdAt: schema.forumComment.createdAt,
        updatedAt: schema.forumComment.updatedAt,
        likes: likesOf("COMMENT", schema.forumComment.id),
        liked: likedBy("COMMENT", schema.forumComment.id),
        user: { username: schema.user.username, displayUsername: schema.user.displayUsername, name: schema.user.name, image: schema.user.image },
      })
      .from(schema.forumComment)
      .innerJoin(schema.user, eq(schema.user.id, schema.forumComment.userId))
      .where(and(eq(schema.forumComment.threadId, threadId)))
      .orderBy(asc(schema.forumComment.createdAt))
      .limit(1000),
  ]);

  // Count the view after responding.
  after(async () => {
    await db
      .update(schema.forumThread)
      .set({ viewCount: sql`${schema.forumThread.viewCount} + 1`, updatedAt: thread.updatedAt })
      .where(eq(schema.forumThread.id, threadId));
  });

  const cat = categoryInfo(thread.category);
  const feedViewer = viewer ? { id: viewer.id, moderator: isModerator(viewer) } : null;

  return (
    <Page narrow>
      <div className="mx-auto max-w-[860px]">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px]">
          <Link href="/forum" className="font-semibold text-text-lighter hover:text-accent">
            Forum
          </Link>
          <span className="text-text-lighter">/</span>
          <Link href={`/forum?category=${cat.key}`} className="rounded-full px-2 py-px font-bold text-white" style={{ background: cat.color }}>
            {cat.label}
          </Link>
        </div>
        {thread.media && (
          <Link href={`/${thread.media.type}/${thread.media.tmdbId}`} className="card group mb-4 flex items-center gap-3 p-2.5">
            <Cover path={thread.media.posterPath} alt="" size="w92" className="h-[48px] w-[34px] rounded-sm" />
            <span className="text-[13px]">
              Discussing <strong className="text-bright transition group-hover:text-accent">{thread.media.title}</strong>
            </span>
          </Link>
        )}
        <ThreadPost
          viewer={feedViewer}
          thread={{
            id: thread.id,
            title: thread.title,
            body: thread.body,
            userId: thread.userId,
            user: { username: thread.user.username ?? "", name: displayName(thread.user), image: thread.user.image },
            createdAt: thread.createdAt.toISOString(),
            edited: false,
            pinned: thread.pinned,
            locked: thread.locked,
            likes: threadLikes?.likes ?? 0,
            liked: Boolean(threadLikes?.liked),
          }}
        />
        <h2 className="mt-10 mb-4 text-[15px] font-bold tracking-wide text-bright uppercase">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h2>
        <Comments
          threadId={thread.id}
          viewer={feedViewer}
          locked={thread.locked}
          comments={comments.map((c) => ({
            id: c.id,
            parentId: c.parentId,
            userId: c.userId,
            user: { username: c.user.username ?? "", name: displayName(c.user), image: c.user.image },
            body: c.body,
            createdAt: c.createdAt.toISOString(),
            edited: c.updatedAt.getTime() - c.createdAt.getTime() > 60_000,
            likes: c.likes,
            liked: Boolean(c.liked),
          }))}
        />
      </div>
    </Page>
  );
}
