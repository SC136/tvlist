import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { schema } from "@/db";
import { CollectionCard } from "@/components/list/collection-card";
import { Empty } from "@/components/ui/basics";
import { getProfile } from "@/lib/queries/profile";
import { listCollections } from "@/lib/queries/collections";

export async function generateMetadata({ params }: PageProps<"/user/[username]/lists">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Lists` } : {};
}

export default async function UserListsPage({ params }: PageProps<"/user/[username]/lists">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const lists = await listCollections({
    where: and(eq(schema.collection.userId, profile.user.id), profile.isSelf ? undefined : eq(schema.collection.private, false)),
    limit: 100,
  });
  return (
    <div>
      {profile.isSelf && (
        <div className="mb-6 flex justify-end">
          <Link href="/list/new" className="btn btn-primary">
            <Plus className="h-4 w-4" /> New List
          </Link>
        </div>
      )}
      {lists.length === 0 ? (
        <Empty>{profile.isSelf ? "Make your first list: rankings, themes, watch orders, anything." : "No lists yet."}</Empty>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((l) => (
            <CollectionCard key={l.id} list={l} showAuthor={false} />
          ))}
        </div>
      )}
    </div>
  );
}
