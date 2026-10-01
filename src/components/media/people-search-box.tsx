"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function PeopleSearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  return (
    <form
      className="relative mb-8 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search/people?search=${encodeURIComponent(q)}` : "/search/people");
      }}
    >
      <p className="mb-2 text-[13px] font-bold text-bright">Search</p>
      <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-text-lighter" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Actors, directors, writers…" className="input-base pl-9" />
    </form>
  );
}
