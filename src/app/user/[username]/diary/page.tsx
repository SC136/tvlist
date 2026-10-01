import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Heart, RotateCcw } from "lucide-react";
import { db, schema } from "@/db";
import { Cover } from "@/components/ui/cover";
import { Empty, Pagination } from "@/components/ui/basics";
import { Stars } from "@/components/ui/stars";
import { DiaryDelete } from "@/components/user/diary-delete";
import { getProfile } from "@/lib/queries/profile";
import { monthName } from "@/lib/format";

const PAGE = 50;

export async function generateMetadata({ params }: PageProps<"/user/[username]/diary">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Diary` } : {};
}

export default async function DiaryPage({ params, searchParams }: PageProps<"/user/[username]/diary">) {
  const { username } = await params;
  const sp = await searchParams;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const page = Math.max(1, Number(sp.page) || 1);
  const year = /^\d{4}$/.test(String(sp.year ?? "")) ? String(sp.year) : null;
  const where = and(
    eq(schema.diaryEntry.userId, profile.user.id),
    year ? sql`extract(year from ${schema.diaryEntry.watchedOn}) = ${Number(year)}` : undefined,
  );

  const [entries, [{ n }], years] = await Promise.all([
    db
      .select({ entry: schema.diaryEntry, media: schema.media })
      .from(schema.diaryEntry)
      .innerJoin(schema.media, eq(schema.media.id, schema.diaryEntry.mediaId))
      .where(where)
      .orderBy(desc(schema.diaryEntry.watchedOn), desc(schema.diaryEntry.id))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ n: count() }).from(schema.diaryEntry).where(where),
    db
      .select({ y: sql<number>`extract(year from ${schema.diaryEntry.watchedOn})::int`, n: sql<number>`count(*)::int` })
      .from(schema.diaryEntry)
      .where(eq(schema.diaryEntry.userId, profile.user.id))
      .groupBy(sql`1`)
      .orderBy(sql`1 desc`),
  ]);

  // Group consecutive entries by "YYYY-MM".
  const groups: { key: string; items: typeof entries }[] = [];
  for (const e of entries) {
    const key = e.entry.watchedOn.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(e);
    else groups.push({ key, items: [e] });
  }
  const base = `/user/${profile.user.username}/diary`;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_200px]">
      <div className="min-w-0">
        {entries.length === 0 ? (
          <Empty>
            {profile.isSelf ? (
              <>
                Your diary is empty. Use <strong>Log</strong> on any movie or show, or mark something Completed, to record a viewing.
              </>
            ) : (
              "No diary entries yet."
            )}
          </Empty>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => {
              const [y, m] = g.key.split("-").map(Number);
              return (
                <section key={g.key + g.items[0].entry.id} className="card overflow-hidden">
                  <h2 className="flex items-baseline gap-2 border-b border-fg-grey-dark bg-fg-grey px-4 py-2.5">
                    <span className="text-[15px] font-extrabold text-bright uppercase">{monthName(m, true)}</span>
                    <span className="text-[13px] font-semibold text-text-lighter">{y}</span>
                  </h2>
                  <ul>
                    {g.items.map(({ entry, media }) => (
                      <li key={entry.id} className="group flex items-center gap-4 border-b border-fg-grey-dark/50 px-4 py-2.5 last:border-0">
                        <span className="w-8 shrink-0 text-center text-[20px] font-extrabold text-text-lighter">{Number(entry.watchedOn.slice(8, 10))}</span>
                        <Link href={`/${media.type}/${media.tmdbId}`} className="shrink-0">
                          <Cover path={media.posterPath} alt="" size="w92" className="h-[54px] w-[38px] rounded-sm" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/${media.type}/${media.tmdbId}`} className="text-[14px] font-semibold text-bright hover:text-accent">
                            {media.title}
                          </Link>
                          <span className="ml-2 text-[12px] text-text-lighter">
                            {media.year}
                            {entry.season !== null && ` · Season ${entry.season}`}
                          </span>
                          {entry.note && <p className="mt-0.5 line-clamp-1 text-[12px] text-text-light">{entry.note}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Stars score={entry.score} />
                          {entry.liked && <Heart className="h-4 w-4 text-orange" fill="currentColor" aria-label="Liked" />}
                          {entry.rewatch && <RotateCcw className="h-4 w-4 text-text-lighter" aria-label="Rewatch" />}
                          {profile.isSelf && <DiaryDelete id={entry.id} />}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={Math.ceil((n ?? 0) / PAGE)} basePath={base} params={{ year: year ?? undefined }} />
      </div>
      <aside>
        <p className="mb-2 text-[12px] font-bold tracking-wide text-text-lighter uppercase">Years</p>
        <div className="flex flex-wrap gap-1 md:block md:space-y-0.5">
          <Link href={base} className={`block rounded px-2.5 py-1.5 text-[13px] font-semibold ${!year ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent"}`}>
            All
          </Link>
          {years.map((y) => (
            <Link
              key={y.y}
              href={`${base}?year=${y.y}`}
              className={`flex justify-between gap-3 rounded px-2.5 py-1.5 text-[13px] font-semibold ${year === String(y.y) ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent"}`}
            >
              {y.y} <span className="text-text-lighter">{y.n}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
