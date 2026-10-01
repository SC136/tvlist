import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrowseFilters } from "@/components/media/browse-filters";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { MediaRow } from "@/components/media/media-row";
import { PeopleBrowse } from "@/components/media/people-browse";
import { Empty, Page, Pagination, SectionHeader } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { getStatusesFor } from "@/lib/queries/media";
import { discover, getCuratedList, getTrending, type BrowseFilters as Filters, type BrowseSort, type CuratedList } from "@/lib/tmdb";
import { genreIdByName, isMediaType, MEDIA_LABEL, type MediaSummary, type MediaType, type Paged } from "@/lib/media";

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: BrowseSort[] = ["popularity", "score", "newest", "oldest", "title", "votes", "revenue"];
const LISTS: Record<MediaType, { key: CuratedList | "trending"; title: string }[]> = {
  movie: [
    { key: "trending", title: "Trending Now" },
    { key: "now_playing", title: "Now in Theaters" },
    { key: "upcoming", title: "Upcoming" },
    { key: "popular", title: "Popular" },
    { key: "top_rated", title: "Top 100" },
  ],
  tv: [
    { key: "trending", title: "Trending Now" },
    { key: "on_the_air", title: "Airing This Week" },
    { key: "airing_today", title: "Airing Today" },
    { key: "popular", title: "Popular" },
    { key: "top_rated", title: "Top 100" },
  ],
};

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v || undefined;
}

export async function generateMetadata({ params }: PageProps<"/search/[type]">): Promise<Metadata> {
  const { type } = await params;
  if (type === "people") return { title: "Browse People" };
  if (!isMediaType(type)) return {};
  return { title: `Browse ${MEDIA_LABEL[type].many}` };
}

export default async function BrowsePage({ params, searchParams }: PageProps<"/search/[type]">) {
  const { type } = await params;
  const sp = (await searchParams) as SearchParams;

  if (type === "people") {
    return (
      <Page>
        <PeopleBrowse search={str(sp.search)} page={Number(str(sp.page)) || 1} />
      </Page>
    );
  }
  if (!isMediaType(type)) notFound();

  const page = Math.max(1, Math.min(500, Number(str(sp.page)) || 1));
  const list = str(sp.list);
  const sort = str(sp.sort) as BrowseSort | undefined;
  const filters: Filters = {
    query: str(sp.search)?.slice(0, 100),
    genres: str(sp.genres)
      ?.split(",")
      .map((g) => genreIdByName(type, g))
      .filter((g): g is number => g !== undefined),
    year: Number(str(sp.year)) || undefined,
    tvType: str(sp.format) !== undefined ? Number(str(sp.format)) : undefined,
    tvStatus: str(sp.status) !== undefined ? Number(str(sp.status)) : undefined,
    country: str(sp.country)?.slice(0, 2),
    language: str(sp.language)?.slice(0, 3),
    provider: Number(str(sp.provider)) || undefined,
    sort: sort && SORTS.includes(sort) ? sort : undefined,
  };
  const filtered = Boolean(
    filters.query || filters.genres?.length || filters.year || filters.tvType !== undefined || filters.tvStatus !== undefined || filters.country || filters.language || filters.provider || filters.sort,
  );
  const view = str(sp.view) === "list" ? "list" : "grid";
  const viewer = await getViewer();

  const heading = (
    <h1 className="sr-only">
      Browse {MEDIA_LABEL[type].many}
    </h1>
  );

  // Landing: curated sections.
  if (!filtered && !list) {
    const sections = await Promise.all(
      LISTS[type].map(async (s) => ({
        ...s,
        data: s.key === "trending" ? await getTrending(type, "week") : await getCuratedList(type, s.key),
      })),
    );
    const statuses = await getStatusesFor(
      viewer?.id,
      sections.flatMap((s) => s.data.results.slice(0, 10)),
    );
    return (
      <Page>
        {heading}
        <Suspense>
          <BrowseFilters type={type} />
        </Suspense>
        <div className="space-y-12">
          {sections.map((s) =>
            s.key === "top_rated" ? (
              <section key={s.key}>
                <SectionHeader title={s.title} href={`/search/${type}?list=${s.key}&view=list`} />
                <div className="space-y-4">
                  {s.data.results.slice(0, 10).map((m, i) => (
                    <MediaRow key={m.id} media={m} rank={i + 1} />
                  ))}
                </div>
              </section>
            ) : (
              <section key={s.key}>
                <SectionHeader title={s.title} href={`/search/${type}?list=${s.key}`} />
                <MediaGrid>
                  {s.data.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            ),
          )}
        </div>
      </Page>
    );
  }

  let data: Paged<MediaSummary>;
  let title: string | null = null;
  if (list && !filtered) {
    const entry = LISTS[type].find((l) => l.key === list);
    if (!entry) notFound();
    title = entry.title;
    data = list === "trending" ? await getTrending(type, "week", page) : await getCuratedList(type, list as CuratedList, page);
  } else {
    data = await discover(type, filters, page);
  }
  const statuses = await getStatusesFor(viewer?.id, data.results);
  const ranked = list === "top_rated";
  const passthrough = Object.fromEntries(
    Object.entries(sp)
      .filter(([k]) => k !== "page")
      .map(([k, v]) => [k, str(v)]),
  );

  return (
    <Page>
      {heading}
      <Suspense>
        <BrowseFilters type={type} />
      </Suspense>
      {title && <SectionHeader title={title} />}
      {data.results.length === 0 ? (
        <Empty>No results found. Try different filters.</Empty>
      ) : view === "list" ? (
        <div className="space-y-4">
          {data.results.map((m, i) => (
            <MediaRow key={`${m.type}-${m.id}`} media={m} rank={ranked ? (page - 1) * 20 + i + 1 : undefined} />
          ))}
        </div>
      ) : (
        <MediaGrid>
          {data.results.map((m, i) => (
            <MediaCard
              key={`${m.type}-${m.id}`}
              media={m}
              listStatus={statuses[`${m.type}:${m.id}`]}
              rank={ranked ? (page - 1) * 20 + i + 1 : undefined}
              priority={i < 6}
            />
          ))}
        </MediaGrid>
      )}
      <Pagination page={page} totalPages={data.totalPages} basePath={`/search/${type}`} params={passthrough} />
    </Page>
  );
}
