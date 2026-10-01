import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToList } from "@/components/list/add-to-list";
import { MediaActions } from "@/components/list/media-actions";
import { Cover } from "@/components/ui/cover";
import { ExpandableText } from "@/components/ui/expandable-text";
import { NavTabs } from "@/components/ui/nav-tabs";
import { MediaSidebar } from "@/components/media/media-sidebar";
import { getMediaPage } from "@/lib/queries/media-page";
import { tmdbImage } from "@/lib/media";

export async function generateMetadata({ params }: LayoutProps<"/[type]/[id]">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) return {};
  const { details } = data;
  const title = details.year ? `${details.title} (${details.year})` : details.title;
  const image = tmdbImage(details.backdropPath, "w1280") ?? tmdbImage(details.posterPath, "w500");
  return {
    title: { default: title, template: "%s · tvlist" },
    description: details.overview.slice(0, 200) || undefined,
    openGraph: { title, description: details.overview.slice(0, 200), images: image ? [image] : undefined },
  };
}

export default async function MediaLayout({ params, children }: LayoutProps<"/[type]/[id]">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const { details, viewer, entry, favourite, scoreFormat } = data;
  const base = `/${type}/${id}`;
  const banner = tmdbImage(details.backdropPath, "original");
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
    { href: `${base}/cast`, label: "Cast" },
    { href: `${base}/crew`, label: "Crew" },
    { href: `${base}/stats`, label: "Stats" },
    { href: `${base}/social`, label: "Social" },
    { href: `${base}/reviews`, label: "Reviews" },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="relative h-[200px] bg-nav md:h-[400px]">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(0_0_0/0.6)] via-transparent to-[rgb(0_0_0/0.25)]" />
      </div>

      {/* Header */}
      <div className="bg-fg">
        <div className="container-page grid grid-cols-[110px_1fr] gap-x-5 md:grid-cols-[215px_1fr] md:gap-x-8">
          <div className="relative z-10 -mt-[70px] md:-mt-[125px]">
            <Cover
              path={details.posterPath}
              alt={details.title}
              size="w500"
              priority
              className="cover-ratio w-full rounded shadow-[0_0_29px_rgb(49_54_68/0.25)]"
            />
            <div className="mt-4 mb-5 hidden space-y-3 md:block">
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
          <div className="min-w-0 py-4 md:py-6">
            <h1 className="text-[18px] leading-tight font-bold text-bright md:text-[22px]">{details.title}</h1>
            {details.tagline && <p className="mt-1 text-[13px] text-text-lighter italic">{details.tagline}</p>}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold text-text-lighter md:hidden">
              <span>{details.format}</span>
              {details.year && <span>{details.year}</span>}
              {details.certification && <span>{details.certification}</span>}
            </div>
            {details.overview && <ExpandableText text={details.overview} className="mt-3 hidden text-text md:mt-4 md:block" />}
          </div>
          <div className="col-span-2 pt-2 pb-4 md:hidden">
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
            <div className="mt-3">
              <MediaActions media={actionMedia} loggedIn={Boolean(viewer)} />
            </div>
            {details.overview && <ExpandableText text={details.overview} className="mt-4" lines={5} />}
          </div>
        </div>
        <div className="container-page">
          <NavTabs tabs={tabs} className="-mb-px justify-start md:justify-center md:pl-[247px]" />
        </div>
      </div>

      {/* Body */}
      <div className="container-page grid gap-8 py-8 md:grid-cols-[215px_1fr] md:gap-10">
        <MediaSidebar data={data} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
