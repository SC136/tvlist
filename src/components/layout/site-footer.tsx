import Link from "next/link";
import { PalettePicker } from "./palette-picker";
import { ThemeToggle } from "./theme-toggle";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Browse",
    links: [
      { href: "/search/movie", label: "Movies" },
      { href: "/search/tv", label: "TV Shows" },
      { href: "/search/anime", label: "Anime" },
      { href: "/search/manga", label: "Manga" },
      { href: "/search/book", label: "Books" },
      { href: "/search/music", label: "Music" },
      { href: "/search/game", label: "Games" },
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
          <div className="mt-8">
            <p className="mb-2 text-[11px] font-bold tracking-wider text-text-lighter uppercase">Data Providers</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center opacity-85 transition hover:opacity-100"
                aria-label="The Movie Database (TMDB)"
                title="The Movie Database (Movies & TV)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                  alt="TMDB"
                  className="h-3.5 w-auto"
                  loading="lazy"
                />
              </a>
              <a
                href="https://anilist.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-bold text-white opacity-85 transition hover:opacity-100"
                title="AniList (Anime & Manga)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://anilist.co/img/icons/icon.svg" alt="AniList" className="h-4 w-4 rounded-sm" loading="lazy" />
                <span>AniList</span>
              </a>
              <a
                href="https://rawg.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-black opacity-85 transition hover:opacity-100"
                title="RAWG Video Games Database"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://rawg.io/assets/en/apple-icon.png" alt="RAWG" className="h-4 w-4 rounded-sm" loading="lazy" />
                <span className="font-mono text-[11px] tracking-wider text-white">RAWG</span>
              </a>
              <a
                href="https://openlibrary.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center opacity-85 transition hover:opacity-100"
                title="Open Library (Books)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://openlibrary.org/static/images/openlibrary-logo-tighter.svg"
                  alt="Open Library"
                  className="h-3.5 w-auto max-w-[100px]"
                  loading="lazy"
                />
              </a>
              <a
                href="https://www.apple.com/music/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] font-bold text-white opacity-85 transition hover:opacity-100"
                title="Apple Music"
              >
                <AppleLogo className="h-3.5 w-3.5 fill-current" />
                <span>Music</span>
              </a>
            </div>
            <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-nav-text/70">
              This product uses the TMDB, AniList, RAWG, Open Library, and Apple Music APIs but is not endorsed or certified by them. Media metadata, covers, and previews are provided by their respective services.
            </p>
          </div>
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
          <span>© {new Date().getFullYear()} Omnilist</span>
          <span>Track · Discover · Share</span>
        </div>
      </div>
    </footer>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" className={className} aria-hidden="true">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.66-7.9-11.88-14.5-5.37-8.4-9.6-17.75-12.7-28.06-3.1-10.31-4.65-20.25-4.65-29.82 0-14.35 3.66-26.17 10.98-35.47 7.32-9.3 16.5-14.07 27.54-14.3 4.8-.1 10.1 1.25 15.9 4.04 5.8 2.8 9.5 4.3 11.1 4.5 1.8-.3 5.7-1.9 11.7-4.8 6-2.9 11.2-4.2 15.6-3.9 12.3.8 22.3 5.4 30 13.8-10.7 6.5-16 15.3-15.9 26.4.1 8.7 3.3 15.9 9.6 21.6 6.3 5.7 13.9 9.1 22.8 10.2-2.1 6.3-4.7 12.6-7.8 18.9zM119.22 31.84c0-7.3 2.6-14.1 7.8-20.4 5.2-6.3 11.6-10.3 19.2-11.9.6 2.4.9 4.8.9 7.2 0 7.3-2.7 14.1-8.1 20.4-5.4 6.3-11.9 10.1-19.5 11.4-.2-2.3-.3-4.5-.3-6.7z" />
    </svg>
  );
}
