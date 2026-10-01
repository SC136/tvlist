import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NavTabs } from "@/components/ui/nav-tabs";
import { FollowButton } from "@/components/user/follow-button";
import { getProfile } from "@/lib/queries/profile";
import { profileAccentClass } from "@/lib/validation";

export async function generateMetadata({ params }: LayoutProps<"/user/[username]">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "User not found" };
  return {
    title: { default: profile.name, template: "%s · tvlist" },
    description: profile.user.about?.slice(0, 160) || `${profile.name}'s movie and TV lists on tvlist.`,
  };
}

export default async function UserLayout({ params, children }: LayoutProps<"/user/[username]">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const { user, name, isSelf, isFollowing, viewer } = profile;
  const base = `/user/${user.username}`;

  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/movielist`, label: "Movie List" },
    { href: `${base}/tvlist`, label: "TV List" },
    { href: `${base}/diary`, label: "Diary" },
    { href: `${base}/favorites`, label: "Favorites" },
    { href: `${base}/stats`, label: "Stats" },
    { href: `${base}/lists`, label: "Lists" },
    { href: `${base}/social`, label: "Social" },
    { href: `${base}/reviews`, label: "Reviews" },
  ];

  return (
    // A chosen profile colour re-tints every accent inside the profile; "auto" keeps the visitor's palette.
    <div className={profileAccentClass(user.profileColor)}>
      <div className="relative h-[230px] overflow-hidden bg-nav md:h-[330px]">
        {user.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.55), rgb(var(--nav)) 55%, rgb(var(--accent) / 0.25))" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="container-page relative flex h-full items-end justify-between gap-4 pb-5">
          <div className="flex min-w-0 items-end gap-4 md:gap-6">
            <Avatar
              src={user.image}
              name={name}
              size={160}
              className="h-[96px]! w-[96px]! shadow-lg md:h-[160px]! md:w-[160px]!"
              rounded="rounded"
            />
            <div className="min-w-0 pb-2">
              <h1 className="truncate text-[20px] font-bold text-white drop-shadow md:text-[26px]">{name}</h1>
              <p className="text-[12px] font-semibold text-white/75 md:text-[13px]">
                <Link href={`${base}/social?tab=followers`} className="hover:text-white">
                  {profile.followers} {profile.followers === 1 ? "follower" : "followers"}
                </Link>{" "}
                ·{" "}
                <Link href={`${base}/social?tab=following`} className="hover:text-white">
                  {profile.following} following
                </Link>
              </p>
            </div>
          </div>
          <div className="pb-2">
            {isSelf ? (
              <Link href="/settings" className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25">
                <Settings className="h-4 w-4" /> Edit Profile
              </Link>
            ) : (
              <FollowButton userId={user.id} initial={isFollowing} loggedIn={Boolean(viewer)} />
            )}
          </div>
        </div>
      </div>
      <div className="bg-fg shadow-[var(--shadow-card)]">
        <div className="container-page">
          <NavTabs tabs={tabs} className="justify-start lg:justify-center" />
        </div>
      </div>
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
