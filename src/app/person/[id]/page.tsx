import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { FavouritePersonButton } from "@/components/media/favourite-person-button";
import { PersonImage } from "@/components/ui/cover";
import { Empty, Page } from "@/components/ui/basics";
import { ExpandableText } from "@/components/ui/expandable-text";
import { getViewer } from "@/lib/session";
import { getStatusesFor } from "@/lib/queries/media";
import { getPerson, type PersonCredit } from "@/lib/tmdb";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: PageProps<"/person/[id]">): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(Number(id));
  return person ? { title: person.name, description: person.biography.slice(0, 200) } : {};
}

function age(birthday: string, deathday: string | null): number {
  const end = deathday ? new Date(deathday) : new Date();
  const b = new Date(birthday);
  let years = end.getFullYear() - b.getFullYear();
  if (end.getMonth() < b.getMonth() || (end.getMonth() === b.getMonth() && end.getDate() < b.getDate())) years--;
  return years;
}

export default async function PersonPage({ params, searchParams }: PageProps<"/person/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const person = await getPerson(Number(id));
  if (!person) notFound();
  const viewer = await getViewer();

  const tab = sp.tab === "crew" ? "crew" : sp.tab === "cast" ? "cast" : person.cast.length >= person.crew.length ? "cast" : "crew";
  const onList = sp.onList === "1";
  const credits = tab === "cast" ? person.cast : person.crew;
  const statuses = await getStatusesFor(viewer?.id, credits);
  const shown = onList ? credits.filter((c) => statuses[`${c.type}:${c.id}`]) : credits;

  // Group by year, newest first; undated (upcoming/unknown) titles go under "TBA".
  const groups = new Map<string, PersonCredit[]>();
  for (const c of shown) {
    const key = c.year ? String(c.year) : "TBA";
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  const [favRow, [favCount]] = await Promise.all([
    viewer
      ? db.query.favouritePerson.findFirst({
          where: and(eq(schema.favouritePerson.userId, viewer.id), eq(schema.favouritePerson.personId, person.id)),
        })
      : null,
    db.select({ n: count() }).from(schema.favouritePerson).where(eq(schema.favouritePerson.personId, person.id)),
  ]);

  const facts: [string, string][] = [];
  if (person.birthday) facts.push(["Birth", formatDate(person.birthday)!]);
  if (person.deathday) facts.push(["Death", formatDate(person.deathday)!]);
  if (person.birthday) facts.push(["Age", String(age(person.birthday, person.deathday))]);
  if (person.gender) facts.push(["Gender", person.gender]);
  if (person.placeOfBirth) facts.push(["Hometown", person.placeOfBirth]);
  if (person.department) facts.push(["Known For", person.department]);
  if (person.alsoKnownAs.length) facts.push(["Also Known As", person.alsoKnownAs.slice(0, 3).join(", ")]);

  const tabLink = (t: "cast" | "crew") => `/person/${person.id}?tab=${t}${onList ? "&onList=1" : ""}`;

  return (
    <Page>
      <div className="grid gap-8 md:grid-cols-[230px_1fr]">
        <div className="mx-auto w-[180px] md:mx-0 md:w-auto">
          <PersonImage path={person.profilePath} alt={person.name} size="h632" className="cover-ratio w-full rounded shadow-[var(--shadow-card)]" />
          <div className="mt-4">
            <FavouritePersonButton
              person={{ id: person.id, name: person.name, profilePath: person.profilePath }}
              initial={Boolean(favRow)}
              count={favCount?.n ?? 0}
              loggedIn={Boolean(viewer)}
            />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold text-bright">{person.name}</h1>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-semibold text-bright">{k}: </dt>
                <dd className="inline text-text-light">{v}</dd>
              </div>
            ))}
          </dl>
          {person.biography ? <ExpandableText text={person.biography} lines={8} className="mt-5" /> : <p className="mt-5 text-[13px] text-text-lighter">No biography available.</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-semibold">
            {person.imdb && (
              <a href={`https://www.imdb.com/name/${person.imdb}/`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                IMDb
              </a>
            )}
            <a href={`https://www.themoviedb.org/person/${person.id}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              TMDB
            </a>
            {person.instagram && (
              <a href={`https://www.instagram.com/${person.instagram}/`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded bg-fg p-1 shadow-[var(--shadow-card)]">
          {(["cast", "crew"] as const).map((t) => (
            <Link key={t} href={tabLink(t)} className={cn("rounded px-4 py-1.5 text-[13px] font-semibold", tab === t ? "bg-accent text-on-accent" : "hover:text-accent")}>
              {t === "cast" ? `Acting (${person.cast.length})` : `Crew (${person.crew.length})`}
            </Link>
          ))}
        </div>
        {viewer && (
          <Link
            href={`/person/${person.id}?tab=${tab}${onList ? "" : "&onList=1"}`}
            className={cn("rounded px-3 py-1.5 text-[13px] font-semibold", onList ? "bg-accent text-on-accent" : "bg-fg shadow-[var(--shadow-card)] hover:text-accent")}
          >
            On My List
          </Link>
        )}
      </div>

      {shown.length === 0 ? (
        <Empty>{onList ? "None of these are on your list yet." : "No credits found."}</Empty>
      ) : (
        <div className="space-y-10">
          {[...groups.entries()].map(([year, items]) => (
            <section key={year}>
              <h2 className="mb-3 text-[16px] font-bold text-bright">{year}</h2>
              <MediaGrid>
                {items.map((c) => (
                  <MediaCard key={`${c.type}-${c.id}`} media={c} caption={c.role || null} listStatus={statuses[`${c.type}:${c.id}`]} />
                ))}
              </MediaGrid>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
