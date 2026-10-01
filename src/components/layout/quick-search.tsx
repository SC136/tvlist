"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { tmdbImage } from "@/lib/media";
import type { QuickSearchResult } from "@/app/api/search/route";

type Item = { href: string; key: string };

export function QuickSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<QuickSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) {
          setData((await res.json()) as QuickSearchResult);
          setActive(0);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const visible = query.trim().length >= 2 ? data : null;

  const items: Item[] = useMemo(() => {
    if (!visible) return [];
    return [
      ...visible.movies.map((m) => ({ href: `/movie/${m.id}`, key: `m${m.id}` })),
      ...visible.tv.map((m) => ({ href: `/tv/${m.id}`, key: `t${m.id}` })),
      ...visible.people.map((p) => ({ href: `/person/${p.id}`, key: `p${p.id}` })),
      ...visible.users.map((u) => ({ href: `/user/${u.username}`, key: `u${u.username}` })),
    ];
  }, [visible]);

  function close() {
    onClose();
    setQuery("");
    setData(null);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) go(items[active].href);
      else if (query.trim()) go(`/search/movie?search=${encodeURIComponent(query.trim())}`);
    }
  }

  let index = -1;
  const row = (key: string, href: string, children: React.ReactNode) => {
    index++;
    const i = index;
    return (
      <Link
        key={key}
        href={href}
        onClick={close}
        onMouseEnter={() => setActive(i)}
        className={`flex items-center gap-3 rounded px-3 py-2 transition ${active === i ? "bg-fg-grey text-accent" : ""}`}
      >
        {children}
      </Link>
    );
  };

  const hasResults = visible && items.length > 0;

  return (
    <Modal open={open} onClose={close} label="Search" className="max-w-[640px] bg-transparent shadow-none" showClose={false}>
      <div className="card flex items-center gap-3 px-4 py-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-text-lighter" /> : <Search className="h-5 w-5 text-text-lighter" />}
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search movies, TV shows, people and users…"
          className="w-full bg-transparent text-[16px] text-bright outline-none placeholder:text-text-lighter"
          aria-label="Search"
        />
        <kbd className="hidden rounded bg-fg-grey px-1.5 py-0.5 text-[11px] text-text-lighter sm:block">Esc</kbd>
      </div>

      {visible && (
        <div className="card mt-3 max-h-[60vh] overflow-y-auto p-2">
          {!hasResults && <p className="px-3 py-6 text-center text-[13px] text-text-lighter">No results for “{query}”.</p>}
          {visible.movies.length > 0 && <Group title="Movies" />}
          {visible.movies.map((m) =>
            row(
              `m${m.id}`,
              `/movie/${m.id}`,
              <>
                <Thumb path={m.posterPath} />
                <Label title={m.title} sub={[m.year, "Movie"].filter(Boolean).join(" · ")} />
              </>,
            ),
          )}
          {visible.tv.length > 0 && <Group title="TV Shows" />}
          {visible.tv.map((m) =>
            row(
              `t${m.id}`,
              `/tv/${m.id}`,
              <>
                <Thumb path={m.posterPath} />
                <Label title={m.title} sub={[m.year, "TV"].filter(Boolean).join(" · ")} />
              </>,
            ),
          )}
          {visible.people.length > 0 && <Group title="People" />}
          {visible.people.map((p) =>
            row(
              `p${p.id}`,
              `/person/${p.id}`,
              <>
                <Thumb path={p.profilePath} round />
                <Label title={p.name} sub={p.department ?? ""} />
              </>,
            ),
          )}
          {visible.users.length > 0 && <Group title="Users" />}
          {visible.users.map((u) =>
            row(
              `u${u.username}`,
              `/user/${u.username}`,
              <>
                <Avatar src={u.image} name={u.name} size={36} />
                <Label title={u.name} sub={`@${u.username}`} />
              </>,
            ),
          )}
          {query.trim() && (
            <div className="mt-1 flex flex-wrap gap-2 border-t border-fg-grey-dark px-3 pt-3 pb-1 text-[12px]">
              <span className="text-text-lighter">See all results in</span>
              <Link onClick={close} className="font-semibold text-accent" href={`/search/movie?search=${encodeURIComponent(query.trim())}`}>
                Movies
              </Link>
              <Link onClick={close} className="font-semibold text-accent" href={`/search/tv?search=${encodeURIComponent(query.trim())}`}>
                TV Shows
              </Link>
              <Link onClick={close} className="font-semibold text-accent" href={`/search/people?search=${encodeURIComponent(query.trim())}`}>
                People
              </Link>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Group({ title }: { title: string }) {
  return <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-text-lighter uppercase">{title}</div>;
}

function Thumb({ path, round }: { path: string | null; round?: boolean }) {
  const src = tmdbImage(path, round ? "w45" : "w92");
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`h-12 w-9 shrink-0 object-cover ${round ? "h-9 rounded-full" : "rounded-sm"}`} loading="lazy" />
  ) : (
    <span className={`h-12 w-9 shrink-0 bg-fg-grey-dark ${round ? "h-9 rounded-full" : "rounded-sm"}`} />
  );
}

function Label({ title, sub }: { title: string; sub: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[14px] font-semibold">{title}</span>
      {sub && <span className="block truncate text-[12px] text-text-lighter">{sub}</span>}
    </span>
  );
}
