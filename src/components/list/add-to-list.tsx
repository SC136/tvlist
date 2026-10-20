"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Heart, Loader2 } from "lucide-react";
import { setListStatus, toggleFavourite, type SavedEntry } from "@/actions/list";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { ListEditor, type EditorMedia } from "./list-editor";
import { cn } from "@/lib/cn";
import { statusLabel, type ListStatus, type ScoreFormat } from "@/lib/format";

/** "Add to List" split button + heart, used on media headers. */
export function AddToList({
  media,
  entry: initialEntry,
  favourite: initialFav,
  scoreFormat,
  loggedIn,
  compact,
}: {
  media: EditorMedia;
  entry: SavedEntry | null;
  favourite: boolean;
  scoreFormat: ScoreFormat;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [entry, setEntry] = useState(initialEntry);
  const [fav, setFav] = useState(initialFav);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pending, start] = useTransition();

  const requireLogin = () => {
    router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  };

  const quick = (status: ListStatus) => {
    if (!loggedIn) return requireLogin();
    start(async () => {
      const res = await setListStatus({ type: media.type, tmdbId: media.tmdbId, status });
      if (res.ok) setEntry(res.data ?? null);
    });
  };

  const heart = () => {
    if (!loggedIn) return requireLogin();
    start(async () => {
      const res = await toggleFavourite({ type: media.type, tmdbId: media.tmdbId });
      if (res.ok && res.data) setFav(res.data.favourite);
    });
  };

  const label = entry ? statusLabel(entry.status, media.type) : "Add to List";

  return (
    <div className={cn("flex items-stretch gap-3", compact && "gap-2")}>
      <div className="flex flex-1 items-stretch overflow-visible rounded bg-accent text-on-accent shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => (loggedIn ? setEditorOpen(true) : requireLogin())}
          className="flex flex-1 items-center justify-center gap-2 rounded-l px-4 py-2.5 text-[14px] font-semibold transition hover:bg-white/10"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {label}
        </button>
        <Dropdown
          align="right"
          trigger={() => (
            <button type="button" aria-label="List options" className="flex h-full items-center rounded-r border-l border-white/20 px-2.5 transition hover:bg-white/10">
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          className="flex"
        >
          {(close) => (
            <>
              <DropdownItem
                onClick={() => {
                  close();
                  quick("PLANNING");
                }}
              >
                {media.type === "game"
                  ? "Set as Backlog"
                  : media.type === "book"
                    ? "Set as Want to Read"
                    : media.type === "music"
                      ? "Set as Want to Listen"
                      : "Set as Planning"}
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  quick(media.type === "movie" ? "COMPLETED" : "CURRENT");
                }}
              >
                {media.type === "movie"
                  ? "Set as Completed"
                  : media.type === "game"
                    ? "Set as Playing"
                    : media.type === "manga" || media.type === "book"
                      ? "Set as Reading"
                      : media.type === "music"
                        ? "Set as Listening"
                        : "Set as Watching"}
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  if (loggedIn) setEditorOpen(true);
                  else requireLogin();
                }}
              >
                Open List Editor
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
      <button
        type="button"
        onClick={heart}
        aria-pressed={fav}
        aria-label={fav ? "Remove from favourites" : "Add to favourites"}
        className={cn(
          "flex items-center justify-center rounded px-3 shadow-[var(--shadow-card)] transition",
          fav ? "bg-red text-white" : "bg-red/90 text-white/80 hover:text-white",
        )}
      >
        <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
      </button>

      {editorOpen && (
        <ListEditor
          open
          onClose={() => setEditorOpen(false)}
          media={media}
          entry={entry}
          favourite={fav}
          scoreFormat={scoreFormat}
          onSaved={(e, f) => {
            setEntry(e);
            setFav(f);
          }}
        />
      )}
    </div>
  );
}
