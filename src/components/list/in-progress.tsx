"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { incrementProgress } from "@/actions/list";
import { Cover } from "@/components/ui/cover";
import { airingIn } from "@/lib/format";
import type { MediaType } from "@/lib/media";

export interface ProgressItem {
  type: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  progress: number;
  episodes: number | null;
  nextAirDate: string | null;
  nextEpisode: number | null;
}

/** "In Progress" grid with a hover +1 episode button. */
export function InProgress({ items: initial }: { items: ProgressItem[] }) {
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();

  const plus = (item: ProgressItem) => {
    setItems((all) => all.map((i) => (i.tmdbId === item.tmdbId && i.type === item.type ? { ...i, progress: i.progress + 1 } : i)));
    start(async () => {
      const res = await incrementProgress({ type: item.type, tmdbId: item.tmdbId });
      if (!res.ok) setItems((all) => all.map((i) => (i.tmdbId === item.tmdbId ? item : i)));
      else if (res.data?.status === "COMPLETED") setItems((all) => all.filter((i) => i.tmdbId !== item.tmdbId || i.type !== item.type));
    });
  };

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => {
        const airing = airingIn(item.nextAirDate);
        const done = item.episodes ? item.progress >= item.episodes : false;
        return (
          <div key={`${item.type}-${item.tmdbId}`} className="group relative overflow-hidden rounded shadow-[var(--shadow-card)]">
            <Link href={`/${item.type}/${item.tmdbId}`} title={item.title}>
              <Cover path={item.posterPath} alt={item.title} size="w185" className="cover-ratio w-full" />
            </Link>
            {airing && (
              <span className="absolute top-0 inset-x-0 bg-black/70 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                Ep {item.nextEpisode} {airing}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-1.5 py-1 text-[11px] font-semibold text-white">
              <span>
                {item.progress}
                {item.episodes ? `/${item.episodes}` : ""}
              </span>
              {!done && (
                <button
                  type="button"
                  onClick={() => plus(item)}
                  aria-label={`Watched one more episode of ${item.title}`}
                  className="flex items-center rounded px-1 text-white/80 transition hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
