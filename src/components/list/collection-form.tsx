"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createCollection, deleteCollection, updateCollection } from "@/actions/collections";

export function CollectionForm({
  existing,
  onDone,
}: {
  existing?: { id: number; title: string; description: string | null; ranked: boolean; private: boolean };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [ranked, setRanked] = useState(existing?.ranked ?? false);
  const [isPrivate, setPrivate] = useState(existing?.private ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const data = { title, description: description || null, ranked, private: isPrivate };
      if (existing) {
        const res = await updateCollection(existing.id, data);
        if (!res.ok) return setError(res.error);
        onDone?.();
      } else {
        const res = await createCollection(data);
        if (!res.ok) return setError(res.error);
        router.push(`/list/${res.data!.id}`);
      }
    });

  const remove = () => {
    if (!existing || !confirm("Delete this list? This can't be undone.")) return;
    start(async () => {
      const res = await deleteCollection(existing.id);
      if (res.ok) {
        router.push("/lists");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-text-light">Name</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="input-grey" placeholder="e.g. Best sci-fi of the 2010s" />
      </label>
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-text-light">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} className="input-grey resize-y" placeholder="What ties this list together?" />
      </label>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-[13px] font-semibold">
          <input type="checkbox" checked={ranked} onChange={(e) => setRanked(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
          Ranked list (show numbers)
        </label>
        <label className="flex items-center gap-2 text-[13px] font-semibold">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
          Private
        </label>
      </div>
      {error && <p className="text-[13px] font-semibold text-red">{error}</p>}
      <div className="flex items-center justify-between">
        {existing ? (
          <button type="button" onClick={remove} className="text-[13px] font-semibold text-red hover:underline">
            Delete list
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={submit} disabled={pending || !title.trim()} className="btn btn-primary px-6">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Save" : "Create List"}
        </button>
      </div>
    </div>
  );
}
