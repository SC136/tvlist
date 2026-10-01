import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { TimeAgo } from "@/components/ui/basics";
import { RichText } from "@/components/social/rich-text";
import { ReviewRating } from "@/components/review/review-rating";
import { SpoilerGate } from "@/components/review/spoiler-gate";
import { getViewer } from "@/lib/session";
import { getReview } from "@/lib/queries/reviews";
import { tmdbImage } from "@/lib/media";

export async function generateMetadata({ params }: PageProps<"/review/[id]">): Promise<Metadata> {
  const { id } = await params;
  const review = await getReview(Number(id));
  if (!review) return {};
  const by = review.user.displayUsername || review.user.username;
  return { title: `${review.media.title} review by ${by}`, description: review.summary };
}

export default async function ReviewPage({ params }: PageProps<"/review/[id]">) {
  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId)) notFound();
  const viewer = await getViewer();
  const review = await getReview(reviewId, viewer?.id);
  if (!review) notFound();
  const name = review.user.displayUsername || review.user.username || "user";
  const banner = tmdbImage(review.media.backdropPath, "original");
  const isOwner = viewer?.id === review.userId;

  return (
    <div>
      <div className="relative h-[300px] bg-nav md:h-[420px]">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="container-narrow relative flex h-full flex-col items-center justify-end pb-10 text-center text-white">
          <Link href={`/${review.media.type}/${review.media.tmdbId}`} className="text-[22px] font-extrabold hover:text-accent md:text-[30px]">
            {review.media.title}
            {review.media.year && <span className="font-semibold text-white/70"> ({review.media.year})</span>}
          </Link>
          <p className="mt-2 text-[15px] text-white/80">
            a review by{" "}
            <Link href={`/user/${review.user.username}`} className="font-semibold text-white hover:text-accent">
              {name}
            </Link>
          </p>
        </div>
      </div>

      <div className="container-narrow py-10">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href={`/user/${review.user.username}`} className="flex items-center gap-3">
              <Avatar src={review.user.image} name={name} size={44} />
              <div>
                <p className="text-[14px] font-semibold text-accent">{name}</p>
                <p className="text-[12px] text-text-lighter">
                  <TimeAgo date={review.createdAt} />
                  {review.updatedAt.getTime() - review.createdAt.getTime() > 60_000 && " · edited"}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {isOwner && (
                <Link href={`/review/new?type=${review.media.type}&id=${review.media.tmdbId}`} className="btn btn-secondary px-3 py-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              )}
              <span className="rounded bg-accent px-3 py-1.5 text-[16px] font-extrabold text-on-accent">{review.score}/100</span>
            </div>
          </div>

          <p className="card mb-6 border-l-4 border-accent p-4 text-[15px] font-semibold text-bright italic">{review.summary}</p>

          <article className="card p-6 md:p-8">
            {review.containsSpoilers ? (
              <SpoilerGate>
                <RichText text={review.body} className="text-[15px]" />
              </SpoilerGate>
            ) : (
              <RichText text={review.body} className="text-[15px]" />
            )}
          </article>

          <div className="mt-8 flex flex-col items-center gap-6 md:flex-row md:items-stretch">
            <Link href={`/${review.media.type}/${review.media.tmdbId}`} className="card group flex w-full items-center gap-3 p-3 md:w-auto md:min-w-[260px]">
              <Cover path={review.media.posterPath} alt="" size="w154" className="h-[80px] w-[56px] rounded-sm" />
              <div>
                <p className="text-[11px] font-bold tracking-wide text-text-lighter uppercase">Reviewed</p>
                <p className="font-semibold text-bright transition group-hover:text-accent">{review.media.title}</p>
              </div>
            </Link>
            <div className="w-full flex-1">
              <ReviewRating reviewId={review.id} initial={review.myRating} up={review.upCount} total={review.ratingCount} canRate={Boolean(viewer) && !isOwner} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
