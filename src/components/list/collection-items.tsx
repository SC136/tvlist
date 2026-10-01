"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { removeFromCollection, reorderCollection, setCollectionItemNote, toggleInCollection } from "@/actions/collections";
import { Cover } from "@/components/ui/cover";
import { cn } from "@/lib/cn";
import type { QuickSearchResult } from "@/app/api/search/route";
import type { MediaType } from "@/lib/media";

export interface CollectionEntry {
  mediaId: number;
  type: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: number | null;
  note: string | null;
}

export function CollectionItems({
  collectionId,
  initial,
  ranked,
  isOwner,
}: {
  collectionId: number;
  initial: CollectionEntry[];
  ranked: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((all) => {
      const next = all.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setDirty(true);
  };

  const saveOrder = () =>
    start(async () => {
      const res = await reorderCollection(collectionId, items.map((i) => i.mediaId));
      if (res.ok) setDirty(false);
    });

  const remove = (mediaId: number) =>
    start(async () => {
      const res = await removeFromCollection(collectionId, mediaId);
      if (res.ok) {
        setItems((all) => all.filter((i) => i.mediaId !== mediaId));
        router.refresh();
      }
    });

  return (
    <div>
      {isOwner && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <AddTitle
            collectionId={collectionId}
            onAdded={(entry) => {
              setItems((all) => (all.some((i) => i.tmdbId === entry.tmdbId && i.type === entry.type) ? all : [...all, entry]));
              router.refresh();
            }}
          />
          <div className="flex gap-2">
            {dirty && (
              <button type="button" onClick={saveOrder} disabled={pending} className="btn btn-primary">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Order
              </button>
            )}
            <button type="button" onClick={() => setEditing(!editing)} className={cn("btn", editing ? "btn-primary" : "btn-secondary bg-fg shadow-[var(--shadow-card)]")}>
              <Pencil className="h-4 w-4" /> {editing ? "Done Editing" : "Edit Items"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="card p-8 text-center text-[13px] text-text-lighter">This list is empty.</p>
      ) : editing ? (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li
              key={item.mediaId}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn("card flex items-center gap-3 p-2 pr-3", dragIndex === i && "opacity-50")}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-lighter" />
              <span className="w-8 shrink-0 text-center text-[13px] font-bold text-text-lighter">{i + 1}</span>
              <Cover path={item.posterPath} alt="" size="w92" className="h-[54px] w-[38px] shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-bright">{item.title}</p>
                <NoteInput collectionId={collectionId} item={item} />
              </div>
              <button type="button" onClick={() => move(i, i - 1)} aria-label="Move up" className="rounded p-1 hover:text-accent">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} aria-label="Move down" className="rounded p-1 hover:text-accent">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(item.mediaId)} aria-label="Remove" className="rounded p-1 hover:text-red">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item, i) => (
            <Link key={item.mediaId} href={`/${item.type}/${item.tmdbId}`} className="group">
              <div className="relative overflow-hidden rounded shadow-[var(--shadow-card)]">
                <Cover path={item.posterPath} alt={item.title} className="cover-ratio w-full transition group-hover:scale-[1.02]" />
                {ranked && (
                  <span className="absolute top-0 left-0 rounded-br-md bg-accent px-2 py-1 text-[13px] font-extrabold text-on-accent">{i + 1}</span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] font-semibold transition group-hover:text-accent">{item.title}</p>
              {item.note && <p className="mt-0.5 line-clamp-3 text-[11px] text-text-lighter italic">{item.note}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteInput({ collectionId, item }: { collectionId: number; item: CollectionEntry }) {
  const [value, setValue] = useState(item.note ?? "");
  const [saved, setSaved] = useState(item.note ?? "");
  const [, start] = useTransition();
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value === saved) return;
        start(async () => {
          const res = await setCollectionItemNote(collectionId, item.mediaId, value);
          if (res.ok) setSaved(value);
        });
      }}
      maxLength={1000}
      placeholder="Add a note (optional)"
      className="mt-1 w-full bg-transparent text-[12px] text-text-light outline-none placeholder:text-text-lighter/70"
    />
  );
}

function AddTitle({ collectionId, onAdded }: { collectionId: number; onAdded: (e: CollectionEntry) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<QuickSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.ok) setResults((await res.json()) as QuickSearchResult);
      } catch {
        /* aborted */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  const add = (type: MediaType, m: { id: number; title: string; year: number | null; posterPath: string | null }) =>
    start(async () => {
      setError(null);
      const res = await toggleInCollection(collectionId, { type, tmdbId: m.id }, "add");
      if (!res.ok || !res.data) return setError(res.ok ? "Couldn't add that." : res.error);
      onAdded({ mediaId: res.data.mediaId, type, tmdbId: m.id, title: m.title, posterPath: m.posterPath, year: m.year, note: null });
      setQ("");
      setResults(null);
    });

  const options = results && q.trim().length >= 2 ? [...results.movies.map((m) => ({ ...m, type: "movie" as const })), ...results.tv.map((m) => ({ ...m, type: "tv" as const }))] : [];

  return (
    <div className="relative w-full max-w-[380px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a movie or show…" className="input-base pl-9" aria-label="Add a title" />
      {pending && <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />}
      {options.length > 0 && (
        <div className="animate-pop absolute top-full right-0 left-0 z-30 mt-1 max-h-[320px] overflow-y-auto rounded-md bg-fg p-1 shadow-[var(--shadow-pop)]">
          {options.map((m) => (
            <button
              key={`${m.type}-${m.id}`}
              type="button"
              onClick={() => add(m.type, m)}
              className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition hover:bg-fg-grey"
            >
              <Cover path={m.posterPath} alt="" size="w92" className="h-[45px] w-[32px] shrink-0 rounded-sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-bright">{m.title}</span>
                <span className="text-[11px] text-text-lighter">
                  {m.type === "movie" ? "Movie" : "TV"} · {m.year ?? "TBA"}
                </span>
              </span>
              <Plus className="h-4 w-4 text-text-lighter" />
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}
