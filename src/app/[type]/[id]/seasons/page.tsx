import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/ui/cover";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/seasons">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Seasons` } : {};
}

export default async function SeasonsPage({ params }: PageProps<"/[type]/[id]/seasons">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data || type !== "tv") notFound();
  const { details, entry } = data;
  const seasons = details.seasonList.slice().sort((a, b) => (a.number === 0 ? 1 : b.number === 0 ? -1 : a.number - b.number));
  if (!seasons.length) return <Empty>No season information yet.</Empty>;

  // Map overall progress onto seasons (specials excluded) for the progress bars.
  let remaining = entry?.progress ?? 0;
  const watchedBySeason = new Map<number, number>();
  for (const s of seasons.filter((s) => s.number > 0)) {
    const watched = Math.min(remaining, s.episodes);
    watchedBySeason.set(s.number, watched);
    remaining -= watched;
  }

  return (
    <section>
      <SectionHeader title={`Seasons (${seasons.filter((s) => s.number > 0).length})`} />
      <div className="space-y-4">
        {seasons.map((s) => {
          const watched = watchedBySeason.get(s.number) ?? 0;
          return (
            <Link key={s.number} href={`/tv/${id}/seasons/${s.number}`} className="card group flex overflow-hidden">
              <Cover path={s.posterPath ?? details.posterPath} alt={s.name} size="w154" className="h-[150px] w-[100px] shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-bright transition group-hover:text-accent">{s.name}</h3>
                  <p className="text-[12px] font-semibold text-text-lighter">
                    {s.episodes} episode{s.episodes === 1 ? "" : "s"}
                    {s.airDate && ` · ${formatDate(s.airDate)}`}
                  </p>
                </div>
                {s.overview && <p className="mt-2 line-clamp-3 text-[13px] text-text-light">{s.overview}</p>}
                {entry && s.number > 0 && s.episodes > 0 && (
                  <div className="mt-auto pt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg-grey-dark">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(watched / s.episodes) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-text-lighter">
                      {watched}/{s.episodes} watched
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
