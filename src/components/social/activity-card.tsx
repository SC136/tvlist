"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Lock, MessageSquare, MoreHorizontal, Trash2, Pencil, Link2 } from "lucide-react";
import { deleteActivity, deleteReply, editActivityText, postReply, toggleActivityLike, toggleReplyLike } from "@/actions/social";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { ClientTime } from "./client-time";
import { RichText } from "./rich-text";
import { cn } from "@/lib/cn";
import type { ActivityItem, ReplyItem } from "@/lib/queries/activity";

export interface FeedViewer {
  id: string;
  username: string;
  name: string;
  image: string | null;
  moderator: boolean;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ActivityCard({
  item,
  viewer,
  onDeleted,
  defaultRepliesOpen = false,
}: {
  item: ActivityItem;
  viewer: FeedViewer | null;
  onDeleted?: (id: number) => void;
  defaultRepliesOpen?: boolean;
}) {
  const [liked, setLiked] = useState(item.liked);
  const [likes, setLikes] = useState(item.likeCount);
  const [replies, setReplies] = useState<ReplyItem[]>(item.replies);
  const [open, setOpen] = useState(defaultRepliesOpen);
  const [text, setText] = useState(item.text ?? "");
  const [editing, setEditing] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();

  if (deleted) return null;

  const canDelete = viewer && (viewer.id === item.userId || viewer.id === item.recipientId || viewer.moderator);
  const canEdit = viewer && viewer.id === item.userId && item.type !== "LIST";

  const like = () => {
    if (!viewer) return router.push("/login");
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    start(async () => {
      const res = await toggleActivityLike(item.id);
      if (!res.ok) {
        setLiked(liked);
        setLikes(item.likeCount);
      }
    });
  };

  const remove = () =>
    start(async () => {
      const res = await deleteActivity(item.id);
      if (res.ok) {
        setDeleted(true);
        onDeleted?.(item.id);
      }
    });

  const menu = (
    <Dropdown
      align="right"
      trigger={() => (
        <button type="button" aria-label="Activity options" className="rounded p-1 text-text-lighter transition hover:text-text">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    >
      {(close) => (
        <>
          <DropdownItem
            onClick={() => {
              close();
              void navigator.clipboard?.writeText(`${window.location.origin}/activity/${item.id}`);
            }}
          >
            <Link2 className="h-4 w-4" /> Copy link
          </DropdownItem>
          {canEdit && (
            <DropdownItem
              onClick={() => {
                close();
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" /> Edit
            </DropdownItem>
          )}
          {canDelete && (
            <DropdownItem
              danger
              onClick={() => {
                close();
                if (confirm("Delete this activity?")) remove();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownItem>
          )}
        </>
      )}
    </Dropdown>
  );

  const actions = (
    <div className="flex items-center gap-4 text-[12px] font-semibold text-text-lighter">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 transition hover:text-accent"
        aria-expanded={open}
        aria-label={`Replies (${replies.length})`}
      >
        {replies.length > 0 && <span>{replies.length}</span>}
        <MessageSquare className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={like}
        aria-pressed={liked}
        aria-label={`Like (${likes})`}
        className={cn("flex items-center gap-1 transition hover:text-red", liked && "text-red")}
      >
        {likes > 0 && <span>{likes}</span>}
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );

  return (
    <article className="animate-fade">
      {item.type === "LIST" && item.media ? (
        <div className="card flex min-h-[90px] overflow-hidden">
          <Link href={`/${item.media.type}/${item.media.tmdbId}`} className="shrink-0">
            <Cover path={item.media.posterPath} alt={item.media.title} size="w154" className="h-full w-[62px]" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-between p-3 pl-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-[13px] leading-snug">
                <Link href={`/user/${item.user.username}`} className="font-semibold text-accent">
                  {item.user.name}
                </Link>
                <p className="mt-1">
                  {capitalize(item.status ?? "")}
                  {item.progress ? ` ${item.progress} of` : ""}{" "}
                  <Link href={`/${item.media.type}/${item.media.tmdbId}`} className="font-semibold text-accent">
                    {item.media.title}
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ClientTime iso={item.createdAt} className="text-[11px] text-text-lighter" />
                {menu}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <Link href={`/user/${item.user.username}`} aria-label={item.user.name}>
                <Avatar src={item.user.image} name={item.user.name} size={26} />
              </Link>
              {actions}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              <Link href={`/user/${item.user.username}`}>
                <Avatar src={item.user.image} name={item.user.name} size={36} />
              </Link>
              <Link href={`/user/${item.user.username}`} className="truncate font-semibold text-accent">
                {item.user.name}
              </Link>
              {item.type === "MESSAGE" && item.recipient && (
                <>
                  <span className="text-text-lighter">→</span>
                  <Link href={`/user/${item.recipient.username}`} className="flex items-center gap-2 truncate font-semibold text-accent">
                    <Avatar src={item.recipient.image} name={item.recipient.name} size={24} />
                    {item.recipient.name}
                  </Link>
                </>
              )}
              {item.private && (
                <span className="flex items-center gap-1 rounded bg-fg-grey px-1.5 py-px text-[10px] font-bold text-text-lighter uppercase">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href={`/activity/${item.id}`} className="hover:text-accent">
                <ClientTime iso={item.createdAt} className="text-[11px] text-text-lighter" />
              </Link>
              {menu}
            </div>
          </div>
          {editing ? (
            <EditBox
              initial={text}
              onCancel={() => setEditing(false)}
              onSave={(value) =>
                start(async () => {
                  const res = await editActivityText(item.id, value);
                  if (res.ok) {
                    setText(value);
                    setEditing(false);
                  }
                })
              }
            />
          ) : (
            <RichText text={text} />
          )}
          <div className="mt-3 flex justify-end">{actions}</div>
        </div>
      )}

      {open && (
        <Replies
          activityId={item.id}
          ownerId={item.userId}
          replies={replies}
          setReplies={setReplies}
          viewer={viewer}
        />
      )}
    </article>
  );
}

function Replies({
  activityId,
  ownerId,
  replies,
  setReplies,
  viewer,
}: {
  activityId: number;
  ownerId: string;
  replies: ReplyItem[];
  setReplies: (fn: (r: ReplyItem[]) => ReplyItem[]) => void;
  viewer: FeedViewer | null;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!text.trim()) return;
    setError(null);
    start(async () => {
      const res = await postReply(activityId, text);
      if (!res.ok) return setError(res.error);
      if (res.data) setReplies((r) => [...r, res.data!]);
      setText("");
    });
  };

  return (
    <div className="mt-2 space-y-2 pl-4 md:pl-8">
      {replies.map((r) => (
        <ReplyRow key={r.id} reply={r} viewer={viewer} ownerId={ownerId} onDeleted={() => setReplies((all) => all.filter((x) => x.id !== r.id))} />
      ))}
      {viewer ? (
        <div className="card p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
            }}
            rows={2}
            maxLength={2000}
            placeholder="Write a reply…"
            className="input-grey resize-y"
            aria-label="Reply"
          />
          {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={submit} disabled={pending || !text.trim()} className="btn btn-primary px-3 py-1.5">
              Reply
            </button>
          </div>
        </div>
      ) : (
        <p className="card p-3 text-[12px] text-text-lighter">
          <Link href="/login" className="font-semibold text-accent">
            Log in
          </Link>{" "}
          to reply.
        </p>
      )}
    </div>
  );
}

function ReplyRow({ reply, viewer, ownerId, onDeleted }: { reply: ReplyItem; viewer: FeedViewer | null; ownerId: string; onDeleted: () => void }) {
  const [liked, setLiked] = useState(reply.liked);
  const [likes, setLikes] = useState(reply.likeCount);
  const [, start] = useTransition();
  const canDelete = viewer && (viewer.id === reply.userId || viewer.id === ownerId || viewer.moderator);
  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
        <Link href={`/user/${reply.user.username}`} className="flex items-center gap-2 font-semibold text-accent">
          <Avatar src={reply.user.image} name={reply.user.name} size={24} />
          {reply.user.name}
        </Link>
        <div className="flex items-center gap-3 text-text-lighter">
          <ClientTime iso={reply.createdAt} className="text-[11px]" />
          <button
            type="button"
            aria-pressed={liked}
            onClick={() => {
              if (!viewer) return;
              setLiked(!liked);
              setLikes((n) => n + (liked ? -1 : 1));
              start(async () => {
                await toggleReplyLike(reply.id);
              });
            }}
            className={cn("flex items-center gap-1 transition hover:text-red", liked && "text-red")}
          >
            {likes > 0 && likes}
            <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} />
          </button>
          {canDelete && (
            <button
              type="button"
              aria-label="Delete reply"
              onClick={() =>
                confirm("Delete this reply?") &&
                start(async () => {
                  const res = await deleteReply(reply.id);
                  if (res.ok) onDeleted();
                })
              }
              className="transition hover:text-red"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <RichText text={reply.text} className="text-[13px]" />
    </div>
  );
}

function EditBox({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} maxLength={5000} className="input-grey resize-y" />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary px-3 py-1.5">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(value)} disabled={!value.trim()} className="btn btn-primary px-3 py-1.5">
          Save
        </button>
      </div>
    </div>
  );
}
