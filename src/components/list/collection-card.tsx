import Link from "next/link";
import { Heart, Lock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import type { CollectionSummary } from "@/lib/queries/collections";

/** List card with overlapping posters. */
export function CollectionCard({ list, showAuthor = true }: { list: CollectionSummary; showAuthor?: boolean }) {
  const name = list.user.displayUsername || list.user.username || list.user.name;
  const posters = [...list.posters, ...Array(Math.max(0, 5 - list.posters.length)).fill(null)].slice(0, 5);
  return (
    <Link href={`/list/${list.id}`} className="group block">
      <div className="card relative flex overflow-hidden p-2">
        {posters.map((p, i) => (
          <div key={i} className="relative w-1/5 shrink-0" style={{ marginLeft: i === 0 ? 0 : "-6%", zIndex: 5 - i }}>
            <Cover path={p} alt="" size="w154" className="cover-ratio w-full rounded-sm shadow-[2px_0_6px_rgb(0_0_0/0.35)]" />
          </div>
        ))}
      </div>
      <div className="mt-2 px-0.5">
        <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-bright transition group-hover:text-accent">
          {list.private && <Lock className="h-3.5 w-3.5 shrink-0 text-text-lighter" />}
          {list.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-text-lighter">
          {showAuthor && (
            <>
              <Avatar src={list.user.image} name={name} size={18} rounded="rounded-full" />
              <span className="truncate font-semibold text-text">{name}</span>
            </>
          )}
          <span>{list.items} titles</span>
          {list.likes > 0 && (
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" /> {list.likes}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
