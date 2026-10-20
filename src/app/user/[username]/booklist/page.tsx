import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserListView } from "@/components/list/user-list-view";
import { getProfile } from "@/lib/queries/profile";
import { getUserList } from "@/lib/queries/user-stats";
import type { ScoreFormat } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/user/[username]/booklist">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Book List` } : {};
}

export default async function BookListPage({ params }: PageProps<"/user/[username]/booklist">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const rows = await getUserList(profile.user.id, "book", profile.isSelf);
  return (
    <UserListView
      initialRows={rows}
      type="book"
      isOwner={profile.isSelf}
      scoreFormat={(profile.viewer?.scoreFormat ?? profile.user.scoreFormat) as ScoreFormat}
      ownerName={profile.name}
    />
  );
}
