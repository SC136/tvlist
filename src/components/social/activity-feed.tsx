"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadActivities, postMessage, postStatus } from "@/actions/social";
import { ActivityCard, type FeedViewer } from "./activity-card";
import { cn } from "@/lib/cn";
import type { ActivityItem, ActivityScope } from "@/lib/queries/activity";

const PAGE = 20;

export function ActivityFeed({
  initial,
  scope,
  viewer,
  composer,
  emptyText = "No activity yet.",
}: {
  initial: ActivityItem[];
  scope: ActivityScope;
  viewer: FeedViewer | null;
  /** "status" posts to your own feed; "message" posts on someone's profile. */
  composer?: { kind: "status" } | { kind: "message"; recipientId: string; recipientName: string } | null;
  emptyText?: string;
}) {
  const [items, setItems] = useState(initial);
  const [done, setDone] = useState(initial.length < PAGE);
  const [loading, start] = useTransition();

  const more = () =>
    start(async () => {
      const last = items[items.length - 1];
      const next = await loadActivities(scope, last?.id);
      setItems((all) => [...all, ...next.filter((n) => !all.some((a) => a.id === n.id))]);
      if (next.length < PAGE) setDone(true);
    });

  return (
    <div className="space-y-4">
      {composer && viewer && <Composer composer={composer} onPosted={(item) => setItems((all) => [item, ...all])} />}
      {items.length === 0 && <p className="card px-5 py-8 text-center text-[13px] text-text-lighter">{emptyText}</p>}
      {items.map((item) => (
        <ActivityCard key={item.id} item={item} viewer={viewer} onDeleted={(id) => setItems((all) => all.filter((a) => a.id !== id))} />
      ))}
      {!done && items.length > 0 && (
        <button type="button" onClick={more} disabled={loading} className="btn btn-secondary w-full bg-fg py-3 shadow-[var(--shadow-card)]">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Load More
        </button>
      )}
    </div>
  );
}

function Composer({
  composer,
  onPosted,
}: {
  composer: { kind: "status" } | { kind: "message"; recipientId: string; recipientName: string };
  onPosted: (item: ActivityItem) => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [isPrivate, setPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!text.trim()) return;
    setError(null);
    start(async () => {
      const res =
        composer.kind === "status" ? await postStatus(text) : await postMessage(composer.recipientId, text, isPrivate);
      if (!res.ok) return setError(res.error);
      if (res.data) onPosted(res.data);
      setText("");
      setFocused(false);
    });
  };

  const expanded = focused || text.length > 0;
  return (
    <div className="card p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
        rows={expanded ? 4 : 1}
        maxLength={5000}
        placeholder={composer.kind === "status" ? "Write a status…" : `Write a message to ${composer.recipientName}…`}
        className={cn("input-grey resize-none transition-all", expanded && "resize-y")}
        aria-label={composer.kind === "status" ? "Status" : "Message"}
      />
      {expanded && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-text-lighter">
            Supports **bold**, _italic_, @mentions, links and ~!spoilers!~
          </p>
          <div className="flex items-center gap-3">
            {composer.kind === "message" && (
              <label className="flex items-center gap-1.5 text-[12px] font-semibold">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} className="accent-[rgb(var(--accent))]" />
                Private
              </label>
            )}
            <button
              type="button"
              onClick={() => {
                setText("");
                setFocused(false);
              }}
              className="btn btn-secondary px-3 py-1.5"
            >
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={pending || !text.trim()} className="btn btn-primary px-3 py-1.5">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[12px] font-semibold text-red">{error}</p>}
    </div>
  );
}
