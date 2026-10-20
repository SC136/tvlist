"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2, Minus, Plus } from "lucide-react";
import { deleteListEntry, saveListEntry, toggleFavourite, type SavedEntry } from "@/actions/list";
import { Modal } from "@/components/ui/modal";
import { Cover } from "@/components/ui/cover";
import { ScoreInput } from "./score-input";
import { cn } from "@/lib/cn";
import { LIST_STATUSES, statusLabel, todayIso, type ScoreFormat } from "@/lib/format";
import { tmdbImage, type MediaType } from "@/lib/media";

export interface EditorMedia {
  type: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** Total episodes (TV) — null when unknown. */
  episodes: number | null;
}

export function ListEditor({
  open,
  onClose,
  media,
  entry,
  favourite,
  scoreFormat,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  media: EditorMedia;
  entry: SavedEntry | null;
  favourite: boolean;
  scoreFormat: ScoreFormat;
  onSaved?: (entry: SavedEntry | null, favourite: boolean) => void;
}) {
  const [form, setForm] = useState<SavedEntry>(
    () =>
      entry ?? {
        status: "PLANNING",
        score: 0,
        progress: 0,
        repeat: 0,
        startedAt: null,
        completedAt: null,
        notes: null,
        private: false,
      },
  );
  const [fav, setFav] = useState(favourite);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof SavedEntry>(key: K, value: SavedEntry[K]) => setForm((f) => ({ ...f, [key]: value }));
  const isCheckable = media.type === "movie" || media.type === "game" || media.type === "music";
  const total = isCheckable ? 1 : media.episodes;

  function save() {
    setError(null);
    start(async () => {
      const res = await saveListEntry({ type: media.type, tmdbId: media.tmdbId, ...form });
      if (!res.ok) return setError(res.error);
      onSaved?.(res.data ?? null, fav);
      onClose();
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteListEntry({ type: media.type, tmdbId: media.tmdbId });
      if (!res.ok) return setError(res.error);
      onSaved?.(null, fav);
      onClose();
    });
  }

  function favourite_() {
    start(async () => {
      const res = await toggleFavourite({ type: media.type, tmdbId: media.tmdbId });
      if (res.ok && res.data) {
        setFav(res.data.favourite);
        onSaved?.(entry, res.data.favourite);
      }
    });
  }

  const banner = tmdbImage(media.backdropPath, "w1280");

  return (
    <Modal open={open} onClose={onClose} label={`Edit ${media.title}`} className="overflow-hidden">
      <div className="relative h-[140px] bg-nav md:h-[180px]">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 px-5 pb-4 md:px-8">
          <Cover path={media.posterPath} alt="" size="w185" className="hidden w-[90px] translate-y-10 rounded shadow-lg sm:block md:w-[100px]" />
          <h2 className="mb-1 line-clamp-2 flex-1 text-[16px] font-bold text-white md:text-[18px]">{media.title}</h2>
          <div className="mb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={favourite_}
              disabled={pending}
              aria-pressed={fav}
              aria-label={fav ? "Remove from favourites" : "Add to favourites"}
              className={cn("rounded bg-red p-2 text-white transition hover:bg-red/85", !fav && "bg-white/15")}
            >
              <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
            </button>
            <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-5 px-5 pt-8 pb-6 sm:pt-14 md:grid-cols-3 md:px-8">
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value as SavedEntry["status"])} className="input-grey cursor-pointer">
            {LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, media.type)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Score">
          <ScoreInput value={form.score} onChange={(v) => set("score", v)} format={scoreFormat} />
        </Field>
        <Field
          label={
            media.type === "movie"
              ? "Watched"
              : media.type === "game"
                ? "Status"
                : media.type === "music"
                  ? "Listened"
                  : media.type === "book"
                    ? "Pages Read"
                    : media.type === "manga"
                      ? "Chapters Read"
                      : "Episode Progress"
          }
        >
          {isCheckable ? (
            <label className="flex h-[38px] items-center gap-2 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={form.progress >= 1}
                onChange={(e) => set("progress", e.target.checked ? 1 : 0)}
                className="h-4 w-4 accent-[rgb(var(--accent))]"
              />
              {media.type === "game" ? "Beat it / Finished" : media.type === "music" ? "Listened through" : "Seen it"}
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={total ?? undefined}
                  value={form.progress}
                  onChange={(e) => set("progress", Math.max(0, Math.min(total ?? 100000, Number(e.target.value) || 0)))}
                  className="input-grey pr-12"
                  aria-label={media.type === "book" ? "Pages read" : media.type === "manga" ? "Chapters read" : "Episodes watched"}
                />
                {total ? <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] text-text-lighter">/ {total}</span> : null}
              </div>
              <StepButton
                label={media.type === "book" ? "One fewer page" : media.type === "manga" ? "One fewer chapter" : "One fewer episode"}
                onClick={() => set("progress", Math.max(0, form.progress - 1))}
              >
                <Minus className="h-4 w-4" />
              </StepButton>
              <StepButton
                label={media.type === "book" ? "One more page" : media.type === "manga" ? "One more chapter" : "One more episode"}
                onClick={() => set("progress", Math.min(total ?? 100000, form.progress + 1))}
              >
                <Plus className="h-4 w-4" />
              </StepButton>
            </div>
          )}
        </Field>
        <Field label="Start Date">
          <DateInput value={form.startedAt} onChange={(v) => set("startedAt", v)} />
        </Field>
        <Field label="Finish Date">
          <DateInput value={form.completedAt} onChange={(v) => set("completedAt", v)} />
        </Field>
        <Field
          label={
            media.type === "game"
              ? "Total Replays"
              : media.type === "manga" || media.type === "book"
                ? "Total Rereads"
                : media.type === "music"
                  ? "Total Listens"
                  : "Total Rewatches"
          }
        >
          <input
            type="number"
            min={0}
            value={form.repeat}
            onChange={(e) => set("repeat", Math.max(0, Number(e.target.value) || 0))}
            className="input-grey"
          />
        </Field>
        <Field label="Notes" className="md:col-span-3">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={2000}
            rows={3}
            className="input-grey resize-y"
            placeholder="Only you can see your notes"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.private} onChange={(e) => set("private", e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
            Private (hide from your public list and activity)
          </label>
          {entry &&
            (confirmDelete ? (
              <span className="flex items-center gap-2 text-[13px]">
                Remove from your list?
                <button type="button" onClick={remove} disabled={pending} className="btn btn-danger px-3 py-1.5">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary px-3 py-1.5">
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-[13px] font-semibold text-red hover:underline">
                Delete
              </button>
            ))}
        </div>
        {error && (
          <p role="alert" className="rounded bg-red/10 px-3 py-2 text-[13px] font-semibold text-red md:col-span-3">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-[13px] font-semibold text-text-light">{label}</p>
      {children}
    </div>
  );
}

function StepButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="rounded bg-fg-grey p-2.5 text-text-light transition hover:text-accent">
      {children}
    </button>
  );
}

function DateInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={value ?? ""}
        max="2100-12-31"
        onChange={(e) => onChange(e.target.value || null)}
        className="input-grey cursor-pointer [color-scheme:inherit]"
      />
      {!value && (
        <button type="button" onClick={() => onChange(todayIso())} className="shrink-0 rounded bg-fg-grey px-2.5 text-[12px] font-semibold text-text-light hover:text-accent">
          Today
        </button>
      )}
    </div>
  );
}
