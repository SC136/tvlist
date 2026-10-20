import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  BookText,
  Clock,
  Film,
  Gamepad2,
  Music,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";
import { AddToList } from "@/components/list/add-to-list";
import { MediaActions } from "@/components/list/media-actions";
import { Cover } from "@/components/ui/cover";
import { ExpandableText } from "@/components/ui/expandable-text";
import { NavTabs } from "@/components/ui/nav-tabs";
import { MediaSidebar } from "@/components/media/media-sidebar";
import { getMediaPage } from "@/lib/queries/media-page";
import { formatNumber, formatRuntime } from "@/lib/format";
import { tmdbImage, type MediaDetails, type MediaType } from "@/lib/media";

export async function generateMetadata({ params }: LayoutProps<"/[type]/[id]">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) return {};
  const { details } = data;
  const title = details.year ? `${details.title} (${details.year})` : details.title;
  const image = tmdbImage(details.backdropPath, "w1280") ?? tmdbImage(details.posterPath, "w500");
  return {
    title: { default: title, template: "%s · Omnilist" },
    description: details.overview.slice(0, 200) || undefined,
    openGraph: { title, description: details.overview.slice(0, 200), images: image ? [image] : undefined },
  };
}

function categoryIcon(type: MediaType) {
  switch (type) {
    case "movie":
      return <Film className="h-3 w-3" />;
    case "tv":
      return <Tv className="h-3 w-3" />;
    case "anime":
      return <Sparkles className="h-3 w-3" />;
    case "manga":
      return <BookOpen className="h-3 w-3" />;
    case "book":
      return <BookText className="h-3 w-3" />;
    case "music":
      return <Music className="h-3 w-3" />;
    case "game":
      return <Gamepad2 className="h-3 w-3" />;
  }
}

function runtimeText(d: MediaDetails): string | null {
  if (d.type === "game" && d.runtime) {
    return `${Math.round(d.runtime / 60)}h playtime`;
  }
  if (d.type === "movie" && d.runtime) {
    return formatRuntime(d.runtime);
  }
  if ((d.type === "tv" || d.type === "anime") && d.episodes) {
    return `${d.episodes} episodes`;
  }
  if (d.type === "manga") {
    if (d.chapters) return `${d.chapters} chapters`;
    if (d.volumes) return `${d.volumes} volumes`;
  }
  if (d.type === "book" && d.pages) {
    return `${d.pages} pages`;
  }
  if (d.type === "music" && d.episodes) {
    return `${d.episodes} tracks`;
  }
  return null;
}

export default async function MediaLayout({ params, children }: LayoutProps<"/[type]/[id]">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const { details, viewer, entry, favourite, scoreFormat } = data;
  const base = `/${type}/${id}`;
  const banner = tmdbImage(details.backdropPath, "original") ?? tmdbImage(details.posterPath, "original");
  const actionMedia = {
    type: details.type,
    tmdbId: details.id,
    title: details.title,
    year: details.year,
    seasons: details.seasonList.map((s) => s.number).filter((n) => n > 0),
  };

  const tabs = [
    { href: base, label: "Overview", exact: true },
    ...(type === "tv" ? [{ href: `${base}/seasons`, label: "Seasons" }] : []),
    ...(type === "movie" || type === "tv" || type === "anime" || type === "manga"
      ? [
          { href: `${base}/cast`, label: type === "manga" ? "Characters" : "Cast" },
          { href: `${base}/crew`, label: type === "manga" ? "Staff" : "Crew" },
        ]
      : []),
    { href: `${base}/stats`, label: "Stats" },
    { href: `${base}/social`, label: "Social" },
    { href: `${base}/reviews`, label: "Reviews" },
  ];

  return (
    <div>
      {/* Immersive Modern Backdrop Hero */}
      <div className="relative min-h-[380px] overflow-hidden bg-nav md:min-h-[460px]">
        {/* Ambient Backdrop Image with soft gradient blending */}
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_20%] opacity-35 filter md:opacity-40"
          />
        ) : null}

        {/* Multi-stop cinematic gradients that blend into dark UI */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/70 to-transparent" />

        {/* Hero Content Container */}
        <div className="container-page relative z-10 pt-20 pb-6 md:pt-24 md:pb-8">
          <div className="grid grid-cols-[115px_1fr] gap-5 md:grid-cols-[220px_1fr] md:gap-8 lg:gap-10">
            {/* Left: Floating Elevated Poster Card */}
            <div className="space-y-4">
              <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-fg-grey shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <Cover
                  path={details.posterPath}
                  alt={details.title}
                  size="w500"
                  priority
                  className="cover-ratio w-full transition duration-300 group-hover:scale-[1.02]"
                />
              </div>

              {/* Desktop action buttons directly under poster */}
              <div className="hidden space-y-2.5 md:block">
                <AddToList
                  media={{
                    type: details.type,
                    tmdbId: details.id,
                    title: details.title,
                    posterPath: details.posterPath,
                    backdropPath: details.backdropPath,
                    episodes: details.episodes,
                  }}
                  entry={entry}
                  favourite={favourite}
                  scoreFormat={scoreFormat}
                  loggedIn={Boolean(viewer)}
                />
                <MediaActions media={actionMedia} loggedIn={Boolean(viewer)} />
              </div>
            </div>

            {/* Right: Rich Metadata & Title Info */}
            <div className="flex min-w-0 flex-col justify-end pb-1">
              {/* Category, Format & Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                  {categoryIcon(details.type)}
                  {details.format}
                </span>

                {details.status && (
                  <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent tracking-wide uppercase">
                    {details.status}
                  </span>
                )}

                {details.year && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-text-light">
                    {details.year}
                  </span>
                )}

                {details.certification && (
                  <span className="rounded border border-white/20 px-2 py-0.5 text-[11px] font-bold text-text-light">
                    {details.certification}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mt-3.5 text-[24px] leading-tight font-extrabold text-white drop-shadow-md sm:text-[32px] md:text-[38px]">
                {details.title}
              </h1>

              {/* Tagline / Subtitle */}
              {details.tagline && (
                <p className="mt-1.5 text-[14px] text-white/80 italic md:text-[15px]">
                  {details.tagline}
                </p>
              )}

              {/* Game Platforms Badges */}
              {details.type === "game" && details.platforms && details.platforms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {details.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-text-light"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Stats Strip */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-text-light">
                {details.score !== null && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white backdrop-blur">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span>{details.score}%</span>
                    {details.voteCount ? (
                      <span className="text-[11px] text-text-lighter font-normal">
                        ({formatNumber(details.voteCount)} votes)
                      </span>
                    ) : null}
                  </div>
                )}

                {runtimeText(details) && (
                  <span className="flex items-center gap-1.5 text-white/90">
                    <Clock className="h-3.5 w-3.5 text-text-lighter" />
                    {runtimeText(details)}
                  </span>
                )}

                {/* Genre pills */}
                {details.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {details.genres.slice(0, 4).map((g) => (
                      <Link
                        key={g}
                        href={`/search/${details.type}?genres=${encodeURIComponent(g)}`}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-text-lighter transition hover:border-accent hover:text-white"
                      >
                        {g}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Synopsis in hero */}
              {details.overview && (
                <ExpandableText
                  text={details.overview}
                  lines={3}
                  className="mt-4 hidden max-w-3xl text-text-light md:block"
                />
              )}
            </div>

            {/* Mobile Actions under poster & title */}
            <div className="col-span-2 pt-2 md:hidden">
              <AddToList
                media={{
                  type: details.type,
                  tmdbId: details.id,
                  title: details.title,
                  posterPath: details.posterPath,
                  backdropPath: details.backdropPath,
                  episodes: details.episodes,
                }}
                entry={entry}
                favourite={favourite}
                scoreFormat={scoreFormat}
                loggedIn={Boolean(viewer)}
              />
              <div className="mt-2.5">
                <MediaActions media={actionMedia} loggedIn={Boolean(viewer)} />
              </div>
              {details.overview && (
                <ExpandableText text={details.overview} lines={4} className="mt-3.5 text-text-light" />
              )}
            </div>
          </div>
        </div>

        {/* Floating Segmented Pill Tabs Bar */}
        <div className="border-t border-white/10 bg-fg/70 backdrop-blur-md">
          <div className="container-page py-2.5">
            <NavTabs
              tabs={tabs}
              variant="pills"
              className="justify-start md:justify-center"
            />
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="container-page grid gap-8 py-8 md:grid-cols-[220px_1fr] md:gap-10">
        <MediaSidebar data={data} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
