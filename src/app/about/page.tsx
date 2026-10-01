import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/ui/basics";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Page narrow>
      <article className="card mx-auto max-w-[760px] space-y-4 p-8 text-[14px] leading-relaxed">
        <h1 className="text-[24px] font-bold text-bright">About tvlist</h1>
        <p>
          tvlist is a place to track the movies and TV shows you watch, keep a diary of every viewing, rate and review what you&apos;ve
          seen, build lists, explore your stats, and follow friends to see what they&apos;re watching.
        </p>
        <h2 className="pt-2 text-[16px] font-bold text-bright">Features</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Movie and TV lists with statuses, scores in five formats, episode progress, dates, rewatches and private notes</li>
          <li>A diary with half-star ratings, likes and rewatches</li>
          <li>Reviews with helpfulness voting, and custom ranked lists</li>
          <li>An activity feed with status posts, profile messages, likes, replies and @mentions</li>
          <li>Detailed stats: genres, actors, directors, studios, release and watch years</li>
          <li>Forum threads for every title, airing reminders and notifications</li>
          <li>Letterboxd import and full data export</li>
        </ul>
        <h2 className="pt-2 text-[16px] font-bold text-bright">Data</h2>
        <p>
          Movie and TV metadata and images come from{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
            The Movie Database (TMDB)
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by JustWatch via TMDB.
        </p>
        <p>
          See the <Link href="/terms" className="font-semibold text-accent">Terms &amp; Privacy</Link> page for how your data is handled.
        </p>
      </article>
    </Page>
  );
}
