import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScoreFace } from "@/components/ui/score-face";
import { Empty } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import { getSeason } from "@/lib/tmdb";
import { formatDate, formatRuntime } from "@/lib/format";
import { tmdbImage } from "@/lib/media";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/seasons/[season]">): Promise<Metadata> {
  const { type, id, season } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Season ${season}` } : {};
}

export default async function SeasonPage({ params }: PageProps<"/[type]/[id]/seasons/[season]">) {
  const { type, id, season } = await params;
  const data = await getMediaPage(type, id);
  if (!data || type !== "tv") notFound();
  const n = Number(season);
  const s = await getSeason(Number(id), n);
  if (!s) notFound();
  const { details, entry } = data;

  // Episodes watched before this season, to highlight what the viewer has seen.
  const before = details.seasonList.filter((x) => x.number > 0 && x.number < n).reduce((a, x) => a + x.episodes, 0);
  const seenHere = n > 0 ? Math.max(0, Math.min(s.episodes.length, (entry?.progress ?? 0) - before)) : 0;
  const numbers = details.seasonList.map((x) => x.number).sort((a, b) => a - b);
  const idx = numbers.indexOf(n);
  const prev = idx > 0 ? numbers[idx - 1] : null;
  const next = idx >= 0 && idx < numbers.length - 1 ? numbers[idx + 1] : null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Link href={`/tv/${id}/seasons`} className="text-[12px] font-semibold text-text-lighter hover:text-accent">
            ← All seasons
          </Link>
          <h2 className="mt-1 text-[18px] font-bold text-bright">{s.name}</h2>
          <p className="text-[13px] text-text-lighter">
            {s.episodes.length} episodes{s.airDate && ` · ${formatDate(s.airDate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {prev !== null && (
            <Link href={`/tv/${id}/seasons/${prev}`} className="btn btn-secondary px-3" aria-label="Previous season">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {next !== null && (
            <Link href={`/tv/${id}/seasons/${next}`} className="btn btn-secondary px-3" aria-label="Next season">
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      {s.overview && <p className="card mb-6 p-4 text-[13px] leading-relaxed">{s.overview}</p>}
      {s.episodes.length === 0 ? (
        <Empty>No episodes listed yet.</Empty>
      ) : (
        <ol className="space-y-3">
          {s.episodes.map((e) => {
            const still = tmdbImage(e.stillPath, "w300");
            const seen = e.number <= seenHere;
            const upcoming = e.airDate ? e.airDate > new Date().toISOString().slice(0, 10) : true;
            return (
              <li key={e.number} className={`card flex gap-4 overflow-hidden ${seen ? "ring-1 ring-green/40" : ""}`}>
                <div className="relative hidden aspect-video w-[200px] shrink-0 bg-fg-grey-dark sm:block">
                  {still && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={still} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {seen && <span className="absolute top-2 left-2 rounded bg-green px-1.5 py-px text-[10px] font-bold text-white">WATCHED</span>}
                </div>
                <div className="min-w-0 flex-1 py-3 pr-4 pl-4 sm:pl-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[14px] font-semibold text-bright">
                      <span className="text-text-lighter">E{e.number} · </span>
                      {e.name}
                    </p>
                    {!upcoming && e.score ? <ScoreFace score={e.score} className="text-[12px]" /> : null}
                  </div>
                  <p className="mt-0.5 text-[12px] text-text-lighter">
                    {e.airDate ? (upcoming ? `Airs ${formatDate(e.airDate)}` : formatDate(e.airDate)) : "TBA"}
                    {e.runtime ? ` · ${formatRuntime(e.runtime)}` : ""}
                  </p>
                  {e.overview && <p className="mt-2 line-clamp-3 text-[13px] text-text-light">{e.overview}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
