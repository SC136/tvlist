"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/cn";
import { COUNTRIES, genreMap, LANGUAGES, WATCH_PROVIDERS, type MediaCategory } from "@/lib/media";

const TV_FORMATS = [
  { value: "4", label: "TV (Scripted)" },
  { value: "2", label: "Miniseries" },
  { value: "0", label: "Documentary" },
  { value: "3", label: "Reality" },
  { value: "5", label: "Talk Show" },
];

const TV_STATUSES = [
  { value: "0", label: "Airing / Returning" },
  { value: "3", label: "Finished" },
  { value: "4", label: "Cancelled" },
  { value: "2", label: "In Production" },
];

const GAME_GENRES = [
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Shooter",
  "Puzzle",
  "Platformer",
  "Simulation",
  "Sports",
  "Racing",
  "Indie",
];

const ANIME_MANGA_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const MANGA_FORMATS = [
  { value: "MANGA", label: "Manga" },
  { value: "NOVEL", label: "Light Novel" },
  { value: "ONE_SHOT", label: "One Shot" },
];

const MANGA_STATUSES = [
  { value: "RELEASING", label: "Publishing" },
  { value: "FINISHED", label: "Finished" },
  { value: "HIATUS", label: "Hiatus" },
  { value: "CANCELLED", label: "Cancelled" },
];

const BOOK_GENRES = [
  "Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Classics",
  "Non-fiction",
  "Biography",
  "Philosophy",
  "Psychology",
  "History",
  "Poetry",
];

const MUSIC_GENRES = [
  "Rock",
  "Pop",
  "Alternative",
  "Hip-Hop/Rap",
  "R&B/Soul",
  "Electronic",
  "Indie",
  "Jazz",
  "Classical",
  "Country",
  "Metal",
  "Folk",
  "Soundtrack",
];

export function BrowseFilters({ type }: { type: MediaCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    if (Object.keys(changes).some((k) => k !== "view")) next.delete("list");
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  // Debounced search box.
  useEffect(() => {
    const current = params.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => update({ search: search.trim() || null }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const genres = (params.get("genres") ?? "").split(",").filter(Boolean);
  const toggleGenre = (g: string) => {
    const next = genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g];
    update({ genres: next.join(",") || null });
  };

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => String(currentYear - i));
  const view = params.get("view") === "list" ? "list" : "grid";
  const active = ["search", "genres", "year", "format", "status", "country", "language", "provider", "sort", "list"].some((k) =>
    params.get(k),
  );

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end">
        <Field label="Search" className="col-span-2 sm:col-span-3 lg:w-[220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
              placeholder={`Search ${type === "movie" ? "movies" : type === "anime" ? "anime" : type === "manga" ? "manga" : type === "book" ? "books" : type === "music" ? "albums & music" : type === "game" ? "games" : "TV shows"}`}
              aria-label="Search"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute top-1/2 right-2 -translate-y-1/2 text-text-lighter hover:text-text" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Field>

        <Field label="Genres" className="lg:w-[170px]">
          <Dropdown
            align="left"
            panelClassName="w-[260px] max-h-[360px] overflow-y-auto"
            trigger={() => (
              <button type="button" className="input-base flex items-center justify-between text-left">
                <span className={cn("truncate", !genres.length && "text-text-lighter")}>{genres.length ? genres.join(", ") : "Any"}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-text-lighter" />
              </button>
            )}
          >
            {(type === "game"
              ? GAME_GENRES
              : type === "book"
                ? BOOK_GENRES
                : type === "music"
                  ? MUSIC_GENRES
                  : type === "anime" || type === "manga"
                    ? ANIME_MANGA_GENRES
                    : Object.values(genreMap(type === "movie" ? "movie" : "tv"))
            ).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className="flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-[13px] font-semibold transition hover:bg-fg-grey hover:text-accent"
              >
                {g}
                {genres.includes(g) && <Check className="h-4 w-4 text-accent" />}
              </button>
            ))}
          </Dropdown>
        </Field>

        <Field label="Year" className="lg:w-[110px]">
          <Select value={params.get("year") ?? ""} onChange={(v) => update({ year: v })} options={years.map((y) => ({ value: y, label: y }))} />
        </Field>

        {type === "tv" && (
          <Field label="Format" className="lg:w-[150px]">
            <Select value={params.get("format") ?? ""} onChange={(v) => update({ format: v })} options={TV_FORMATS} />
          </Field>
        )}

        {type === "manga" && (
          <Field label="Format" className="lg:w-[150px]">
            <Select value={params.get("format") ?? ""} onChange={(v) => update({ format: v })} options={MANGA_FORMATS} />
          </Field>
        )}

        {(type === "tv" || type === "anime") && (
          <Field label="Status" className="lg:w-[160px]">
            <Select value={params.get("status") ?? ""} onChange={(v) => update({ status: v })} options={TV_STATUSES} />
          </Field>
        )}

        {type === "manga" && (
          <Field label="Status" className="lg:w-[160px]">
            <Select value={params.get("status") ?? ""} onChange={(v) => update({ status: v })} options={MANGA_STATUSES} />
          </Field>
        )}

        <Field label="Country" className="lg:w-[150px]">
          <Select
            value={params.get("country") ?? ""}
            onChange={(v) => update({ country: v })}
            options={Object.entries(COUNTRIES)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([value, label]) => ({ value, label }))}
          />
        </Field>

        <Field label="Language" className="lg:w-[140px]">
          <Select
            value={params.get("language") ?? ""}
            onChange={(v) => update({ language: v })}
            options={Object.entries(LANGUAGES)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([value, label]) => ({ value, label }))}
          />
        </Field>

        {type !== "game" && type !== "manga" && type !== "book" && type !== "music" && (
          <Field label="Streaming On" className="lg:w-[150px]">
            <Select
              value={params.get("provider") ?? ""}
              onChange={(v) => update({ provider: v })}
              options={WATCH_PROVIDERS.map((p) => ({ value: String(p.id), label: p.name }))}
            />
          </Field>
        )}

        <div className="col-span-2 flex items-end gap-3 sm:col-span-3 lg:ml-auto">
          {pending && <Loader2 className="mb-2.5 h-4 w-4 animate-spin text-accent" />}
          <Field label="Sort" className="flex-1 lg:w-[160px] lg:flex-none">
            <Select
              value={params.get("sort") ?? ""}
              onChange={(v) => update({ sort: v })}
              placeholder="Popularity"
              options={[
                { value: "score", label: "Average Score" },
                { value: "votes", label: "Most Rated" },
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "title", label: "Title" },
                ...(type === "movie" ? [{ value: "revenue", label: "Box Office" }] : []),
              ]}
            />
          </Field>
          <div className="flex overflow-hidden rounded bg-fg shadow-[var(--shadow-card)]">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => update({ view: null })}
              className={cn("p-2.5 transition", view === "grid" ? "text-accent" : "text-text-lighter hover:text-text")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => update({ view: "list" })}
              className={cn("p-2.5 transition", view === "list" ? "text-accent" : "text-text-lighter hover:text-text")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {active && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {genres.map((g) => (
            <Chip key={g} onRemove={() => toggleGenre(g)}>
              {g}
            </Chip>
          ))}
          {["year", "country", "language"].map((k) =>
            params.get(k) ? (
              <Chip key={k} onRemove={() => update({ [k]: null })}>
                {k === "country" ? COUNTRIES[params.get(k)!] ?? params.get(k) : k === "language" ? LANGUAGES[params.get(k)!] ?? params.get(k) : params.get(k)}
              </Chip>
            ) : null,
          )}
          {params.get("format") && (
            <Chip onRemove={() => update({ format: null })}>{TV_FORMATS.find((f) => f.value === params.get("format"))?.label}</Chip>
          )}
          {params.get("status") && (
            <Chip onRemove={() => update({ status: null })}>{TV_STATUSES.find((f) => f.value === params.get("status"))?.label}</Chip>
          )}
          {params.get("provider") && (
            <Chip onRemove={() => update({ provider: null })}>
              {WATCH_PROVIDERS.find((p) => String(p.id) === params.get("provider"))?.name}
            </Chip>
          )}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="text-[12px] font-semibold text-text-lighter transition hover:text-red"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-[13px] font-bold text-bright">{label}</p>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder = "Any",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base cursor-pointer appearance-none pr-8">
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-lighter" />
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-[12px] font-semibold text-on-accent">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove filter" className="opacity-80 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
