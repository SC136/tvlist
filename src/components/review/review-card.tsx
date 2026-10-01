import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { TimeAgo } from "@/components/ui/basics";
import { tmdbImage } from "@/lib/media";
import type { ReviewListItem } from "@/lib/queries/reviews";

function name(u: ReviewListItem["user"]) {
  return u.displayUsername || u.username || "user";
}

/** Compact card: avatar + summary quote (media page / profile). */
export function ReviewCard({ review }: { review: ReviewListItem }) {
  return (
    <div className="flex gap-3">
      <Link href={`/user/${review.user.username}`} className="shrink-0" aria-label={name(review.user)}>
        <Avatar src={review.user.image} name={name(review.user)} size={48} />
      </Link>
      <Link href={`/review/${review.id}`} className="card group relative flex-1 p-4 text-[13px]">
        <span className="absolute top-4 -left-1.5 h-3 w-3 rotate-45 bg-fg" />
        <p className="line-clamp-3 italic transition group-hover:text-accent">{review.containsSpoilers ? <span className="text-orange not-italic">[Spoilers] </span> : null}{review.summary}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-text-lighter">
          <span>
            by {name(review.user)} · <TimeAgo date={review.createdAt} />
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" /> {review.upCount}
          </span>
        </div>
      </Link>
    </div>
  );
}

/** Large card with the title's backdrop (reviews index). */
export function ReviewTile({ review }: { review: ReviewListItem }) {
  const bg = tmdbImage(review.media.backdropPath, "w780");
  return (
    <Link href={`/review/${review.id}`} className="card group relative block overflow-hidden">
      <div className="relative h-[120px] bg-nav">
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition group-hover:opacity-90" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3">
          <Cover path={review.media.posterPath} alt="" size="w154" className="h-[72px] w-[50px] shrink-0 rounded-sm" />
          <p className="line-clamp-2 text-[14px] font-bold text-white">{review.media.title}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-3 text-[13px] italic transition group-hover:text-accent">{review.summary}</p>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-text-lighter">
          <Avatar src={review.user.image} name={name(review.user)} size={22} />
          <span className="font-semibold text-text">{name(review.user)}</span>
          <span className="ml-auto flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" /> {review.upCount}
          </span>
          <span className="rounded bg-accent px-1.5 py-px text-[11px] font-bold text-on-accent">{review.score}/100</span>
        </div>
      </div>
    </Link>
  );
}
