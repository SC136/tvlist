"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/social";
import { cn } from "@/lib/cn";

export function FollowButton({ userId, initial, loggedIn, className }: { userId: string; initial: boolean; loggedIn: boolean; className?: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [hover, setHover] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        if (!loggedIn) return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        setFollowing(!following);
        start(async () => {
          const res = await toggleFollow(userId);
          if (!res.ok) setFollowing(following);
        });
      }}
      className={cn(
        "btn min-w-[100px] px-5",
        following ? (hover ? "bg-red text-white" : "bg-white/15 text-white backdrop-blur") : "btn-primary",
        className,
      )}
    >
      {following ? (hover ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
}
