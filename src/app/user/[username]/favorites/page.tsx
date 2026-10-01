import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { PersonImage } from "@/components/ui/cover";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getProfile } from "@/lib/queries/profile";

export async function generateMetadata({ params }: PageProps<"/user/[username]/favorites">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Favorites` } : {};
}

export default async function FavoritesPage({ params }: PageProps<"/user/[username]/favorites">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const [media, people] = await Promise.all([
    db.query.favourite.findMany({
      where: eq(schema.favourite.userId, profile.user.id),
      with: { media: true },
      orderBy: desc(schema.favourite.createdAt),
    }),
    db.query.favouritePerson.findMany({
      where: eq(schema.favouritePerson.userId, profile.user.id),
      orderBy: desc(schema.favouritePerson.createdAt),
    }),
  ]);
  const groups = [
    { title: "Movies", items: media.filter((f) => f.media.type === "movie") },
    { title: "TV Shows", items: media.filter((f) => f.media.type === "tv") },
  ];

  if (!media.length && !people.length) return <Empty>No favourites yet.</Empty>;

  return (
    <div className="space-y-10">
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title}>
              <SectionHeader title={`${g.title} (${g.items.length})`} />
              <MediaGrid className="lg:grid-cols-7">
                {g.items.map(({ media: m }) => (
                  <MediaCard
                    key={m.id}
                    media={{ type: m.type, id: m.tmdbId, title: m.title, posterPath: m.posterPath, year: m.year, date: m.releaseDate, genres: m.genres, score: m.voteAverage ? Math.round(m.voteAverage * 10) : null, overview: "" }}
                  />
                ))}
              </MediaGrid>
            </section>
          ),
      )}
      {people.length > 0 && (
        <section>
          <SectionHeader title={`People (${people.length})`} />
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {people.map((p) => (
              <Link key={p.personId} href={`/person/${p.personId}`} className="group">
                <PersonImage path={p.profilePath} alt={p.name} className="cover-ratio w-full rounded shadow-[var(--shadow-card)]" />
                <p className="mt-2 truncate text-[13px] font-semibold transition group-hover:text-accent">{p.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
