import Link from "next/link";
import { Cover } from "@/components/ui/cover";
import { ScoreFace } from "@/components/ui/score-face";
import { formatDate } from "@/lib/format";
import { MEDIA_LABEL, mediaHref, type MediaSummary } from "@/lib/media";

/** Wide list-style row used by "Top 100" and list-view browsing. */
export function MediaRow({ media, rank }: { media: MediaSummary; rank?: number }) {
  return (
    <div className="flex items-center gap-3 md:gap-5">
      {rank !== undefined && (
        <span className="w-10 shrink-0 text-right text-[20px] font-extrabold text-text-lighter md:w-14 md:text-[24px]">
          <span className="text-[14px] md:text-[16px]">#</span>
          {rank}
        </span>
      )}
      <Link href={mediaHref(media.type, media.id)} className="card group flex min-w-0 flex-1 items-center gap-4 p-2.5 pr-4">
        <Cover path={media.posterPath} alt={media.title} size="w154" className="h-[72px] w-[50px] shrink-0 rounded-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-bright transition group-hover:text-accent">{media.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {media.genres.slice(0, 4).map((g) => (
              <span key={g} className="rounded-full bg-accent/90 px-2 py-px text-[11px] font-bold text-on-accent lowercase">
                {g}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden w-28 shrink-0 md:block">
          <ScoreFace score={media.score} className="text-[14px]" />
          <p className="text-[12px] text-text-lighter">{media.voteCount.toLocaleString("en-US")} votes</p>
        </div>
        <div className="hidden w-28 shrink-0 lg:block">
          <p className="text-[14px] font-semibold">{MEDIA_LABEL[media.type].one}</p>
          <p className="text-[12px] text-text-lighter">{media.originalLanguage?.toUpperCase()}</p>
        </div>
        <div className="hidden w-32 shrink-0 sm:block">
          <p className="text-[14px] font-semibold">{media.year ?? "TBA"}</p>
          <p className="text-[12px] text-text-lighter">{formatDate(media.date)}</p>
        </div>
      </Link>
    </div>
  );
}
