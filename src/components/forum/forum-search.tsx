"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function ForumSearch({ initial, category }: { initial: string; category?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      className="relative w-full max-w-[260px]"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (q.trim()) params.set("q", q.trim());
        router.push(params.size ? `/forum?${params}` : "/forum");
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search threads" className="input-base pl-9" aria-label="Search threads" />
    </form>
  );
}
