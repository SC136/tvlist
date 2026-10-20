import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/ui/basics";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Page narrow>
      <article className="card mx-auto max-w-[760px] space-y-4 p-8 text-[14px] leading-relaxed">
        <h1 className="text-[24px] font-bold text-bright">About Omnilist</h1>
        <p>
          Omnilist is a unified social tracker for movies, TV shows, anime, manga, books, music and video games. Track everything you watch, read, play and listen to, keep a diary of every experience, rate and review titles, build custom lists, explore deep statistics, and follow friends.
        </p>
        <h2 className="pt-2 text-[16px] font-bold text-bright">Features</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Multi-media lists across 7 categories with custom statuses, scoring in 5 formats, progress tracking, dates, rewatches/replays/rereads and private notes</li>
          <li>A comprehensive diary with half-star ratings, likes and rewatch/revisit markers</li>
          <li>In-depth user statistics: hours watched/played, pages read, top genres, directors, studios, and release year distributions</li>
          <li>Community activity feeds with status posts, reviews, likes, comments and @mentions</li>
          <li>Curated and ranked custom lists</li>
          <li>Interactive audio previews for music albums and YouTube trailers for films and anime</li>
          <li>Discussion forums across all media categories</li>
          <li>Letterboxd import and full data export</li>
        </ul>
        <h2 className="pt-2 text-[16px] font-bold text-bright">Data &amp; Attribution</h2>
        <ul className="space-y-2 pl-1">
          <li>
            <strong>Movies &amp; TV Shows:</strong> Metadata and images from{" "}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              The Movie Database (TMDB)
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability provided by JustWatch via TMDB.
          </li>
          <li>
            <strong>Anime &amp; Manga:</strong> Titles, airing schedules, character and staff information provided by{" "}
            <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              AniList
            </a>
            .
          </li>
          <li>
            <strong>Video Games:</strong> Game data, release dates, screenshots and developer info provided by{" "}
            <a href="https://rawg.io/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              RAWG
            </a>{" "}
            and Steam.
          </li>
          <li>
            <strong>Books:</strong> Book records, covers, subjects and editions provided by{" "}
            <a href="https://openlibrary.org/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              Open Library
            </a>{" "}
            and the Internet Archive.
          </li>
          <li>
            <strong>Music:</strong> Album artwork, metadata and 30-second audio previews provided by{" "}
            <a href="https://www.apple.com/music/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
              Apple Music
            </a>
            .
          </li>
        </ul>
        <p className="pt-2">
          See the <Link href="/terms" className="font-semibold text-accent">Terms &amp; Privacy</Link> page for how your data is handled.
        </p>
      </article>
    </Page>
  );
}
