import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, ilike, isNotNull, or } from "drizzle-orm";
import {
  BookOpen,
  BookText,
  Film,
  Gamepad2,
  Music,
  Sparkles,
  TrendingUp,
  Tv,
  User,
  Users,
} from "lucide-react";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { UniversalSearchBar, type CategoryTab } from "@/components/media/universal-search-bar";
import { Avatar } from "@/components/ui/avatar";
import { PersonImage } from "@/components/ui/cover";
import { Empty, Page, Pagination, SectionHeader } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { getStatusesFor } from "@/lib/queries/media";
import { discover, searchPeople, searchTmdbAnime } from "@/lib/tmdb";
import { searchAnime, searchManga } from "@/lib/anilist";
import { searchBooks } from "@/lib/books";
import { searchMusic } from "@/lib/music";
import { searchGames } from "@/lib/games";
import type { MediaSummary, Paged } from "@/lib/media";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v || undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = str(sp.q);
  return {
    title: q ? `Search: “${q}” · Omnilist` : "Search Everything · Omnilist",
    description: "Search across movies, TV shows, anime, manga, books, music and video games in one universal search.",
  };
}

export default async function UniversalSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = str(sp.q)?.trim() || "";
  const category = str(sp.category)?.toLowerCase() || "all";
  const page = Math.max(1, Math.min(500, Number(str(sp.page)) || 1));
  const viewer = await getViewer();

  // 1. When no query is entered, show discovery and explore shortcuts
  if (!q) {
    const exploreCategories = [
      { key: "movie", label: "Movies", href: "/search/movie", desc: "Trending, top 100, upcoming in theaters", icon: Film, color: "#a06bf0" },
      { key: "tv", label: "TV Shows", href: "/search/tv", desc: "Airing this week, returning series, top 100", icon: Tv, color: "#2fbf8a" },
      { key: "anime", label: "Anime", href: "/search/anime", desc: "Seasonal airings, movies, top rated anime", icon: Sparkles, color: "#ec6fb0" },
      { key: "manga", label: "Manga", href: "/search/manga", desc: "Manga, manhwa, light novels and webtoons", icon: BookOpen, color: "#f97316" },
      { key: "book", label: "Books", href: "/search/book", desc: "Fiction, classics, fantasy and thrillers", icon: BookText, color: "#0ea5e9" },
      { key: "music", label: "Music & Albums", href: "/search/music", desc: "Top albums, discographies, 30s audio previews", icon: Music, color: "#a855f7" },
      { key: "game", label: "Video Games", href: "/search/game", desc: "900k+ PC and console titles, top rated, new", icon: Gamepad2, color: "#e08a1e" },
    ];

    return (
      <Page>
        <div className="mx-auto max-w-4xl space-y-10 py-6">
          <div className="text-center">
            <h1 className="text-[28px] font-extrabold text-white md:text-[36px]">Universal Search</h1>
            <p className="mt-2 text-[14px] text-text-light md:text-[16px]">
              Search movies, TV shows, anime, manga, books, music and video games in one place.
            </p>
          </div>

          <Suspense>
            <UniversalSearchBar
              initialQuery=""
              activeCategory="all"
              categories={[
                { key: "all", label: "All Categories" },
                { key: "movie", label: "Movies" },
                { key: "tv", label: "TV Shows" },
                { key: "anime", label: "Anime" },
                { key: "manga", label: "Manga" },
                { key: "book", label: "Books" },
                { key: "music", label: "Music" },
                { key: "game", label: "Games" },
              ]}
            />
          </Suspense>

          <div>
            <SectionHeader title="Explore by Category" />
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {exploreCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.key}
                    href={cat.href}
                    className="card group flex items-start gap-3.5 p-4 transition hover:border-accent"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: cat.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-bright transition group-hover:text-accent">
                        {cat.label}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-text-lighter leading-snug">{cat.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // 2. Query provided: execute multi-category search
  const isAll = category === "all";
  const limitPerSec = isAll ? 6 : 20;

  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const [movies, tv, anime, manga, books, music, games, people, users] = await Promise.all([
    isAll || category === "movie"
      ? discover("movie", { query: q }, isAll ? 1 : page).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "tv"
      ? discover("tv", { query: q }, isAll ? 1 : page).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "anime"
      ? searchAnime(q, {}, isAll ? 1 : page, limitPerSec)
          .catch(() => searchTmdbAnime(q, isAll ? 1 : page))
          .then((res) => (res.results.length === 0 ? searchTmdbAnime(q, isAll ? 1 : page) : res))
          .catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "manga"
      ? searchManga(q, {}, isAll ? 1 : page, limitPerSec).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "book"
      ? searchBooks(q, isAll ? 1 : page).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "music"
      ? searchMusic(q, isAll ? 1 : page).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "game"
      ? searchGames(q, isAll ? 1 : page).catch(() => emptyPaged())
      : Promise.resolve(emptyPaged()),
    isAll || category === "people"
      ? searchPeople(q, isAll ? 1 : page).catch(() => ({ page: 1, totalPages: 1, totalResults: 0, results: [] }))
      : Promise.resolve({ page: 1, totalPages: 1, totalResults: 0, results: [] }),
    isAll || category === "users"
      ? db
          .select({
            id: schema.user.id,
            username: schema.user.username,
            name: schema.user.displayUsername,
            image: schema.user.image,
            about: schema.user.about,
          })
          .from(schema.user)
          .where(
            and(
              isNotNull(schema.user.username),
              or(ilike(schema.user.username, `%${escaped}%`), ilike(schema.user.displayUsername, `%${escaped}%`)),
            ),
          )
          .limit(isAll ? 6 : 24)
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const allVisibleMedia = [
    ...movies.results.slice(0, limitPerSec),
    ...tv.results.slice(0, limitPerSec),
    ...anime.results.slice(0, limitPerSec),
    ...manga.results.slice(0, limitPerSec),
    ...books.results.slice(0, limitPerSec),
    ...music.results.slice(0, limitPerSec),
    ...games.results.slice(0, limitPerSec),
  ];
  const statuses = await getStatusesFor(viewer?.id, allVisibleMedia);

  const totalHits =
    movies.totalResults +
    tv.totalResults +
    anime.totalResults +
    manga.totalResults +
    books.totalResults +
    music.totalResults +
    games.totalResults +
    people.totalResults +
    users.length;

  const categories: CategoryTab[] = [
    { key: "all", label: "All Results", count: totalHits },
    { key: "movie", label: "Movies", count: movies.totalResults },
    { key: "tv", label: "TV Shows", count: tv.totalResults },
    { key: "anime", label: "Anime", count: anime.totalResults },
    { key: "manga", label: "Manga", count: manga.totalResults },
    { key: "book", label: "Books", count: books.totalResults },
    { key: "music", label: "Music", count: music.totalResults },
    { key: "game", label: "Games", count: games.totalResults },
    { key: "people", label: "People", count: people.totalResults },
    { key: "users", label: "Users", count: users.length },
  ];

  return (
    <Page>
      <div className="space-y-8">
        <div>
          <h1 className="sr-only">Universal Search: {q}</h1>
          <Suspense>
            <UniversalSearchBar
              initialQuery={q}
              activeCategory={category}
              categories={categories}
            />
          </Suspense>
        </div>

        {totalHits === 0 ? (
          <Empty>
            No results found for &ldquo;{q}&rdquo;. Check your spelling or try searching with different keywords.
          </Empty>
        ) : isAll ? (
          /* Multi-category combined view */
          <div className="space-y-12">
            {movies.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Movies (${movies.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=movie`}
                  linkLabel={movies.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {movies.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {tv.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`TV Shows (${tv.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=tv`}
                  linkLabel={tv.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {tv.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {anime.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Anime (${anime.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=anime`}
                  linkLabel={anime.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {anime.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {manga.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Manga (${manga.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=manga`}
                  linkLabel={manga.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {manga.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {books.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Books (${books.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=book`}
                  linkLabel={books.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {books.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {music.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Music & Albums (${music.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=music`}
                  linkLabel={music.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {music.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {games.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`Video Games (${games.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=game`}
                  linkLabel={games.totalResults > 6 ? "View All" : undefined}
                />
                <MediaGrid>
                  {games.results.slice(0, 6).map((m, i) => (
                    <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                      <MediaCard media={m} listStatus={statuses[`${m.type}:${m.id}`]} />
                    </div>
                  ))}
                </MediaGrid>
              </section>
            )}

            {people.results.length > 0 && (
              <section>
                <SectionHeader
                  title={`People (${people.totalResults})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=people`}
                  linkLabel={people.totalResults > 6 ? "View All" : undefined}
                />
                <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
                  {people.results.slice(0, 6).map((p) => (
                    <Link key={p.id} href={`/person/${p.id}`} className="group">
                      <PersonImage
                        path={p.profilePath}
                        alt={p.name}
                        className="cover-ratio w-full rounded-md shadow-[var(--shadow-card)]"
                      />
                      <p className="mt-2 truncate text-[13px] font-semibold text-bright transition group-hover:text-accent">
                        {p.name}
                      </p>
                      <p className="truncate text-[11px] text-text-lighter">{p.department}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {users.length > 0 && (
              <section>
                <SectionHeader
                  title={`Community Members (${users.length})`}
                  href={`/search?q=${encodeURIComponent(q)}&category=users`}
                />
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {users.slice(0, 6).map((u) => (
                    <Link
                      key={u.id}
                      href={`/user/${u.username}`}
                      className="card group flex items-center gap-3.5 p-3.5 transition hover:border-accent"
                    >
                      <Avatar src={u.image} name={u.name || u.username!} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-bright transition group-hover:text-accent">
                          {u.name || u.username}
                        </p>
                        <p className="truncate text-[12px] text-text-lighter font-medium">@{u.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Single category filtered view with pagination */
          <div className="space-y-8">
            {renderCategorySection(category, {
              q,
              page,
              movies,
              tv,
              anime,
              manga,
              books,
              music,
              games,
              people,
              users,
              statuses,
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

function emptyPaged(): Paged<MediaSummary> {
  return { page: 1, totalPages: 1, totalResults: 0, results: [] };
}

function renderCategorySection(
  category: string,
  ctx: {
    q: string;
    page: number;
    movies: Paged<MediaSummary>;
    tv: Paged<MediaSummary>;
    anime: Paged<MediaSummary>;
    manga: Paged<MediaSummary>;
    books: Paged<MediaSummary>;
    music: Paged<MediaSummary>;
    games: Paged<MediaSummary>;
    people: { page: number; totalPages: number; totalResults: number; results: { id: number; name: string; profilePath: string | null; department: string | null }[] };
    users: { id: string; username: string | null; name: string | null; image: string | null; about: string | null }[];
    statuses: Record<string, any>;
  },
) {
  const { q, page, statuses } = ctx;

  if (category === "people") {
    return (
      <div>
        <SectionHeader title={`People (${ctx.people.totalResults})`} />
        {ctx.people.results.length === 0 ? (
          <Empty>No people found matching &ldquo;{q}&rdquo;.</Empty>
        ) : (
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {ctx.people.results.map((p) => (
              <Link key={p.id} href={`/person/${p.id}`} className="group">
                <PersonImage
                  path={p.profilePath}
                  alt={p.name}
                  className="cover-ratio w-full rounded-md shadow-[var(--shadow-card)]"
                />
                <p className="mt-2 truncate text-[14px] font-semibold text-bright transition group-hover:text-accent">
                  {p.name}
                </p>
                <p className="truncate text-[12px] text-text-lighter">{p.department}</p>
              </Link>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={ctx.people.totalPages} basePath="/search" params={{ q, category }} />
      </div>
    );
  }

  if (category === "users") {
    return (
      <div>
        <SectionHeader title={`Community Members (${ctx.users.length})`} />
        {ctx.users.length === 0 ? (
          <Empty>No users found matching &ldquo;{q}&rdquo;.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {ctx.users.map((u) => (
              <Link
                key={u.id}
                href={`/user/${u.username}`}
                className="card group flex items-center gap-3.5 p-3.5 transition hover:border-accent"
              >
                <Avatar src={u.image} name={u.name || u.username!} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-bright transition group-hover:text-accent">
                    {u.name || u.username}
                  </p>
                  <p className="truncate text-[12px] text-text-lighter font-medium">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const pagedMap: Record<string, Paged<MediaSummary>> = {
    movie: ctx.movies,
    tv: ctx.tv,
    anime: ctx.anime,
    manga: ctx.manga,
    book: ctx.books,
    music: ctx.music,
    game: ctx.games,
  };

  const current = pagedMap[category] ?? emptyPaged();

  return (
    <div>
      <SectionHeader title={`Results (${current.totalResults})`} />
      {current.results.length === 0 ? (
        <Empty>No results found matching &ldquo;{q}&rdquo; in this category.</Empty>
      ) : (
        <MediaGrid>
          {current.results.map((m) => (
            <MediaCard
              key={`${m.type}-${m.id}`}
              media={m}
              listStatus={statuses[`${m.type}:${m.id}`]}
            />
          ))}
        </MediaGrid>
      )}
      <Pagination page={page} totalPages={current.totalPages} basePath="/search" params={{ q, category }} />
    </div>
  );
}
