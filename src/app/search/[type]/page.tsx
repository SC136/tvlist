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
import {
  discover,
  getCuratedList,
  getTrending,
  type BrowseFilters as Filters,
  type BrowseSort,
  type CuratedList,
} from "@/lib/tmdb";
import {
  getAiringAnime,
  getAnimeMovies,
  getLightNovels,
  getPopularAnime,
  getPopularManga,
  getTopManhwa,
  getTopRatedAnime,
  getTopRatedManga,
  getTrendingAnime,
  getTrendingManga,
  searchAnime,
  searchManga,
} from "@/lib/anilist";
import { getNewGames, getTopRatedGames, getTrendingGames, searchGames } from "@/lib/games";
import { getBooksBySubject, getTopRatedBooks, getTrendingBooks, searchBooks } from "@/lib/books";
import { getTopRatedMusic, getTrendingMusic, searchMusic } from "@/lib/music";
import {
  CATEGORY_LABEL,
  genreIdByName,
  isMediaCategory,
  type MediaCategory,
  type MediaSummary,
  type Paged,
} from "@/lib/media";

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: BrowseSort[] = ["popularity", "score", "newest", "oldest", "title", "votes", "revenue"];
const LISTS: Record<MediaCategory, { key: string; title: string }[]> = {
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
  anime: [
    { key: "trending", title: "Trending Anime" },
    { key: "airing", title: "Airing This Season" },
    { key: "top_rated", title: "Top 100 Anime" },
    { key: "movies", title: "Popular Anime Movies" },
    { key: "popular", title: "All-Time Popular" },
  ],
  manga: [
    { key: "trending", title: "Trending Manga" },
    { key: "popular", title: "All-Time Popular" },
    { key: "top_rated", title: "Top 100 Manga" },
    { key: "manhwa", title: "Popular Manhwa" },
    { key: "novels", title: "Light Novels" },
  ],
  book: [
    { key: "trending", title: "Trending Books" },
    { key: "classics", title: "Classic Literature" },
    { key: "fantasy", title: "Fantasy & Sci-Fi" },
    { key: "thriller", title: "Mystery & Thrillers" },
    { key: "romance", title: "Romance" },
  ],
  music: [
    { key: "trending", title: "Top Albums" },
    { key: "classics", title: "Greatest Hits & Classics" },
    { key: "rock", title: "Rock & Alternative" },
    { key: "pop", title: "Pop & Dance" },
    { key: "hiphop", title: "Hip-Hop & R&B" },
  ],
  game: [
    { key: "trending", title: "Popular Games" },
    { key: "top_rated", title: "Top Rated of All Time" },
    { key: "new", title: "Recent Releases" },
  ],
};

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v || undefined;
}

export async function generateMetadata({ params }: PageProps<"/search/[type]">): Promise<Metadata> {
  const { type } = await params;
  if (type === "people") return { title: "Browse People" };
  if (!isMediaCategory(type)) return {};
  return { title: `Browse ${CATEGORY_LABEL[type].many}` };
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
  if (!isMediaCategory(type)) notFound();

  const page = Math.max(1, Math.min(500, Number(str(sp.page)) || 1));
  const list = str(sp.list);
  const sort = str(sp.sort) as BrowseSort | undefined;
  const filters: Filters = {
    query: str(sp.search)?.slice(0, 100),
    genres: str(sp.genres)
      ?.split(",")
      .map((g) => genreIdByName(type === "movie" ? "movie" : "tv", g))
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
      Browse {CATEGORY_LABEL[type].many}
    </h1>
  );

  // Landing: curated sections.
  if (!filtered && !list) {
    const sections = await Promise.all(
      LISTS[type].map(async (s) => ({
        ...s,
        data:
          type === "anime"
            ? s.key === "airing"
              ? await getAiringAnime()
              : s.key === "top_rated"
                ? await getTopRatedAnime()
                : s.key === "movies"
                  ? await getAnimeMovies()
                  : s.key === "popular"
                    ? await getPopularAnime()
                    : await getTrendingAnime()
            : type === "manga"
              ? s.key === "popular"
                ? await getPopularManga()
                : s.key === "top_rated"
                  ? await getTopRatedManga()
                  : s.key === "manhwa"
                    ? await getTopManhwa()
                    : s.key === "novels"
                      ? await getLightNovels()
                      : await getTrendingManga()
            : type === "book"
              ? s.key === "classics"
                ? await getBooksBySubject("classics")
                : s.key === "fantasy"
                  ? await getBooksBySubject("fantasy")
                  : s.key === "thriller"
                    ? await getBooksBySubject("thriller")
                    : s.key === "romance"
                      ? await getBooksBySubject("romance")
                      : await getTrendingBooks()
            : type === "music"
              ? s.key === "classics"
                ? await getTopRatedMusic()
                : s.key === "rock"
                  ? await searchMusic("rock")
                  : s.key === "pop"
                    ? await searchMusic("pop")
                    : s.key === "hiphop"
                      ? await searchMusic("hip hop")
                      : await getTrendingMusic()
            : type === "game"
              ? s.key === "top_rated"
                ? await getTopRatedGames()
                : s.key === "new"
                  ? await getNewGames()
                  : await getTrendingGames()
              : s.key === "trending"
                ? await getTrending(type, "week")
                : await getCuratedList(type, s.key as CuratedList),
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
  if (type === "game") {
    if (filters.query) {
      data = await searchGames(filters.query, page);
    } else if (list === "top_rated") {
      data = await getTopRatedGames(page);
    } else if (list === "new") {
      data = await getNewGames(page);
    } else {
      data = await getTrendingGames(page);
    }
  } else if (type === "book") {
    if (filters.query) {
      data = await searchBooks(filters.query, page);
    } else if (list === "classics") {
      data = await getBooksBySubject("classics", page);
    } else if (list === "fantasy") {
      data = await getBooksBySubject("fantasy", page);
    } else if (list === "thriller") {
      data = await getBooksBySubject("thriller", page);
    } else if (list === "romance") {
      data = await getBooksBySubject("romance", page);
    } else {
      data = await getTrendingBooks(page);
    }
  } else if (type === "music") {
    if (filters.query) {
      data = await searchMusic(filters.query, page);
    } else if (list === "classics") {
      data = await getTopRatedMusic(page);
    } else if (list === "rock") {
      data = await searchMusic("rock", page);
    } else if (list === "pop") {
      data = await searchMusic("pop", page);
    } else if (list === "hiphop") {
      data = await searchMusic("hip hop", page);
    } else {
      data = await getTrendingMusic(page);
    }
  } else if (type === "anime") {
    if (filtered) {
      data = await searchAnime(
        filters.query,
        {
          genre: str(sp.genres)?.split(",")[0],
          year: filters.year,
          sort: filters.sort,
          status: str(sp.status),
        },
        page,
      );
    } else if (list === "airing") {
      data = await getAiringAnime(page);
    } else if (list === "top_rated") {
      data = await getTopRatedAnime(page);
    } else if (list === "movies") {
      data = await getAnimeMovies(page);
    } else if (list === "popular") {
      data = await getPopularAnime(page);
    } else {
      data = await getTrendingAnime(page);
    }
  } else if (type === "manga") {
    if (filtered) {
      data = await searchManga(
        filters.query,
        {
          genre: str(sp.genres)?.split(",")[0],
          year: filters.year,
          sort: filters.sort,
          format: str(sp.format),
          status: str(sp.status),
          country: str(sp.country),
        },
        page,
      );
    } else if (list === "popular") {
      data = await getPopularManga(page);
    } else if (list === "top_rated") {
      data = await getTopRatedManga(page);
    } else if (list === "manhwa") {
      data = await getTopManhwa(page);
    } else if (list === "novels") {
      data = await getLightNovels(page);
    } else {
      data = await getTrendingManga(page);
    }
  } else if (list && !filtered) {
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
