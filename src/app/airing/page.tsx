import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { Cover } from "@/components/ui/cover";
import { Page, SectionHeader } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { getStatusesFor } from "@/lib/queries/media";
import { getCuratedList } from "@/lib/tmdb";
import { airingIn, formatDate, STATUS_COLORS, statusLabel, todayIso } from "@/lib/format";

export const metadata: Metadata = { title: "Airing Schedule" };

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AiringPage() {
  const viewer = await getViewer();
  const [today, week, mine] = await Promise.all([
    getCuratedList("tv", "airing_today"),
    getCuratedList("tv", "on_the_air"),
    viewer
      ? db
          .select({ media: schema.media, status: schema.listEntry.status })
          .from(schema.listEntry)
          .innerJoin(schema.media, eq(schema.media.id, schema.listEntry.mediaId))
          .where(
            and(
              eq(schema.listEntry.userId, viewer.id),
              inArray(schema.listEntry.status, ["CURRENT", "PLANNING", "PAUSED", "REPEATING"]),
              isNotNull(schema.media.nextEpisodeAirDate),
              gte(schema.media.nextEpisodeAirDate, todayIso()),
            ),
          )
          .orderBy(asc(schema.media.nextEpisodeAirDate))
      : [],
  ]);
  const statuses = await getStatusesFor(viewer?.id, [...today.results, ...week.results]);

  const byDay = new Map<string, typeof mine>();
  for (const row of mine) {
    const day = row.media.nextEpisodeAirDate!;
    byDay.set(day, [...(byDay.get(day) ?? []), row]);
  }

  return (
    <Page>
      <h1 className="mb-8 text-[22px] font-bold text-bright">Airing Schedule</h1>

      {viewer && (
        <section className="mb-12">
          <SectionHeader title="Your Upcoming Episodes" />
          {byDay.size === 0 ? (
            <p className="card p-5 text-[13px] text-text-lighter">
              No upcoming episodes for shows on your list. Add airing shows as Watching or Planning to see them here.
            </p>
          ) : (
            <div className="space-y-6">
              {[...byDay.entries()].map(([day, rows]) => {
                const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
                return (
                  <div key={day}>
                    <p className="mb-2 text-[14px] font-bold text-bright">
                      {weekday} <span className="font-semibold text-text-lighter">· {formatDate(day)} · {airingIn(day)}</span>
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {rows.map(({ media, status }) => (
                        <Link key={media.id} href={`/tv/${media.tmdbId}`} className="card group flex items-center gap-3 overflow-hidden pr-3">
                          <Cover path={media.posterPath} alt="" size="w92" className="h-[72px] w-[50px] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-bright transition group-hover:text-accent">{media.title}</p>
                            <p className="text-[12px] text-text-lighter">
                              S{media.nextEpisodeSeason} · Episode {media.nextEpisodeNumber}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: STATUS_COLORS[status] }}>
                            {statusLabel(status, "tv")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="mb-12">
        <SectionHeader title="Airing Today" href="/search/tv?list=airing_today" />
        <MediaGrid>
          {today.results.slice(0, 12).map((m) => (
            <MediaCard key={m.id} media={m} listStatus={statuses[`tv:${m.id}`]} />
          ))}
        </MediaGrid>
      </section>
      <section>
        <SectionHeader title="On the Air This Week" href="/search/tv?list=on_the_air" />
        <MediaGrid>
          {week.results.slice(0, 18).map((m) => (
            <MediaCard key={m.id} media={m} listStatus={statuses[`tv:${m.id}`]} />
          ))}
        </MediaGrid>
      </section>
    </Page>
  );
}
