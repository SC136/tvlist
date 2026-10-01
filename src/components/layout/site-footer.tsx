import Link from "next/link";
import { PalettePicker } from "./palette-picker";
import { ThemeToggle } from "./theme-toggle";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Browse",
    links: [
      { href: "/search/movie", label: "Movies" },
      { href: "/search/tv", label: "TV Shows" },
      { href: "/search/people", label: "People" },
      { href: "/airing", label: "Airing Schedule" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/reviews", label: "Reviews" },
      { href: "/lists", label: "Lists" },
      { href: "/forum", label: "Forum" },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms & Privacy" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-nav text-nav-text">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="mb-3 text-[15px] font-bold text-white">Site Theme</p>
          <ThemeToggle />
          <p className="mt-5 mb-3 text-[15px] font-bold text-white">Palette</p>
          <PalettePicker />
          <div className="mt-8 flex items-center gap-3">
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" aria-label="The Movie Database (TMDB)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB"
                className="h-4 w-auto"
                loading="lazy"
              />
            </a>
          </div>
          <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-nav-text/70">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and TV metadata and images are
            provided by TMDB.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-[13px] font-bold tracking-wide text-white uppercase">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] font-semibold transition hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-4 text-[12px] text-nav-text/70">
          <span>© {new Date().getFullYear()} tvlist</span>
          <span>Track · Discover · Share</span>
        </div>
      </div>
    </footer>
  );
}
