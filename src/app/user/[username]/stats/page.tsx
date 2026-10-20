import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonImage } from "@/components/ui/cover";
import { SectionHeader } from "@/components/ui/basics";
import { ColumnChart, Distribution, RankTable } from "@/components/user/stat-charts";
import { getProfile } from "@/lib/queries/profile";
import { computeStats, getUserList } from "@/lib/queries/user-stats";
import { formatDays, formatNumber, STATUS_COLORS, statusLabel, type ListStatus } from "@/lib/format";
import { countryName, type MediaCategory } from "@/lib/media";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: PageProps<"/user/[username]/stats">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Stats` } : {};
}

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "genres", label: "Genres" },
  { key: "cast", label: "Actors" },
  { key: "directors", label: "Directors & Creators" },
  { key: "studios", label: "Studios & Networks" },
] as const;

function scoreColor(k: string) {
  const t = (Number(k) - 10) / 90;
  return `hsl(${Math.round(t * 115)} 72% 55%)`;
}

export default async function UserStatsPage({ params, searchParams }: PageProps<"/user/[username]/stats">) {
  const { username } = await params;
  const sp = await searchParams;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const type: MediaCategory =
    sp.type === "tv"
      ? "tv"
      : sp.type === "anime"
        ? "anime"
        : sp.type === "manga"
          ? "manga"
          : sp.type === "book"
            ? "book"
            : sp.type === "music"
              ? "music"
              : sp.type === "game"
                ? "game"
                : "movie";
  const section = SECTIONS.find((s) => s.key === sp.section)?.key ?? "overview";
  const rows = await getUserList(profile.user.id, type, profile.isSelf);
  const s = computeStats(rows, type);
  const base = `/user/${profile.user.username}/stats`;
  const href = (t: string, sec: string) => `${base}?type=${t}${sec !== "overview" ? `&section=${sec}` : ""}`;

  const tiles =
    type === "movie"
      ? [
          { label: "Total Movies", value: formatNumber(s.total) },
          { label: "Hours Watched", value: formatNumber(Math.round(s.minutes / 60)) },
          { label: "Days Watched", value: formatDays(s.minutes) },
          { label: "Days Planned", value: formatDays(s.planningMinutes) },
          { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
          { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
        ]
      : type === "game"
        ? [
            { label: "Total Games", value: formatNumber(s.total) },
            { label: "Hours Played", value: formatNumber(Math.round(s.minutes / 60)) },
            { label: "Days Played", value: formatDays(s.minutes) },
            { label: "Days Backlog", value: formatDays(s.planningMinutes) },
            { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
            { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
          ]
      : type === "book"
        ? [
            { label: "Total Books", value: formatNumber(s.total) },
            { label: "Pages Read", value: formatNumber(s.episodes) },
            { label: "Days Read", value: formatDays(s.minutes) },
            { label: "Days Planned", value: formatDays(s.planningMinutes) },
            { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
            { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
          ]
      : type === "music"
        ? [
            { label: "Total Albums", value: formatNumber(s.total) },
            { label: "Tracks Listened", value: formatNumber(s.episodes) },
            { label: "Hours Listened", value: formatNumber(Math.round(s.minutes / 60)) },
            { label: "Days Listened", value: formatDays(s.minutes) },
            { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
            { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
          ]
      : type === "manga"
        ? [
            { label: "Total Manga", value: formatNumber(s.total) },
            { label: "Chapters Read", value: formatNumber(s.episodes) },
            { label: "Days Read", value: formatDays(s.minutes) },
            { label: "Days Planned", value: formatDays(s.planningMinutes) },
            { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
            { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
          ]
        : type === "anime"
          ? [
              { label: "Total Anime", value: formatNumber(s.total) },
              { label: "Episodes Watched", value: formatNumber(s.episodes) },
              { label: "Days Watched", value: formatDays(s.minutes) },
              { label: "Days Planned", value: formatDays(s.planningMinutes) },
              { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
              { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
            ]
          : [
              { label: "Total Shows", value: formatNumber(s.total) },
              { label: "Episodes Watched", value: formatNumber(s.episodes) },
              { label: "Days Watched", value: formatDays(s.minutes) },
              { label: "Days Planned", value: formatDays(s.planningMinutes) },
              { label: "Mean Score", value: s.meanScore ? String(s.meanScore) : "–" },
              { label: "Standard Deviation", value: s.stdDev ? String(s.stdDev) : "–" },
            ];

  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr]">
      <aside className="space-y-5">
        <div className="flex gap-1 rounded bg-fg p-1 shadow-[var(--shadow-card)] md:flex-col">
          {(["movie", "tv", "anime", "manga", "book", "music", "game"] as const).map((t) => (
            <Link key={t} href={href(t, section)} className={cn("flex-1 rounded px-3 py-1.5 text-[13px] font-semibold capitalize", type === t ? "bg-accent text-on-accent" : "hover:text-accent")}>
              {t === "movie" ? "Movies" : t === "tv" ? "TV Shows" : t === "anime" ? "Anime" : t === "manga" ? "Manga" : t === "book" ? "Books" : t === "music" ? "Music" : "Games"}
            </Link>
          ))}
        </div>
        <nav className="flex flex-wrap gap-1 md:block md:space-y-0.5">
          {SECTIONS.map((sec) => (
            <Link
              key={sec.key}
              href={href(type, sec.key)}
              className={cn(
                "block rounded px-2.5 py-1.5 text-[13px] font-semibold transition",
                section === sec.key ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent",
              )}
            >
              {sec.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-10">
        {rows.length === 0 ? (
          <p className="card p-8 text-center text-[13px] text-text-lighter">
            No {type === "movie" ? "movies" : type === "game" ? "games" : type === "anime" ? "anime" : "shows"} on this list yet.
          </p>
        ) : section === "overview" ? (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {tiles.map((t) => (
                <div key={t.label} className="card p-4 text-center">
                  <p className="text-[22px] font-extrabold text-accent">{t.value}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-text-lighter">{t.label}</p>
                </div>
              ))}
            </section>
            <section>
              <SectionHeader title="Score" />
              <ColumnChart items={s.scores} colorFor={scoreColor} />
            </section>
            <section>
              <SectionHeader title={type === "movie" ? "Runtime" : type === "game" ? "Playtime" : "Episode Count"} />
              <ColumnChart items={s.lengths} />
            </section>
            <section className="grid gap-8 xl:grid-cols-2">
              <div>
                <SectionHeader title="Status Distribution" />
                <Distribution
                  items={s.status}
                  colors={s.status.map((x) => STATUS_COLORS[x.key as ListStatus])}
                  label={(k) => statusLabel(k as ListStatus, type)}
                />
              </div>
              <div>
                <SectionHeader title="Format Distribution" />
                <Distribution items={s.formats} />
              </div>
            </section>
            <section>
              <SectionHeader title="Country Distribution" />
              <Distribution items={s.countries} label={(k) => countryName(k) ?? k} />
            </section>
            <section>
              <SectionHeader title="Release Year" />
              <ColumnChart items={s.releaseYears} label={(k) => `'${k.slice(2)}`} />
            </section>
            {s.watchYears.length > 0 && (
              <section>
                <SectionHeader title="Watch Year" />
                <ColumnChart items={s.watchYears} />
              </section>
            )}
          </>
        ) : section === "genres" ? (
          <section>
            <SectionHeader title="Genres" />
            <RankTable items={s.genres} render={(i) => <Link href={`/search/${type}?genres=${encodeURIComponent(i.key)}`} className="hover:text-accent">{i.key}</Link>} />
          </section>
        ) : section === "studios" ? (
          <section>
            <SectionHeader title={type === "movie" ? "Studios" : type === "game" ? "Developers & Publishers" : type === "anime" ? "Animation Studios" : "Networks"} />
            <RankTable items={s.studios} />
          </section>
        ) : (
          <section>
            <SectionHeader title={section === "cast" ? (type === "anime" ? "Voice Actors" : "Actors") : type === "movie" ? "Directors" : type === "game" ? "Developers" : "Creators"} />
            <PeopleGrid items={section === "cast" ? s.cast : s.directors} />
          </section>
        )}
      </div>
    </div>
  );
}

function PeopleGrid({ items }: { items: ReturnType<typeof computeStats>["cast"] }) {
  if (!items.length) return <p className="card p-5 text-[13px] text-text-lighter">Nothing to show yet.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p, i) => (
        <Link key={p.person.id} href={`/person/${p.person.id}`} className="card group flex overflow-hidden">
          <PersonImage path={p.person.profilePath} alt={p.person.name} className="h-[92px] w-[66px] shrink-0" />
          <div className="min-w-0 p-3">
            <p className="text-[11px] font-bold text-text-lighter">#{i + 1}</p>
            <p className="truncate text-[14px] font-semibold text-bright transition group-hover:text-accent">{p.person.name}</p>
            <p className="mt-1 text-[12px] text-text-light">
              {p.count} titles{p.meanScore ? ` · ${p.meanScore} mean` : ""} · {formatDays(p.minutes)} days
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
