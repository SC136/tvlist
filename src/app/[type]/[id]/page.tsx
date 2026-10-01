import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { CastCard, CrewCard } from "@/components/media/people-cards";
import { ScoreDistribution, StatusDistribution } from "@/components/media/distribution";
import { Trailer } from "@/components/media/trailer";
import { ReviewCard } from "@/components/review/review-card";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { SectionHeader } from "@/components/ui/basics";
import { UserScore } from "@/components/ui/user-score";
import { getMediaPage } from "@/lib/queries/media-page";
import { getCommunityStats, getStatusesFor } from "@/lib/queries/media";
import { listReviews } from "@/lib/queries/reviews";
import { getCollectionParts } from "@/lib/tmdb";
import { formatDate, STATUS_COLORS, statusLabel } from "@/lib/format";

export default async function MediaOverview({ params }: PageProps<"/[type]/[id]">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const { details: d, row, viewer, scoreFormat } = data;
  const base = `/${type}/${id}`;

  const [collection, stats, reviews, following] = await Promise.all([
    d.collection ? getCollectionParts(d.collection.id) : null,
    row ? getCommunityStats(row.id) : null,
    row ? listReviews({ where: eq(schema.review.mediaId, row.id), limit: 4, order: "top" }) : [],
    viewer && row ? getFollowingEntries(viewer.id, row.id) : [],
  ]);
  const recs = (d.recommendations.length ? d.recommendations : d.similar).slice(0, 10);
  const statuses = await getStatusesFor(viewer?.id, [...recs, ...(collection?.parts ?? [])]);
  const relations = collection?.parts.filter((p) => p.id !== d.id) ?? [];

  return (
    <div className="space-y-10">
      {relations.length > 0 && (
        <section>
          <SectionHeader title={collection!.name} className="normal-case" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {relations.map((p) => {
              const idx = collection!.parts.findIndex((x) => x.id === p.id);
              const selfIdx = collection!.parts.findIndex((x) => x.id === d.id);
              return (
                <Link key={p.id} href={`/movie/${p.id}`} className="card group flex h-[115px] overflow-hidden">
                  <Cover path={p.posterPath} alt={p.title} size="w154" className="h-full w-[80px] shrink-0" />
                  <div className="flex flex-col justify-between p-3">
                    <div>
                      <p className="text-[11px] font-bold tracking-wide text-accent uppercase">{idx < selfIdx ? "Prequel" : "Sequel"}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] font-semibold text-bright transition group-hover:text-accent">{p.title}</p>
                    </div>
                    <p className="text-[12px] text-text-lighter">
                      Movie · {p.year ?? "TBA"}
                      {statuses[`movie:${p.id}`] && (
                        <span style={{ color: STATUS_COLORS[statuses[`movie:${p.id}`]] }}> · {statusLabel(statuses[`movie:${p.id}`], "movie")}</span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {type === "tv" && d.nextEpisode?.airDate && (
        <section className="card flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[12px] font-bold tracking-wide text-accent uppercase">Next Episode</p>
            <p className="mt-1 text-[14px] font-semibold text-bright">
              S{d.nextEpisode.season} E{d.nextEpisode.episode}
              {d.nextEpisode.name && !/^Episode \d+$/.test(d.nextEpisode.name) ? ` · ${d.nextEpisode.name}` : ""}
            </p>
          </div>
          <p className="text-[13px] font-semibold">{formatDate(d.nextEpisode.airDate)}</p>
        </section>
      )}

      {d.cast.length > 0 && (
        <section>
          <SectionHeader title="Cast" href={`${base}/cast`} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {d.cast.slice(0, 6).map((c) => (
              <CastCard key={c.id} member={c} />
            ))}
          </div>
        </section>
      )}

      {d.crew.length > 0 && (
        <section>
          <SectionHeader title="Crew" href={`${base}/crew`} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {d.crew.slice(0, 3).map((c) => (
              <CrewCard key={c.id} member={c} />
            ))}
          </div>
        </section>
      )}

      {following.length > 0 && (
        <section>
          <SectionHeader title="Following" />
          <div className="card divide-y divide-fg-grey-dark">
            {following.map((f) => (
              <Link key={f.username} href={`/user/${f.username}`} className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition hover:bg-fg-grey">
                <Avatar src={f.image} name={f.name} size={32} />
                <span className="flex-1 font-semibold text-bright">{f.name}</span>
                <span className="w-28 font-semibold" style={{ color: STATUS_COLORS[f.status] }}>
                  {statusLabel(f.status, d.type)}
                  {d.type === "tv" && f.status === "CURRENT" ? ` · ${f.progress}` : ""}
                </span>
                <span className="w-16 text-right">
                  <UserScore score={f.score} format={scoreFormat} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {stats && stats.members > 0 && (
        <section className="grid gap-8 xl:grid-cols-2">
          <div>
            <SectionHeader title="Status Distribution" href={`${base}/stats`} />
            <StatusDistribution rows={stats.statuses} type={d.type} />
          </div>
          <div>
            <SectionHeader title="Score Distribution" href={`${base}/stats`} />
            <ScoreDistribution rows={stats.scores} />
          </div>
        </section>
      )}

      {d.trailer && (
        <section>
          <SectionHeader title="Trailer" />
          <div className="max-w-[560px]">
            <Trailer videoKey={d.trailer.key} title={d.trailer.name} />
          </div>
        </section>
      )}

      {recs.length > 0 && (
        <section>
          <SectionHeader title="Recommendations" />
          <MediaGrid className="lg:grid-cols-5">
            {recs.map((r) => (
              <MediaCard key={r.id} media={r} listStatus={statuses[`${r.type}:${r.id}`]} />
            ))}
          </MediaGrid>
        </section>
      )}

      <section>
        <SectionHeader title="Reviews" href={`${base}/reviews`} linkLabel={reviews.length ? "View All" : "Write a Review"} />
        {reviews.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="card p-5 text-[13px] text-text-lighter">
            No reviews yet.{" "}
            <Link href={`${base}/reviews`} className="font-semibold text-accent">
              Be the first to write one.
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

async function getFollowingEntries(viewerId: string, mediaId: number) {
  const follows = await db
    .select({ id: schema.follow.followingId })
    .from(schema.follow)
    .where(eq(schema.follow.followerId, viewerId));
  if (!follows.length) return [];
  const rows = await db
    .select({
      username: schema.user.username,
      displayUsername: schema.user.displayUsername,
      image: schema.user.image,
      status: schema.listEntry.status,
      score: schema.listEntry.score,
      progress: schema.listEntry.progress,
    })
    .from(schema.listEntry)
    .innerJoin(schema.user, eq(schema.user.id, schema.listEntry.userId))
    .where(
      and(
        eq(schema.listEntry.mediaId, mediaId),
        eq(schema.listEntry.private, false),
        inArray(
          schema.listEntry.userId,
          follows.map((f) => f.id),
        ),
      ),
    )
    .orderBy(desc(schema.listEntry.updatedAt))
    .limit(10);
  return rows.map((r) => ({ ...r, username: r.username ?? "", name: r.displayUsername || r.username || "user" }));
}
