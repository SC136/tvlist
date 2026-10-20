import Link from "next/link";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { BarChart3, ListChecks, MessagesSquare, NotebookPen, Sparkles, Users } from "lucide-react";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { MediaRow } from "@/components/media/media-row";
import { InProgress } from "@/components/list/in-progress";
import { ActivityFeed } from "@/components/social/activity-feed";
import { Cover } from "@/components/ui/cover";
import { Page, SectionHeader, TimeAgo } from "@/components/ui/basics";
import { getViewer, toFeedViewer, type Viewer } from "@/lib/session";
import { getActivities } from "@/lib/queries/activity";
import { getStatusesFor } from "@/lib/queries/media";
import { listReviews } from "@/lib/queries/reviews";
import { getCuratedList, getTrending } from "@/lib/tmdb";
import { getTrendingAnime, getTrendingManga } from "@/lib/anilist";
import { getTrendingGames } from "@/lib/games";
import { getTrendingBooks } from "@/lib/books";
import { getTrendingMusic } from "@/lib/music";
import { isAnimeMedia } from "@/lib/media";
import { airingIn, STATUS_COLORS } from "@/lib/format";
import { cn } from "@/lib/cn";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await getViewer();
  const sp = await searchParams;
  if (viewer) return <Dashboard viewer={viewer} feed={sp.feed === "global" ? "global" : "following"} filter={sp.filter === "text" ? "text" : sp.filter === "list" ? "list" : "all"} welcome={sp.welcome === "1"} />;
  return <Landing />;
}

/* --------------------------------------------------------------------------- */

async function Landing() {
  const [movies, tv, anime, manga, books, music, games, top] = await Promise.all([
    getTrending("movie"),
    getTrending("tv"),
    getTrendingAnime(),
    getTrendingManga(),
    getTrendingBooks(),
    getTrendingMusic(),
    getTrendingGames(),
    getCuratedList("movie", "top_rated"),
  ]);
  const features = [
    { icon: ListChecks, title: "Track everything", text: "Keep every movie, show, anime, manga, book, album and game you watch, read, play or listen to in one list." },
    { icon: NotebookPen, title: "Keep a diary", text: "Log each viewing, reading or listening session with dates, ratings and notes, then look back on your year." },
    { icon: BarChart3, title: "See your stats", text: "Hours watched and listened, pages read, games played, favourite genres, creators and score distributions." },
    { icon: Users, title: "Follow friends", text: "See what your friends are watching, reading and playing, like and reply to their activity, and share lists." },
    { icon: MessagesSquare, title: "Review & discuss", text: "Write reviews, rate others' as helpful, and join forum threads for every title." },
    { icon: Sparkles, title: "Discover", text: "Browse trending, airing and top-rated titles across movies, TV, anime, manga, books, music and video games." },
  ];
  const hero = movies.results.find((m) => m.backdropPath);

  return (
    <div>
      <section className="relative overflow-hidden bg-nav pt-[60px] md:pt-[68px]">
        {hero?.backdropPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://image.tmdb.org/t/p/w1280${hero.backdropPath}`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-nav/40 via-nav/80 to-nav" />
        <div className="container-page relative py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-4xl text-[32px] leading-tight font-extrabold text-white md:text-[48px]">
            The social tracker for <span className="text-accent">movies</span>, <span className="text-accent">TV</span>, <span className="text-accent">anime</span>, <span className="text-accent">manga</span>, <span className="text-accent">books</span>, <span className="text-accent">music</span> &amp; <span className="text-accent">games</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-nav-text md:text-[17px]">
            Track what you watch, read, play and listen to, log a diary, rate and review, build lists, see your stats, and discover what to experience next with friends.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className="btn btn-primary px-7 py-3 text-[15px]">
              Join Now
            </Link>
            <Link href="/search/movie" className="btn bg-white/10 px-7 py-3 text-[15px] text-white hover:bg-white/20">
              Explore
            </Link>
          </div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-md bg-white/5 p-5 backdrop-blur">
                <f.icon className="h-6 w-6 text-accent" />
                <p className="mt-3 text-[15px] font-bold text-white">{f.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-nav-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-12">
        <section>
          <SectionHeader title="Trending Movies" href="/search/movie?list=trending" />
          <MediaGrid>
            {movies.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Trending TV" href="/search/tv?list=trending" />
          <MediaGrid>
            {tv.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Trending Anime" href="/search/anime?list=trending" />
          <MediaGrid>
            {anime.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Trending Manga" href="/search/manga?list=trending" />
          <MediaGrid>
            {manga.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Trending Books" href="/search/book?list=trending" />
          <MediaGrid>
            {books.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Top Albums" href="/search/music?list=trending" />
          <MediaGrid>
            {music.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Popular Games" href="/search/game" />
          <MediaGrid>
            {games.results.slice(0, 6).map((m, i) => (
              <div key={m.id} className={i >= 3 ? "hidden sm:block" : undefined}>
                <MediaCard media={m} />
              </div>
            ))}
          </MediaGrid>
        </section>
        <section>
          <SectionHeader title="Top 10 Movies" href="/search/movie?list=top_rated&view=list" />
          <div className="space-y-4">
            {top.results.slice(0, 10).map((m, i) => (
              <MediaRow key={m.id} media={m} rank={i + 1} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */

async function Dashboard({
  viewer,
  feed,
  filter,
  welcome,
}: {
  viewer: Viewer;
  feed: "following" | "global";
  filter: "all" | "text" | "list";
  welcome: boolean;
}) {
  const [inProgress, activities, trendingMovies, trendingTv, reviews, threads] = await Promise.all([
    db
      .select({ entry: schema.listEntry, media: schema.media })
      .from(schema.listEntry)
      .innerJoin(schema.media, eq(schema.media.id, schema.listEntry.mediaId))
      .where(and(eq(schema.listEntry.userId, viewer.id), inArray(schema.listEntry.status, ["CURRENT", "REPEATING"])))
      .orderBy(desc(schema.listEntry.updatedAt))
      .limit(30),
    getActivities({ kind: "home", mode: feed, filter }, viewer.id),
    getTrending("movie", "day"),
    getTrending("tv", "day"),
    listReviews({ limit: 4 }),
    db.query.forumThread.findMany({
      orderBy: desc(schema.forumThread.lastReplyAt),
      where: isNotNull(schema.forumThread.lastReplyAt),
      limit: 5,
      with: { lastReplyUser: { columns: { username: true, displayUsername: true } } },
    }),
  ]);

  const shows = inProgress.filter((r) => r.media.type === "tv" && !isAnimeMedia(r.media));
  const anime = inProgress.filter((r) => r.media.type === "anime" || (r.media.type === "tv" && isAnimeMedia(r.media)));
  const manga = inProgress.filter((r) => r.media.type === "manga");
  const books = inProgress.filter((r) => r.media.type === "book");
  const music = inProgress.filter((r) => r.media.type === "music");
  const games = inProgress.filter((r) => r.media.type === "game");
  const movies = inProgress.filter((r) => r.media.type === "movie" && !isAnimeMedia(r.media));
  const airing = shows
    .filter((r) => r.media.nextEpisodeAirDate && airingIn(r.media.nextEpisodeAirDate))
    .sort((a, b) => (a.media.nextEpisodeAirDate ?? "").localeCompare(b.media.nextEpisodeAirDate ?? ""));
  const trending = [...trendingMovies.results.slice(0, 5), ...trendingTv.results.slice(0, 5)].sort((a, b) => b.popularity - a.popularity);
  const statuses = await getStatusesFor(viewer.id, trending);
  const toItem = (r: (typeof inProgress)[number]) => ({
    type: r.media.type,
    tmdbId: r.media.tmdbId,
    title: r.media.title,
    posterPath: r.media.posterPath,
    progress: r.entry.progress,
    episodes: r.media.type === "movie" ? 1 : r.media.episodes,
    nextAirDate: r.media.nextEpisodeAirDate,
    nextEpisode: r.media.nextEpisodeNumber,
  });

  const feedHref = (f: string, t: string) => {
    const q = new URLSearchParams();
    if (f !== "following") q.set("feed", f);
    if (t !== "all") q.set("filter", t);
    return q.size ? `/?${q}` : "/";
  };

  return (
    <Page>
      {welcome && (
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-accent p-5">
          <div>
            <p className="text-[16px] font-bold text-bright">Welcome to Omnilist, {viewer.displayUsername || viewer.username}! 🎬</p>
            <p className="mt-1 text-[13px] text-text-light">Start by adding a few movies and shows you love, then customise your profile.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/search/movie" className="btn btn-primary">
              Browse Movies
            </Link>
            <Link href="/settings" className="btn btn-secondary">
              Settings
            </Link>
          </div>
        </div>
      )}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-10">
          {shows.length > 0 && (
            <section>
              <SectionHeader title="TV In Progress" href={`/user/${viewer.username}/tvlist`} />
              <InProgress items={shows.map(toItem)} />
            </section>
          )}
          {anime.length > 0 && (
            <section>
              <SectionHeader title="Anime In Progress" href={`/user/${viewer.username}/animelist`} />
              <InProgress items={anime.map(toItem)} />
            </section>
          )}
          {manga.length > 0 && (
            <section>
              <SectionHeader title="Manga Reading" href={`/user/${viewer.username}/mangalist`} />
              <InProgress items={manga.map(toItem)} />
            </section>
          )}
          {books.length > 0 && (
            <section>
              <SectionHeader title="Books Reading" href={`/user/${viewer.username}/booklist`} />
              <InProgress items={books.map(toItem)} />
            </section>
          )}
          {music.length > 0 && (
            <section>
              <SectionHeader title="Music Listening" href={`/user/${viewer.username}/musiclist`} />
              <InProgress items={music.map(toItem)} />
            </section>
          )}
          {games.length > 0 && (
            <section>
              <SectionHeader title="Games Playing" href={`/user/${viewer.username}/gamelist`} />
              <InProgress items={games.map(toItem)} />
            </section>
          )}
          {movies.length > 0 && (
            <section>
              <SectionHeader title="Movies In Progress" href={`/user/${viewer.username}/movielist`} />
              <InProgress items={movies.map(toItem)} />
            </section>
          )}
          {!inProgress.length && (
            <section className="card p-6 text-center">
              <p className="text-[14px] font-semibold text-bright">Nothing in progress.</p>
              <p className="mt-1 text-[13px] text-text-lighter">Set a show to “Watching” and it will appear here with quick +1 episode buttons.</p>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-wide text-bright uppercase md:text-[16px]">Activity</h2>
              <div className="flex items-center gap-3 text-[12px] font-semibold">
                <div className="flex gap-1">
                  {(["all", "text", "list"] as const).map((t) => (
                    <Link key={t} href={feedHref(feed, t)} scroll={false} className={cn("rounded px-2 py-1", filter === t ? "text-accent" : "text-text-lighter hover:text-accent")}>
                      {t === "all" ? "All" : t === "text" ? "Status" : "List"}
                    </Link>
                  ))}
                </div>
                <div className="flex overflow-hidden rounded bg-fg shadow-[var(--shadow-card)]">
                  {(["following", "global"] as const).map((f) => (
                    <Link key={f} href={feedHref(f, filter)} scroll={false} className={cn("px-3 py-1 capitalize", feed === f ? "bg-accent text-on-accent" : "hover:text-accent")}>
                      {f}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <ActivityFeed
              key={`${feed}-${filter}`}
              initial={activities}
              scope={{ kind: "home", mode: feed, filter }}
              viewer={toFeedViewer(viewer)}
              composer={{ kind: "status" }}
              emptyText={feed === "following" ? "Follow people to see their activity here, or switch to Global." : "No activity yet."}
            />
          </section>
        </div>

        <aside className="space-y-8">
          {airing.length > 0 && (
            <section>
              <SectionHeader title="Airing Soon" href="/airing" />
              <div className="card divide-y divide-fg-grey-dark">
                {airing.slice(0, 6).map((r) => (
                  <Link key={r.media.id} href={`/tv/${r.media.tmdbId}`} className="flex items-center gap-3 p-2.5 transition hover:bg-fg-grey">
                    <Cover path={r.media.posterPath} alt="" size="w92" className="h-[54px] w-[38px] shrink-0 rounded-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-bright">{r.media.title}</p>
                      <p className="text-[12px] text-text-lighter">
                        Ep {r.media.nextEpisodeNumber} · <span className="font-semibold text-accent">{airingIn(r.media.nextEpisodeAirDate)}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="Trending Today" href="/search/movie?list=trending" />
            <div className="grid grid-cols-5 gap-2">
              {trending.slice(0, 10).map((m) => {
                const status = statuses[`${m.type}:${m.id}`];
                return (
                  <Link key={`${m.type}-${m.id}`} href={`/${m.type}/${m.id}`} title={m.title} className="relative block overflow-hidden rounded-sm shadow-[var(--shadow-card)]">
                    <Cover path={m.posterPath} alt={m.title} size="w154" className="cover-ratio w-full transition hover:opacity-80" />
                    {status && <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />}
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="Recent Reviews" href="/reviews" />
            {reviews.length === 0 ? (
              <p className="card p-4 text-[13px] text-text-lighter">No reviews yet.</p>
            ) : (
              <div className="card divide-y divide-fg-grey-dark">
                {reviews.map((r) => (
                  <Link key={r.id} href={`/review/${r.id}`} className="flex gap-3 p-2.5 transition hover:bg-fg-grey">
                    <Cover path={r.media.posterPath} alt="" size="w92" className="h-[54px] w-[38px] shrink-0 rounded-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-bright">{r.media.title}</p>
                      <p className="line-clamp-2 text-[12px] text-text-light italic">{r.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Forum Activity" href="/forum" />
            {threads.length === 0 ? (
              <p className="card p-4 text-[13px] text-text-lighter">
                Quiet in here.{" "}
                <Link href="/forum/new" className="font-semibold text-accent">
                  Start a thread
                </Link>
              </p>
            ) : (
              <div className="card divide-y divide-fg-grey-dark">
                {threads.map((t) => (
                  <Link key={t.id} href={`/forum/thread/${t.id}`} className="block p-3 transition hover:bg-fg-grey">
                    <p className="line-clamp-1 text-[13px] font-semibold text-bright">{t.title}</p>
                    <p className="mt-0.5 text-[11px] text-text-lighter">
                      {t.replyCount} replies · {t.lastReplyUser ? `${t.lastReplyUser.displayUsername || t.lastReplyUser.username} replied ` : ""}
                      <TimeAgo date={t.lastReplyAt ?? t.createdAt} />
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </Page>
  );
}
