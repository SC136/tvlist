"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** Click-to-load YouTube embed (no third-party requests until the user asks). */
export function Trailer({ videoKey, title }: { videoKey: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="card aspect-video overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="card group relative block aspect-video w-full overflow-hidden"
      aria-label={`Play ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${encodeURIComponent(videoKey)}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red text-white shadow-lg transition group-hover:scale-110">
          <Play className="ml-1 h-7 w-7" fill="currentColor" />
        </span>
      </span>
    </button>
  );
}
