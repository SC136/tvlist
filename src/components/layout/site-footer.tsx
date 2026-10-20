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
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}
