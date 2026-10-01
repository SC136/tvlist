import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/cn";
import { tmdbImage, type PosterSize } from "@/lib/media";

/** Poster image with a graceful placeholder. */
export function Cover({
  path,
  alt,
  size = "w342",
  className,
  priority,
}: {
  path: string | null | undefined;
  alt: string;
  size?: PosterSize;
  className?: string;
  priority?: boolean;
}) {
  const src = tmdbImage(path, size);
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-fg-grey-dark text-text-lighter", className)} role="img" aria-label={alt}>
        <Clapperboard className="h-1/4 w-1/4 opacity-50" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("bg-fg-grey-dark object-cover", className)}
    />
  );
}

export function PersonImage({
  path,
  alt,
  className,
  size = "w185",
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  size?: "w45" | "w185" | "h632";
}) {
  const src = tmdbImage(path, size);
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-fg-grey-dark text-text-lighter", className)} role="img" aria-label={alt}>
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 opacity-40" fill="currentColor" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("bg-fg-grey-dark object-cover", className)} />
  );
}
