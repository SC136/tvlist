"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createThread } from "@/actions/forum";
import { FORUM_CATEGORIES } from "@/lib/forum";
import type { ForumCategory } from "@/db/schema";
import type { MediaType } from "@/lib/media";

export function ThreadForm({
  defaultCategory,
  media,
}: {
  defaultCategory: ForumCategory;
  media: { type: MediaType; tmdbId: number; title: string } | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<ForumCategory>(defaultCategory);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await createThread({ title, body, category, mediaType: media?.type ?? null, tmdbId: media?.tmdbId ?? null });
      if (!res.ok) return setError(res.error);
      router.push(`/forum/thread/${res.data!.id}`);
    });

  return (
    <div className="card space-y-5 p-6">
      {media && (
        <p className="rounded bg-fg-grey px-3 py-2 text-[13px]">
          Linked to <strong className="text-accent">{media.title}</strong>
        </p>
      )}
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-text-light">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className="input-grey" placeholder="What do you want to talk about?" />
      </label>
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-text-light">Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)} className="input-grey cursor-pointer">
          {FORUM_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-text-light">Body</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={20000} className="input-grey resize-y" />
        <span className="mt-1 block text-[11px] text-text-lighter">Supports **bold**, _italic_, links, @mentions and ~!spoilers!~</span>
      </label>
      {error && <p className="text-[13px] font-semibold text-red">{error}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={pending || !title.trim() || !body.trim()} className="btn btn-primary px-6">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Post Thread
        </button>
      </div>
    </div>
  );
}
