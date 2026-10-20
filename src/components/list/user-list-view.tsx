"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { LayoutGrid, List, MoreHorizontal, Plus, Search, StickyNote } from "lucide-react";
import { incrementProgress, type SavedEntry } from "@/actions/list";
import { Cover } from "@/components/ui/cover";
import { UserScore } from "@/components/ui/user-score";
import { ListEditor } from "./list-editor";
import { cn } from "@/lib/cn";
import { airingIn, formatDate, STATUS_COLORS, statusLabel, type ListStatus, type ScoreFormat } from "@/lib/format";
import { countryName, type MediaCategory } from "@/lib/media";
import type { ListRow } from "@/lib/queries/user-stats";

const SECTION_ORDER: ListStatus[] = ["CURRENT", "REPEATING", "COMPLETED", "PAUSED", "DROPPED", "PLANNING"];

type SortKey = "score" | "title" | "progress" | "updated" | "added" | "started" | "completed" | "release" | "average";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "title", label: "Title" },
  { key: "progress", label: "Progress" },
  { key: "updated", label: "Last Updated" },
  { key: "added", label: "Last Added" },
  { key: "started", label: "Start Date" },
  { key: "completed", label: "Completed Date" },
  { key: "release", label: "Release Date" },
  { key: "average", label: "Average Score" },
];

export function UserListView({
  initialRows,
  type,
  isOwner,
  scoreFormat,
  ownerName,
}: {
  initialRows: ListRow[];
  type: MediaCategory;
  isOwner: boolean;
  scoreFormat: ScoreFormat;
  ownerName: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [list, setList] = useState<ListStatus | "ALL">("ALL");
  const [format, setFormat] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [view, setView] = useState<"list" | "grid">("list");
  const [editing, setEditing] = useState<ListRow | null>(null);
  const [, start] = useTransition();

  const options = useMemo(() => {
    const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])].sort();
    return {
      formats: uniq(rows.map((r) => r.media.format)),
      genres: uniq(rows.flatMap((r) => r.media.genres)),
      countries: uniq(rows.map((r) => r.media.country)),
      years: uniq(rows.map((r) => (r.media.year ? String(r.media.year) : null))).reverse(),
    };
  }, [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (list === "ALL" || r.status === list) &&
        (!q || r.media.title.toLowerCase().includes(q)) &&
        (!format || r.media.format === format) &&
        (!genre || r.media.genres.includes(genre)) &&
        (!country || r.media.country === country) &&
        (!year || String(r.media.year) === year),
    );
    const cmp: Record<SortKey, (a: ListRow, b: ListRow) => number> = {
      score: (a, b) => b.score - a.score || a.media.title.localeCompare(b.media.title),
      title: (a, b) => a.media.title.localeCompare(b.media.title),
      progress: (a, b) => b.progress - a.progress,
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      added: (a, b) => b.createdAt.localeCompare(a.createdAt),
      started: (a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""),
      completed: (a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
      release: (a, b) => (b.media.releaseDate ?? "").localeCompare(a.media.releaseDate ?? ""),
      average: (a, b) => (b.media.voteAverage ?? 0) - (a.media.voteAverage ?? 0),
    };
    return out.sort(cmp[sort]);
  }, [rows, search, list, format, genre, country, year, sort]);

  const sections = SECTION_ORDER.map((s) => ({ status: s, items: filtered.filter((r) => r.status === s) })).filter((s) => s.items.length);

  function applySaved(row: ListRow, saved: SavedEntry | null) {
    setRows((all) =>
      saved ? all.map((r) => (r.entryId === row.entryId ? { ...r, ...saved, updatedAt: new Date().toISOString() } : r)) : all.filter((r) => r.entryId !== row.entryId),
    );
  }

  function plusOne(row: ListRow) {
    const optimistic = { ...row, progress: row.progress + 1 };
    setRows((all) => all.map((r) => (r.entryId === row.entryId ? optimistic : r)));
    start(async () => {
      const res = await incrementProgress({ type: row.media.type, tmdbId: row.media.tmdbId });
      if (res.ok && res.data) applySaved(row, res.data);
      else setRows((all) => all.map((r) => (r.entryId === row.entryId ? row : r)));
    });
  }

  if (rows.length === 0) {
    const typeLabel = type === "movie" ? "movie" : type === "anime" ? "anime" : "TV";
    const browseLabel = type === "movie" ? "Movies" : type === "anime" ? "Anime" : "TV Shows";
    return (
      <div className="card px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-bright">{isOwner ? `Your ${typeLabel} list is empty.` : `${ownerName} hasn't added anything yet.`}</p>
        {isOwner && (
          <Link href={`/search/${type}`} className="btn btn-primary mt-4">
            Browse {browseLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr]">
      <aside className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter" className="input-base pl-9" aria-label="Filter list" />
        </div>
        <div>
          <p className="mb-2 text-[12px] font-bold tracking-wide text-text-lighter uppercase">Lists</p>
          <div className="flex flex-wrap gap-1 md:block md:space-y-0.5">
            {(["ALL", ...SECTION_ORDER] as const)
              .filter((s) => s === "ALL" || counts[s])
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setList(s)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded px-2.5 py-1.5 text-left text-[13px] font-semibold transition md:w-full",
                    list === s ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent",
                  )}
                >
                  {s === "ALL" ? "All" : statusLabel(s, type)}
                  <span className="text-[12px] text-text-lighter">{counts[s] ?? 0}</span>
                </button>
              ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:block md:space-y-3">
          <p className="col-span-2 text-[12px] font-bold tracking-wide text-text-lighter uppercase">Filters</p>
          {options.formats.length > 1 && <MiniSelect value={format} onChange={setFormat} placeholder="Format" options={options.formats} />}
          <MiniSelect value={genre} onChange={setGenre} placeholder="Genre" options={options.genres} />
          {options.countries.length > 1 && (
            <MiniSelect value={country} onChange={setCountry} placeholder="Country" options={options.countries} labels={(c) => countryName(c) ?? c} />
          )}
          <MiniSelect value={year} onChange={setYear} placeholder="Release Year" options={options.years} />
          <div className="col-span-2">
            <p className="mt-2 mb-2 text-[12px] font-bold tracking-wide text-text-lighter uppercase">Sort</p>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input-base cursor-pointer" aria-label="Sort">
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-8">
        <div className="-mb-4 flex justify-end">
          <div className="flex overflow-hidden rounded bg-fg shadow-[var(--shadow-card)]">
            <button type="button" aria-label="List view" onClick={() => setView("list")} className={cn("p-2", view === "list" ? "text-accent" : "text-text-lighter")}>
              <List className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Grid view" onClick={() => setView("grid")} className={cn("p-2", view === "grid" ? "text-accent" : "text-text-lighter")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
        {sections.length === 0 && <p className="card p-6 text-center text-[13px] text-text-lighter">Nothing matches those filters.</p>}
        {sections.map((section) => (
          <section key={section.status}>
            <h2 className="mb-3 text-[16px] font-bold text-bright">
              {statusLabel(section.status, type)} <span className="text-[13px] font-semibold text-text-lighter">{section.items.length}</span>
            </h2>
            {view === "list" ? (
              <div className="card overflow-hidden">
                <div className="grid grid-cols-[1fr_70px] gap-4 border-b border-fg-grey-dark px-4 py-2.5 text-[12px] font-bold text-text-lighter sm:grid-cols-[1fr_70px_90px_110px]">
                  <span>Title</span>
                  <span className="text-center">Score</span>
                  <span className="hidden text-center sm:block">{type === "tv" ? "Progress" : "Watched"}</span>
                  <span className="hidden text-center sm:block">Format</span>
                </div>
                {section.items.map((r) => (
                  <Row key={r.entryId} row={r} type={type} isOwner={isOwner} scoreFormat={scoreFormat} onEdit={() => setEditing(r)} onPlusOne={() => plusOne(r)} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {section.items.map((r) => (
                  <GridCard key={r.entryId} row={r} type={type} isOwner={isOwner} scoreFormat={scoreFormat} onEdit={() => setEditing(r)} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <ListEditor
          open
          onClose={() => setEditing(null)}
          media={{
            type: editing.media.type,
            tmdbId: editing.media.tmdbId,
            title: editing.media.title,
            posterPath: editing.media.posterPath,
            backdropPath: editing.media.backdropPath,
            episodes: editing.media.episodes,
          }}
          entry={{
            status: editing.status,
            score: editing.score,
            progress: editing.progress,
            repeat: editing.repeat,
            startedAt: editing.startedAt,
            completedAt: editing.completedAt,
            notes: editing.notes,
            private: editing.private,
          }}
          favourite={false}
          scoreFormat={scoreFormat}
          onSaved={(saved) => applySaved(editing, saved)}
        />
      )}
    </div>
  );
}

function Row({
  row,
  type: _type,
  isOwner,
  scoreFormat,
  onEdit,
  onPlusOne,
}: {
  row: ListRow;
  type: MediaCategory;
  isOwner: boolean;
  scoreFormat: ScoreFormat;
  onEdit: () => void;
  onPlusOne: () => void;
}) {
  const isTv = row.media.type === "tv";
  const total = isTv ? row.media.episodes : 1;
  const airing = isTv && row.media.nextEpisodeAirDate ? airingIn(row.media.nextEpisodeAirDate) : null;
  return (
    <div className="group relative grid grid-cols-[1fr_70px] items-center gap-4 border-b border-fg-grey-dark/60 px-4 py-2 last:border-0 hover:bg-fg-grey sm:grid-cols-[1fr_70px_90px_110px]">
      <span className="absolute top-0 bottom-0 left-0 w-1" style={{ background: STATUS_COLORS[row.status] }} />
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <Cover path={row.media.posterPath} alt="" size="w92" className="h-[52px] w-[38px] rounded-sm" />
          {isOwner && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${row.media.title}`}
              className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/${row.media.type}/${row.media.tmdbId}`} className="line-clamp-2 text-[14px] font-semibold text-text transition hover:text-accent">
            {row.media.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-text-lighter">
            {row.media.year && <span>{row.media.year}</span>}
            {airing && row.status === "CURRENT" && (
              <span className="font-semibold text-accent">
                Ep {row.media.nextEpisodeNumber} {airing}
              </span>
            )}
            {row.private && <span className="rounded bg-fg-grey-dark px-1">private</span>}
            {isOwner && row.notes && (
              <span title={row.notes} className="flex items-center gap-0.5">
                <StickyNote className="h-3 w-3" /> note
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-center text-[13px] font-semibold">
        <UserScore score={row.score} format={scoreFormat} />
      </div>
      <div className="hidden items-center justify-center gap-1 text-[13px] sm:flex">
        {isTv ? (
          <>
            <span>
              {row.progress}
              {total ? `/${total}` : ""}
            </span>
            {isOwner && (row.status === "CURRENT" || row.status === "REPEATING") && (!total || row.progress < total) && (
              <button
                type="button"
                onClick={onPlusOne}
                aria-label="Watched one more episode"
                className="rounded p-0.5 text-text-lighter opacity-0 transition group-hover:opacity-100 hover:text-accent focus:opacity-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <span className="text-text-lighter">{row.completedAt ? formatDate(row.completedAt) : row.progress ? "✓" : "–"}</span>
        )}
      </div>
      <div className="hidden text-center text-[12px] text-text-light sm:block">{row.media.format ?? (isTv ? "TV" : "Movie")}</div>
    </div>
  );
}

function GridCard({ row, type: _type, isOwner, scoreFormat, onEdit }: { row: ListRow; type: MediaCategory; isOwner: boolean; scoreFormat: ScoreFormat; onEdit: () => void }) {
  const isTv = row.media.type === "tv";
  const total = isTv ? row.media.episodes : 1;
  return (
    <div className="group relative">
      <Link href={`/${row.media.type}/${row.media.tmdbId}`} className="relative block overflow-hidden rounded shadow-[var(--shadow-card)]">
        <Cover path={row.media.posterPath} alt={row.media.title} size="w342" className="cover-ratio w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-8">
          <p className="line-clamp-2 text-[12px] font-semibold text-white">{row.media.title}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-white/80">
            <span>{isTv ? `${row.progress}${total ? `/${total}` : ""}` : row.media.year}</span>
            <UserScore score={row.score} format={scoreFormat} className="text-white" />
          </div>
        </div>
      </Link>
      {isOwner && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${row.media.title}`}
          className="absolute top-1.5 right-1.5 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function MiniSelect({
  value,
  onChange,
  placeholder,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  labels?: (v: string) => string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base cursor-pointer" aria-label={placeholder}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {labels ? labels(o) : o}
        </option>
      ))}
    </select>
  );
}
