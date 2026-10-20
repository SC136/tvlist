"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Heart, ListPlus, Loader2, NotebookPen, PenLine, Plus } from "lucide-react";
import { logWatch } from "@/actions/diary";
import { createCollection, myCollectionsFor, toggleInCollection } from "@/actions/collections";
import { Modal } from "@/components/ui/modal";
import { StarInput } from "@/components/ui/stars";
import { cn } from "@/lib/cn";
import { todayIso } from "@/lib/format";
import type { MediaType } from "@/lib/media";

interface ActionMedia {
  type: MediaType;
  tmdbId: number;
  title: string;
  year: number | null;
  seasons: number[];
}

/** Secondary actions under "Add to List": log a viewing, add to a list, review. */
export function MediaActions({ media, loggedIn }: { media: ActionMedia; loggedIn: boolean }) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const gate = (fn: () => void) => () => (loggedIn ? fn() : router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`));
  const btn = "flex flex-1 flex-col items-center gap-1 rounded py-2 text-[11px] font-semibold text-text-light transition hover:bg-fg-grey hover:text-accent";

  return (
    <>
      <div className="card flex gap-1 p-1">
        <button type="button" onClick={gate(() => setLogOpen(true))} className={btn}>
          <NotebookPen className="h-4 w-4" /> Log
        </button>
        <button type="button" onClick={gate(() => setListsOpen(true))} className={btn}>
          <ListPlus className="h-4 w-4" /> Lists
        </button>
        <Link href={`/review/new?type=${media.type}&id=${media.tmdbId}`} className={btn}>
          <PenLine className="h-4 w-4" /> Review
        </Link>
      </div>
      {logOpen && <LogModal media={media} onClose={() => setLogOpen(false)} />}
      {listsOpen && <ListsModal media={media} onClose={() => setListsOpen(false)} />}
    </>
  );
}

function LogModal({ media, onClose }: { media: ActionMedia; onClose: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [score, setScore] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatch, setRewatch] = useState(false);
  const [season, setSeason] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await logWatch({ type: media.type, tmdbId: media.tmdbId, watchedOn: date, score, rewatch, liked, season, note: note || null });
      if (!res.ok) return setError(res.error);
      setDone(true);
      setTimeout(onClose, 700);
    });

  const isGame = media.type === "game";
  const isManga = media.type === "manga";
  const isBook = media.type === "book";
  const isMusic = media.type === "music";
  const labelModal = isGame
    ? "Log a gameplay session"
    : isManga || isBook
      ? "Log a reading session"
      : isMusic
        ? "Log an album listen"
        : "Log a viewing";
  const labelAction = isGame
    ? "I played…"
    : isManga || isBook
      ? "I read…"
      : isMusic
        ? "I listened to…"
        : "I watched…";
  const labelDate = isGame
    ? "Played on"
    : isManga || isBook
      ? "Read on"
      : isMusic
        ? "Listened on"
        : "Watched on";

  return (
    <Modal open onClose={onClose} label={labelModal} className="max-w-[520px] bg-fg">
      <div className="p-6">
        <p className="text-[12px] font-bold tracking-wide text-text-lighter uppercase">
          {labelAction}
        </p>
        <h2 className="mt-1 text-[18px] font-bold text-bright">
          {media.title} {media.year && <span className="font-normal text-text-lighter">{media.year}</span>}
        </h2>
        <div className="mt-6 grid gap-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold text-text-light">
                {labelDate}
              </span>
              <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} className="input-grey" />
            </label>
            {media.type === "tv" && media.seasons.length > 0 && (
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold text-text-light">Season</span>
                <select value={season ?? ""} onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : null)} className="input-grey">
                  <option value="">Whole show</option>
                  {media.seasons.map((s) => (
                    <option key={s} value={s}>
                      Season {s}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="mb-1 block text-[13px] font-semibold text-text-light">Rating</span>
              <StarInput value={score} onChange={setScore} />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                aria-pressed={liked}
                className={cn("flex flex-col items-center text-[11px] font-semibold", liked ? "text-orange" : "text-text-lighter hover:text-text")}
              >
                <Heart className="h-6 w-6" fill={liked ? "currentColor" : "none"} /> Like
              </button>
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="checkbox" checked={rewatch} onChange={(e) => setRewatch(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                {isGame ? "Replay" : isManga || isBook ? "Reread" : isMusic ? "Relisten" : "Rewatch"}
              </label>
            </div>
          </div>
          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-text-light">Notes (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className="input-grey resize-y" placeholder="A few thoughts…" />
          </label>
          {error && <p className="text-[13px] font-semibold text-red">{error}</p>}
          <button type="button" onClick={submit} disabled={pending || done} className="btn btn-primary py-2.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : null}
            {done ? "Logged!" : "Save to Diary"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

type Picker = Awaited<ReturnType<typeof myCollectionsFor>>;

function ListsModal({ media, onClose }: { media: ActionMedia; onClose: () => void }) {
  const [lists, setLists] = useState<Picker | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = { type: media.type, tmdbId: media.tmdbId };

  useEffect(() => {
    let cancelled = false;
    void myCollectionsFor({ type: media.type, tmdbId: media.tmdbId }).then((result) => {
      if (!cancelled) setLists(result);
    });
    return () => {
      cancelled = true;
    };
  }, [media.type, media.tmdbId]);

  const toggle = (id: number) =>
    start(async () => {
      const res = await toggleInCollection(id, ref);
      if (!res.ok) return setError(res.error);
      setLists((ls) => ls?.map((l) => (l.id === id ? { ...l, has: res.data!.added, items: l.items + (res.data!.added ? 1 : -1) } : l)) ?? null);
    });

  const create = () =>
    start(async () => {
      if (!title.trim()) return;
      const res = await createCollection({ title, description: null, ranked: false, private: false }, ref);
      if (!res.ok) return setError(res.error);
      setTitle("");
      setLists(await myCollectionsFor(ref));
    });

  return (
    <Modal open onClose={onClose} label="Add to lists" className="max-w-[460px] bg-fg">
      <div className="p-6">
        <h2 className="text-[16px] font-bold text-bright">Add “{media.title}” to lists</h2>
        <div className="mt-4 max-h-[300px] space-y-1 overflow-y-auto">
          {lists === null ? (
            <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-text-lighter" />
          ) : lists.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-text-lighter">You don&apos;t have any lists yet.</p>
          ) : (
            lists.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={pending}
                onClick={() => toggle(l.id)}
                className="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left transition hover:bg-fg-grey"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-bright">{l.title}</span>
                  <span className="text-[11px] text-text-lighter">
                    {l.items} titles{l.private ? " · private" : ""}
                  </span>
                </span>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", l.has ? "border-accent bg-accent text-on-accent" : "border-text-lighter/40")}>
                  {l.has && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-2 border-t border-fg-grey-dark pt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            maxLength={100}
            placeholder="New list name"
            className="input-grey"
          />
          <button type="button" onClick={create} disabled={pending || !title.trim()} className="btn btn-primary shrink-0 px-3">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
        {error && <p className="mt-2 text-[12px] font-semibold text-red">{error}</p>}
      </div>
    </Modal>
  );
}
