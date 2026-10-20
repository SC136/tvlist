"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function ExpandableText({ text, lines = 4, className }: { text: string; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const clean = text
    .replace(/^#{1,6}\s*([^\n\r]+)/gm, (_m, h) => `${h.trim()}:\n`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const long = clean.length > 320;
  return (
    <div className={className}>
      <p
        className={cn("prose-user text-[14px] leading-relaxed", !open && long && "overflow-hidden")}
        style={!open && long ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" } : undefined}
      >
        {clean}
      </p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-[12px] font-semibold text-text-lighter hover:text-accent">
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
