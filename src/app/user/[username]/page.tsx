import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ActivityFeed } from "@/components/social/activity-feed";
import { RichText } from "@/components/social/rich-text";
import { MonthlyActivity } from "@/components/user/monthly-activity";
import { Cover, PersonImage } from "@/components/ui/cover";
import { SectionHeader } from "@/components/ui/basics";
import { getProfile } from "@/lib/queries/profile";
import { getActivities } from "@/lib/queries/activity";
import { computeStats, getActivityHistory, getUserList } from "@/lib/queries/user-stats";
import { toFeedViewer } from "@/lib/session";
import { formatDays, formatNumber } from "@/lib/format";
import { isAnimeMedia } from "@/lib/media";
import { cn } from "@/lib/cn";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "text", label: "Status" },
  { key: "list", label: "List" },
  { key: "messages", label: "Messages" },
] as const;

const GENRE_COLORS = ["#2fbf8a", "#4f9dff", "#8b7cf6", "#ec6fb0"];

export default async function UserOverview({ params, searchParams }: PageProps<"/user/[username]">) {
  const { username } = await params;
  const sp = await searchParams;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const { user, isSelf, viewer, name } = profile;
  const filter = FILTERS.find((f) => f.key === sp.activity)?.key ?? "all";

  const [movies, shows, anime, manga, books, music, games, history, activities, favMedia, favPeople] = await Promise.all([
    getUserList(user.id, "movie", isSelf),
    getUserList(user.id, "tv", isSelf),
    getUserList(user.id, "anime", isSelf),
    getUserList(user.id, "manga", isSelf),
    getUserList(user.id, "book", isSelf),
    getUserList(user.id, "music", isSelf),
    getUserList(user.id, "game", isSelf),
    getActivityHistory(user.id),
    getActivities({ kind: "user", userId: user.id, filter }, viewer?.id ?? null),
    db.query.favourite.findMany({
      where: eq(schema.favourite.userId, user.id),
      with: { media: true },
      orderBy: desc(schema.favourite.createdAt),
      limit: 24,
    }),
    db.query.favouritePerson.findMany({
      where: eq(schema.favouritePerson.userId, user.id),
      orderBy: desc(schema.favouritePerson.createdAt),
      limit: 12,
    }),
  ]);
  const movieStats = computeStats(movies, "movie");
  const tvStats = computeStats(shows, "tv");
  const animeStats = computeStats(anime, "anime");
  const mangaStats = computeStats(manga, "manga");
  const bookStats = computeStats(books, "book");
  const musicStats = computeStats(music, "music");
  const gameStats = computeStats(games, "game");
  const allGenres = new Map<string, number>();
  for (const g of [
    ...movieStats.genres,
    ...tvStats.genres,
    ...animeStats.genres,
    ...mangaStats.genres,
    ...bookStats.genres,
    ...musicStats.genres,
    ...gameStats.genres,
  ]) {
    allGenres.set(g.key, (allGenres.get(g.key) ?? 0) + g.count);
  }
  const topGenres = [...allGenres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const genreTotal = topGenres.reduce((a, [, n]) => a + n, 0);

  const favAnime = favMedia.filter((f) => f.media.type === "anime" || isAnimeMedia(f.media));
  const favManga = favMedia.filter((f) => f.media.type === "manga");
  const favBooks = favMedia.filter((f) => f.media.type === "book");
  const favMusic = favMedia.filter((f) => f.media.type === "music");
  const favGames = favMedia.filter((f) => f.media.type === "game");
  const favMovies = favMedia.filter((f) => f.media.type === "movie" && !isAnimeMedia(f.media));
  const favShows = favMedia.filter((f) => f.media.type === "tv" && !isAnimeMedia(f.media));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:gap-10">
      <div className="space-y-8">
        {user.about ? (
          <section className="card p-5">
            <RichText text={user.about} />
          </section>
        ) : isSelf ? (
          <Link href="/settings" className="card block p-5 text-center text-[13px] text-text-lighter hover:text-accent">
            Tell people about yourself — add an About section in settings.
          </Link>
        ) : null}

        {favAnime.length > 0 && <FavGrid title="Favourite Anime" items={favAnime.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favManga.length > 0 && <FavGrid title="Favourite Manga" items={favManga.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favBooks.length > 0 && <FavGrid title="Favourite Books" items={favBooks.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favMusic.length > 0 && <FavGrid title="Favourite Music" items={favMusic.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favGames.length > 0 && <FavGrid title="Favourite Games" items={favGames.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favMovies.length > 0 && <FavGrid title="Favourite Movies" items={favMovies.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favShows.length > 0 && <FavGrid title="Favourite TV" items={favShows.map((f) => f.media)} href={`/user/${user.username}/favorites`} />}
        {favPeople.length > 0 && (
          <section>
            <SectionHeader title="Favourite People" href={`/user/${user.username}/favorites`} />
            <div className="card grid grid-cols-4 gap-3 p-3 sm:grid-cols-6">
              {favPeople.map((p) => (
                <Link key={p.personId} href={`/person/${p.personId}`} title={p.name} className="group">
                  <PersonImage path={p.profilePath} alt={p.name} className="cover-ratio w-full rounded-sm" />
                </Link>
              ))}
            </div>
          </section>
        )}
        {!favMedia.length && !favPeople.length && (
          <section>
            <SectionHeader title="Favourites" />
            <p className="card p-5 text-[13px] text-text-lighter">{isSelf ? "Heart titles and people to show them here." : "No favourites yet."}</p>
          </section>
        )}
      </div>

      <div className="min-w-0 space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatBox
            title="Movies"
            href={`/user/${user.username}/stats?type=movie`}
            items={[
              { label: "Movies", value: formatNumber(movieStats.total) },
              { label: "Days", value: formatDays(movieStats.minutes) },
              { label: "Mean", value: movieStats.meanScore ? String(movieStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="TV Shows"
            href={`/user/${user.username}/stats?type=tv`}
            items={[
              { label: "Episodes", value: formatNumber(tvStats.episodes) },
              { label: "Days", value: formatDays(tvStats.minutes) },
              { label: "Mean", value: tvStats.meanScore ? String(tvStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="Anime"
            href={`/user/${user.username}/stats?type=anime`}
            items={[
              { label: "Episodes", value: formatNumber(animeStats.episodes) },
              { label: "Days", value: formatDays(animeStats.minutes) },
              { label: "Mean", value: animeStats.meanScore ? String(animeStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="Manga"
            href={`/user/${user.username}/stats?type=manga`}
            items={[
              { label: "Chapters", value: formatNumber(mangaStats.episodes) },
              { label: "Days", value: formatDays(mangaStats.minutes) },
              { label: "Mean", value: mangaStats.meanScore ? String(mangaStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="Books"
            href={`/user/${user.username}/stats?type=book`}
            items={[
              { label: "Pages", value: formatNumber(bookStats.episodes) },
              { label: "Days", value: formatDays(bookStats.minutes) },
              { label: "Mean", value: bookStats.meanScore ? String(bookStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="Music"
            href={`/user/${user.username}/stats?type=music`}
            items={[
              { label: "Albums", value: formatNumber(musicStats.total) },
              { label: "Hours", value: formatNumber(Math.round(musicStats.minutes / 60)) },
              { label: "Mean", value: musicStats.meanScore ? String(musicStats.meanScore) : "–" },
            ]}
          />
          <StatBox
            title="Games"
            href={`/user/${user.username}/stats?type=game`}
            items={[
              { label: "Games", value: formatNumber(gameStats.total) },
              { label: "Hours", value: formatNumber(Math.round(gameStats.minutes / 60)) },
              { label: "Mean", value: gameStats.meanScore ? String(gameStats.meanScore) : "–" },
            ]}
          />
        </section>

        <section>
          <SectionHeader title="Watching Pace" />
          <MonthlyActivity counts={history} />
        </section>

        {topGenres.length > 0 && (
          <section>
            <SectionHeader title="Genre Overview" href={`/user/${user.username}/stats`} />
            <div className="card overflow-hidden">
              <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                {topGenres.map(([g, n], i) => (
                  <div key={g}>
                    <span className="inline-block rounded px-2.5 py-1 text-[12px] font-bold text-white" style={{ background: GENRE_COLORS[i] }}>
                      {g}
                    </span>
                    <p className="mt-1 text-[13px] font-semibold">
                      {n} <span className="text-text-lighter">entries</span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex h-2.5">
                {topGenres.map(([g, n], i) => (
                  <div key={g} style={{ width: `${(n / genreTotal) * 100}%`, background: GENRE_COLORS[i] }} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold tracking-wide text-bright uppercase md:text-[16px]">Activity</h2>
            <div className="flex gap-1 text-[12px] font-semibold">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={f.key === "all" ? `/user/${user.username}` : `/user/${user.username}?activity=${f.key}`}
                  scroll={false}
                  className={cn("rounded px-2.5 py-1 transition", filter === f.key ? "bg-accent text-on-accent" : "text-text-lighter hover:text-accent")}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
          <ActivityFeed
            key={filter}
            initial={activities}
            scope={{ kind: "user", userId: user.id, filter }}
            viewer={toFeedViewer(viewer)}
            composer={viewer ? (isSelf ? { kind: "status" } : { kind: "message", recipientId: user.id, recipientName: name }) : null}
            emptyText={filter === "messages" ? "No messages yet." : "No activity yet."}
          />
        </section>
      </div>
    </div>
  );
}

function StatBox({ title, href, items }: { title: string; href: string; items: { label: string; value: string }[] }) {
  return (
    <Link href={href} className="card group block p-4">
      <p className="mb-3 text-[12px] font-bold tracking-wide text-text-lighter uppercase transition group-hover:text-accent">{title}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {items.map((i) => (
          <div key={i.label}>
            <p className="text-[18px] font-extrabold text-accent">{i.value}</p>
            <p className="text-[11px] font-semibold text-text-lighter">{i.label}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}

function FavGrid({ title, items, href }: { title: string; items: (typeof schema.media.$inferSelect)[]; href: string }) {
  return (
    <section>
      <SectionHeader title={title} href={href} />
      <div className="card grid grid-cols-4 gap-3 p-3 sm:grid-cols-6">
        {items.slice(0, 12).map((m) => (
          <Link key={m.id} href={`/${m.type}/${m.tmdbId}`} title={m.title}>
            <Cover path={m.posterPath} alt={m.title} size="w154" className="cover-ratio w-full rounded-sm transition hover:opacity-80" />
          </Link>
        ))}
      </div>
    </section>
  );
}
