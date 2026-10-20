import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserListView } from "@/components/list/user-list-view";
import { getProfile } from "@/lib/queries/profile";
import { getUserList } from "@/lib/queries/user-stats";
import type { ScoreFormat } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/user/[username]/gamelist">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Game List` } : {};
}

export default async function GameListPage({ params }: PageProps<"/user/[username]/gamelist">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const rows = await getUserList(profile.user.id, "game", profile.isSelf);
  return (
    <UserListView
      initialRows={rows}
      type="game"
      isOwner={profile.isSelf}
      scoreFormat={(profile.viewer?.scoreFormat ?? profile.user.scoreFormat) as ScoreFormat}
      ownerName={profile.name}
    />
  );
}
