import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreDistribution, StatusDistribution } from "@/components/media/distribution";
import { SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import { getCommunityStats } from "@/lib/queries/media";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/stats">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Stats` } : {};
}

export default async function MediaStatsPage({ params }: PageProps<"/[type]/[id]/stats">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const { details: d, row, favourites } = data;
  const stats = row ? await getCommunityStats(row.id) : null;

  const tiles = [
    { label: "TMDB Score", value: d.score !== null ? `${d.score}%` : "—" },
    { label: "TMDB Votes", value: formatNumber(d.voteCount) },
    { label: "Community Mean Score", value: stats?.mean ? `${stats.mean}%` : "—" },
    { label: "Omnilist Members", value: formatNumber(stats?.members ?? 0) },
    { label: "Favorites", value: formatNumber(favourites) },
    { label: "Popularity", value: formatNumber(Math.round(d.popularity)) },
  ];

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title="Rankings & Numbers" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="card p-4 text-center">
              <p className="text-[20px] font-extrabold text-accent">{t.value}</p>
              <p className="mt-1 text-[12px] font-semibold text-text-lighter">{t.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionHeader title="Status Distribution" />
        <StatusDistribution rows={stats?.statuses ?? []} type={d.type} />
      </section>
      <section>
        <SectionHeader title="Score Distribution" />
        <ScoreDistribution rows={stats?.scores ?? []} />
      </section>
    </div>
  );
}
