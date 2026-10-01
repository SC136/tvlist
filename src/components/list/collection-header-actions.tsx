"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Settings } from "lucide-react";
import { toggleCollectionLike } from "@/actions/collections";
import { Modal } from "@/components/ui/modal";
import { CollectionForm } from "./collection-form";
import { cn } from "@/lib/cn";

export function CollectionHeaderActions({
  collection,
  liked: initialLiked,
  likes,
  isOwner,
  loggedIn,
}: {
  collection: { id: number; title: string; description: string | null; ranked: boolean; private: boolean };
  liked: boolean;
  likes: number;
  isOwner: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [editOpen, setEditOpen] = useState(false);
  const [, start] = useTransition();
  const count = likes - (initialLiked ? 1 : 0) + (liked ? 1 : 0);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={liked}
        onClick={() => {
          if (!loggedIn) return router.push(`/login?next=/list/${collection.id}`);
          setLiked(!liked);
          start(async () => {
            const res = await toggleCollectionLike(collection.id);
            if (!res.ok) setLiked(liked);
          });
        }}
        className={cn("btn", liked ? "bg-red text-white" : "btn-secondary bg-fg shadow-[var(--shadow-card)]")}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {count > 0 ? count : "Like"}
      </button>
      {isOwner && (
        <button type="button" onClick={() => setEditOpen(true)} className="btn btn-secondary bg-fg shadow-[var(--shadow-card)]">
          <Settings className="h-4 w-4" /> Edit List
        </button>
      )}
      {editOpen && (
        <Modal open onClose={() => setEditOpen(false)} label="Edit list" className="max-w-[600px] bg-fg">
          <div className="p-6">
            <h2 className="mb-4 text-[16px] font-bold text-bright">Edit List</h2>
            <CollectionForm
              existing={collection}
              onDone={() => {
                setEditOpen(false);
                router.refresh();
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
