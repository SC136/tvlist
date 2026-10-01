import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Avatar } from "@/components/ui/avatar";
import { Empty } from "@/components/ui/basics";
import { getProfile } from "@/lib/queries/profile";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: PageProps<"/user/[username]/social">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name} · Social` } : {};
}

export default async function SocialPage({ params, searchParams }: PageProps<"/user/[username]/social">) {
  const { username } = await params;
  const sp = await searchParams;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const tab = sp.tab === "followers" ? "followers" : "following";
  const userCols = { username: schema.user.username, displayUsername: schema.user.displayUsername, name: schema.user.name, image: schema.user.image };
  const people =
    tab === "following"
      ? await db
          .select(userCols)
          .from(schema.follow)
          .innerJoin(schema.user, eq(schema.user.id, schema.follow.followingId))
          .where(eq(schema.follow.followerId, profile.user.id))
          .orderBy(desc(schema.follow.createdAt))
      : await db
          .select(userCols)
          .from(schema.follow)
          .innerJoin(schema.user, eq(schema.user.id, schema.follow.followerId))
          .where(eq(schema.follow.followingId, profile.user.id))
          .orderBy(desc(schema.follow.createdAt));

  const base = `/user/${profile.user.username}/social`;
  return (
    <div>
      <div className="mb-6 flex gap-1">
        {(["following", "followers"] as const).map((t) => (
          <Link
            key={t}
            href={`${base}?tab=${t}`}
            className={cn("rounded px-4 py-1.5 text-[13px] font-semibold capitalize", tab === t ? "bg-accent text-on-accent" : "bg-fg shadow-[var(--shadow-card)] hover:text-accent")}
          >
            {t} ({t === "following" ? profile.following : profile.followers})
          </Link>
        ))}
      </div>
      {people.length === 0 ? (
        <Empty>{tab === "following" ? "Not following anyone yet." : "No followers yet."}</Empty>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
          {people.map((p) => {
            const name = p.displayUsername || p.username || p.name;
            return (
              <Link key={p.username} href={`/user/${p.username}`} className="group text-center" title={name}>
                <Avatar src={p.image} name={name} size={96} className="mx-auto h-auto! w-full! max-w-[96px] aspect-square" />
                <p className="mt-2 truncate text-[12px] font-semibold transition group-hover:text-accent">{name}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
