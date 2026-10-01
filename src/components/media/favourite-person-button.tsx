"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavouritePerson } from "@/actions/list";
import { cn } from "@/lib/cn";

export function FavouritePersonButton({
  person,
  initial,
  count,
  loggedIn,
}: {
  person: { id: number; name: string; profilePath: string | null };
  initial: boolean;
  count: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const n = count - (initial ? 1 : 0) + (fav ? 1 : 0);
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={fav}
      onClick={() => {
        if (!loggedIn) return router.push(`/login?next=/person/${person.id}`);
        setFav(!fav);
        start(async () => {
          const res = await toggleFavouritePerson({ personId: person.id, name: person.name, profilePath: person.profilePath });
          if (!res.ok) setFav(fav);
        });
      }}
      className={cn("btn w-full py-2.5", fav ? "bg-red text-white" : "bg-red/90 text-white/90 hover:text-white")}
    >
      <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
      {fav ? "Favourited" : "Favourite"}
      {n > 0 && <span className="opacity-80">· {n}</span>}
    </button>
  );
}
