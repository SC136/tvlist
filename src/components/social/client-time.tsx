"use client";

import { timeAgo } from "@/lib/format";

/** Relative time in client components (server/client clock drift is tolerated). */
export function ClientTime({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={new Date(iso).toUTCString()} className={className} suppressHydrationWarning>
      {timeAgo(iso)}
    </time>
  );
}
