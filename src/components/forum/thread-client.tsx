"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Loader2, Lock, MessageSquare, Pencil, Pin, Trash2 } from "lucide-react";
import { deleteComment, deleteThread, editComment, editThread, postComment, setThreadFlags, toggleForumLike } from "@/actions/forum";
import { Avatar } from "@/components/ui/avatar";
import { ClientTime } from "@/components/social/client-time";
import { RichText } from "@/components/social/rich-text";
import { cn } from "@/lib/cn";

export interface ForumUser {
  username: string;
  name: string;
  image: string | null;
}

export interface CommentItem {
  id: number;
  parentId: number | null;
  userId: string;
  user: ForumUser;
  body: string;
  createdAt: string;
  edited: boolean;
  likes: number;
  liked: boolean;
}

export interface ThreadData {
  id: number;
  title: string;
  body: string;
  userId: string;
  user: ForumUser;
  createdAt: string;
  edited: boolean;
  pinned: boolean;
  locked: boolean;
  likes: number;
  liked: boolean;
}

interface Viewer {
  id: string;
  moderator: boolean;
}

function LikeButton({ target, id, likes, liked: initial, viewer }: { target: "THREAD" | "COMMENT"; id: number; likes: number; liked: boolean; viewer: Viewer | null }) {
  const router = useRouter();
  const [liked, setLiked] = useState(initial);
  const [, start] = useTransition();
  const n = likes - (initial ? 1 : 0) + (liked ? 1 : 0);
  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={() => {
        if (!viewer) return router.push("/login");
        setLiked(!liked);
        start(async () => {
          const res = await toggleForumLike(target, id);
          if (!res.ok) setLiked(liked);
        });
      }}
      className={cn("flex items-center gap-1 transition hover:text-red", liked && "text-red")}
    >
      {n > 0 && n}
      <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
    </button>
  );
}

export function ThreadPost({ thread, viewer }: { thread: ThreadData; viewer: Viewer | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const [body, setBody] = useState(thread.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canEdit = viewer && (viewer.id === thread.userId || viewer.moderator);

  return (
    <article className="card p-5 md:p-6">
      {editing ? (
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className="input-grey text-[16px] font-bold" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={20000} className="input-grey resize-y" />
          {error && <p className="text-[12px] text-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await editThread(thread.id, { title, body });
                  if (!res.ok) return setError(res.error);
                  setEditing(false);
                })
              }
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="flex items-center gap-2 text-[20px] font-bold text-bright md:text-[24px]">
            {thread.pinned && <Pin className="h-5 w-5 text-accent" />}
            {thread.locked && <Lock className="h-5 w-5 text-text-lighter" />}
            {title}
          </h1>
          <div className="mt-3 mb-5 flex items-center gap-2 text-[13px]">
            <Link href={`/user/${thread.user.username}`} className="flex items-center gap-2 font-semibold text-accent">
              <Avatar src={thread.user.image} name={thread.user.name} size={28} />
              {thread.user.name}
            </Link>
            <span className="text-text-lighter">
              · <ClientTime iso={thread.createdAt} />
              {thread.edited && " · edited"}
            </span>
          </div>
          <RichText text={body} />
        </>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-fg-grey-dark pt-3 text-[12px] font-semibold text-text-lighter">
        <div className="flex items-center gap-3">
          {canEdit && !editing && (
            <>
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 hover:text-accent">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  confirm("Delete this thread and all its comments?") &&
                  start(async () => {
                    const res = await deleteThread(thread.id);
                    if (res.ok) router.push("/forum");
                  })
                }
                className="flex items-center gap-1 hover:text-red"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
          {viewer?.moderator && (
            <>
              <button type="button" onClick={() => start(async () => void (await setThreadFlags(thread.id, { pinned: !thread.pinned })))} className="hover:text-accent">
                {thread.pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" onClick={() => start(async () => void (await setThreadFlags(thread.id, { locked: !thread.locked })))} className="hover:text-accent">
                {thread.locked ? "Unlock" : "Lock"}
              </button>
            </>
          )}
        </div>
        <LikeButton target="THREAD" id={thread.id} likes={thread.likes} liked={thread.liked} viewer={viewer} />
      </div>
    </article>
  );
}

export function Comments({
  threadId,
  comments,
  viewer,
  locked,
}: {
  threadId: number;
  comments: CommentItem[];
  viewer: Viewer | null;
  locked: boolean;
}) {
  const roots = comments.filter((c) => !c.parentId);
  const children = (id: number) => comments.filter((c) => c.parentId === id);
  return (
    <div className="space-y-4">
      {roots.map((c) => (
        <div key={c.id}>
          <Comment comment={c} viewer={viewer} threadId={threadId} locked={locked} />
          {children(c.id).length > 0 && (
            <div className="mt-2 space-y-2 border-l-2 border-fg-grey-dark pl-4 md:ml-6">
              {children(c.id).map((r) => (
                <Comment key={r.id} comment={r} viewer={viewer} threadId={threadId} locked={locked} />
              ))}
            </div>
          )}
        </div>
      ))}
      {viewer ? (
        locked && !viewer.moderator ? (
          <p className="card flex items-center gap-2 p-4 text-[13px] text-text-lighter">
            <Lock className="h-4 w-4" /> This thread is locked.
          </p>
        ) : (
          <CommentBox threadId={threadId} />
        )
      ) : (
        <p className="card p-4 text-[13px] text-text-lighter">
          <Link href={`/login?next=/forum/thread/${threadId}`} className="font-semibold text-accent">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </div>
  );
}

function Comment({ comment, viewer, threadId, locked }: { comment: CommentItem; viewer: Viewer | null; threadId: number; locked: boolean }) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [pending, start] = useTransition();
  const canEdit = viewer && (viewer.id === comment.userId || viewer.moderator);

  return (
    <div className="card p-4" id={`comment-${comment.id}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
        <Link href={`/user/${comment.user.username}`} className="flex items-center gap-2 font-semibold text-accent">
          <Avatar src={comment.user.image} name={comment.user.name} size={28} />
          {comment.user.name}
        </Link>
        <span className="text-text-lighter">
          <ClientTime iso={comment.createdAt} />
          {comment.edited && " · edited"}
        </span>
      </div>
      {editing ? (
        <div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={10000} className="input-grey resize-y" />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary px-3 py-1.5">
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await editComment(comment.id, body);
                  if (res.ok) setEditing(false);
                })
              }
              className="btn btn-primary px-3 py-1.5"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <RichText text={comment.body} className="text-[14px]" />
      )}
      <div className="mt-3 flex items-center justify-end gap-4 text-[12px] font-semibold text-text-lighter">
        {canEdit && !editing && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="hover:text-accent">
              Edit
            </button>
            <button
              type="button"
              onClick={() => confirm("Delete this comment?") && start(async () => void (await deleteComment(comment.id)))}
              className="hover:text-red"
            >
              Delete
            </button>
          </>
        )}
        {viewer && (!locked || viewer.moderator) && (
          <button type="button" onClick={() => setReplying(!replying)} className="flex items-center gap-1 hover:text-accent">
            <MessageSquare className="h-3.5 w-3.5" /> Reply
          </button>
        )}
        <LikeButton target="COMMENT" id={comment.id} likes={comment.likes} liked={comment.liked} viewer={viewer} />
      </div>
      {replying && (
        <div className="mt-3">
          <CommentBox threadId={threadId} parentId={comment.parentId ?? comment.id} mention={comment.user.username} onDone={() => setReplying(false)} />
        </div>
      )}
    </div>
  );
}

function CommentBox({ threadId, parentId, mention, onDone }: { threadId: number; parentId?: number; mention?: string; onDone?: () => void }) {
  const [body, setBody] = useState(mention ? `@${mention} ` : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="card p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 3 : 5}
        maxLength={10000}
        placeholder="Write a comment…"
        className="input-grey resize-y"
        aria-label="Comment"
      />
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        {onDone && (
          <button type="button" onClick={onDone} className="btn btn-secondary px-3 py-1.5">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={pending || !body.trim()}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await postComment(threadId, body, parentId);
              if (!res.ok) return setError(res.error);
              setBody("");
              onDone?.();
            })
          }
          className="btn btn-primary px-4 py-1.5"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Comment
        </button>
      </div>
    </div>
  );
}
