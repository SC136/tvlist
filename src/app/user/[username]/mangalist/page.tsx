import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserListView } from "@/components/list/user-list-view";
import { getProfile } from "@/lib/queries/profile";
import { getUserList } from "@/lib/queries/user-stats";
import type { ScoreFormat } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/user/[username]/mangalist">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Manga List` } : {};
}

export default async function MangaListPage({ params }: PageProps<"/user/[username]/mangalist">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const rows = await getUserList(profile.user.id, "manga", profile.isSelf);
  return (
    <UserListView
      initialRows={rows}
      type="manga"
      isOwner={profile.isSelf}
      scoreFormat={(profile.viewer?.scoreFormat ?? profile.user.scoreFormat) as ScoreFormat}
      ownerName={profile.name}
    />
  );
}
