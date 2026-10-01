import Link from "next/link";
import { PersonImage } from "@/components/ui/cover";
import type { CastMember, CrewMember } from "@/lib/tmdb";

/** Cast card: photo, actor, and the role they played. */
export function CastCard({ member }: { member: CastMember }) {
  return (
    <Link href={`/person/${member.id}`} className="card group flex h-[80px] overflow-hidden">
      <PersonImage path={member.profilePath} alt={member.name} className="h-full w-[60px] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
        <p className="truncate text-[13px] font-semibold text-bright transition group-hover:text-accent">{member.name}</p>
        <div className="text-[11px] text-text-lighter">
          <p className="line-clamp-2">{member.character || "—"}</p>
          {member.episodes ? <p>{member.episodes} episode{member.episodes === 1 ? "" : "s"}</p> : null}
        </div>
      </div>
    </Link>
  );
}

export function CrewCard({ member }: { member: CrewMember }) {
  return (
    <Link href={`/person/${member.id}`} className="card group flex h-[80px] overflow-hidden">
      <PersonImage path={member.profilePath} alt={member.name} className="h-full w-[60px] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
        <p className="truncate text-[13px] font-semibold text-bright transition group-hover:text-accent">{member.name}</p>
        <div className="text-[11px] text-text-lighter">
          <p className="line-clamp-2">{member.jobs.join(", ")}</p>
          {member.episodes ? <p>{member.episodes} episode{member.episodes === 1 ? "" : "s"}</p> : null}
        </div>
      </div>
    </Link>
  );
}
