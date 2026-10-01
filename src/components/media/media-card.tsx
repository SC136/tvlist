import Link from "next/link";
import { Cover } from "@/components/ui/cover";
import { cn } from "@/lib/cn";
import { STATUS_COLORS, statusLabel, type ListStatus } from "@/lib/format";
import { mediaHref, type MediaSummary } from "@/lib/media";

export type CardMedia = Pick<
  MediaSummary,
  "type" | "id" | "title" | "posterPath" | "year" | "date" | "genres" | "score" | "overview"
>;

/**
 * Poster card. On hover (devices with a pointer) an info strip slides up over
 * the bottom of the poster: year, score and top genres. Pure CSS, no client JS.
 */
export function MediaCard({
  media,
  listStatus,
  caption,
  rank,
  priority,
}: {
  media: CardMedia;
  listStatus?: ListStatus | null;
  /** Small line under the title (e.g. a role or "Ep 4 airing tomorrow"). */
  caption?: string | null;
  rank?: number;
  priority?: boolean;
}) {
  const genres = media.genres.slice(0, 2).join(" · ");
  return (
    <div className="group relative">
      <Link href={mediaHref(media.type, media.id)} className="block">
        <div className="relative overflow-hidden rounded-lg shadow-[var(--shadow-card)]">
          <Cover
            path={media.posterPath}
            alt={media.title}
            className="cover-ratio w-full transition duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />

          {rank !== undefined && (
            <span className="absolute top-0 left-0 flex h-8 min-w-8 items-center justify-center rounded-br-lg bg-accent px-1.5 text-[13px] font-extrabold text-on-accent">
              #{rank}
            </span>
          )}

          {listStatus && (
            <span
              className="absolute right-2 bottom-2 h-3 w-3 rounded-full ring-2 ring-black/40 transition group-hover:opacity-0"
              style={{ background: STATUS_COLORS[listStatus] }}
              title={statusLabel(listStatus, media.type)}
            />
          )}

          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-3 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-2.5 pt-12 pb-2.5 opacity-0",
              "transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:block",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-[12px] font-bold text-white">
              <span>{media.year ?? "TBA"}</span>
              {media.score !== null && <span className="rounded bg-white/20 px-1.5 py-px backdrop-blur-sm">{media.score}%</span>}
            </div>
            {genres && <p className="mt-0.5 truncate text-[11px] text-white/75">{genres}</p>}
            {listStatus && (
              <p className="mt-1 text-[11px] font-semibold" style={{ color: STATUS_COLORS[listStatus] }}>
                {statusLabel(listStatus, media.type)}
              </p>
            )}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-text transition group-hover:text-accent md:text-[14px]">
          {media.title}
        </p>
        {caption && <p className="mt-0.5 truncate text-[12px] font-semibold text-text-lighter">{caption}</p>}
      </Link>
    </div>
  );
}

export function MediaGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 md:gap-x-6 lg:grid-cols-6 xl:gap-x-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
