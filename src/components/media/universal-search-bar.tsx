"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BookOpen,
  BookText,
  Film,
  Gamepad2,
  Layers,
  Loader2,
  Music,
  Search,
  Sparkles,
  Tv,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface CategoryTab {
  key: string;
  label: string;
  count?: number;
}

export function UniversalSearchBar({
  initialQuery = "",
  activeCategory = "all",
  categories,
}: {
  initialQuery?: string;
  activeCategory?: string;
  categories: CategoryTab[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [prevInitial, setPrevInitial] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  if (prevInitial !== initialQuery) {
    setPrevInitial(initialQuery);
    setQuery(initialQuery);
  }

  const updateSearch = (newQuery: string, newCat = activeCategory) => {
    const q = newQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (newCat && newCat !== "all") params.set("category", newCat);

    startTransition(() => {
      router.push(`/search${params.size ? `?${params.toString()}` : ""}`);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateSearch(query);
    }
  };

  const handleClear = () => {
    setQuery("");
    updateSearch("", activeCategory);
  };

  const iconFor = (key: string) => {
    switch (key) {
      case "movie":
        return <Film className="h-3.5 w-3.5" />;
      case "tv":
        return <Tv className="h-3.5 w-3.5" />;
      case "anime":
        return <Sparkles className="h-3.5 w-3.5" />;
      case "manga":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "book":
        return <BookText className="h-3.5 w-3.5" />;
      case "music":
        return <Music className="h-3.5 w-3.5" />;
      case "game":
        return <Gamepad2 className="h-3.5 w-3.5" />;
      case "people":
        return <Users className="h-3.5 w-3.5" />;
      case "users":
        return <User className="h-3.5 w-3.5" />;
      default:
        return <Layers className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-lighter">
          {pending ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Search className="h-5 w-5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search all movies, TV shows, anime, manga, books, music and games…"
          className="input-grey w-full py-3.5 pr-24 pl-11 text-[15px] shadow-sm md:text-[16px]"
          aria-label="Search all media"
          autoFocus={!initialQuery}
        />
        <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-1 text-text-lighter transition hover:bg-fg hover:text-bright"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => updateSearch(query)}
            disabled={pending}
            className="btn btn-primary py-1.5 px-3.5 text-[13px]"
          >
            Search
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="scrollbar-none -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => updateSearch(query, cat.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition whitespace-nowrap",
                active
                  ? "bg-accent text-on-accent shadow-sm"
                  : "bg-fg text-text-light hover:bg-fg-grey hover:text-bright",
              )}
            >
              {iconFor(cat.key)}
              <span>{cat.label}</span>
              {cat.count !== undefined && cat.count > 0 && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px]",
                    active ? "bg-black/20 text-on-accent" : "bg-fg-grey-dark text-text-lighter",
                  )}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
