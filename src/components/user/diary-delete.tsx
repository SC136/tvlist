"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDiaryEntry } from "@/actions/diary";

export function DiaryDelete({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Delete diary entry"
      onClick={() => confirm("Delete this diary entry?") && start(async () => void (await deleteDiaryEntry(id)))}
      className="rounded p-1 text-text-lighter opacity-0 transition group-hover:opacity-100 hover:text-red focus:opacity-100"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
