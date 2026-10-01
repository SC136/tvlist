"use client";

import { useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/cn";

/** Half-star display; score is 0–100. */
export function Stars({ score, className, size = 14 }: { score: number; className?: string; size?: number }) {
  if (!score) return null;
  const halves = Math.round(score / 10);
  return (
    <span className={cn("inline-flex items-center text-green", className)} aria-label={`${halves / 2} stars`}>
      {Array.from({ length: Math.floor(halves / 2) }, (_, i) => (
        <Star key={i} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
      ))}
      {halves % 2 === 1 && <StarHalf style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />}
    </span>
  );
}

/** Click/hover half-star input; value is 0–100 in steps of 10. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Rating">
        {Array.from({ length: 5 }, (_, i) => {
          const full = (i + 1) * 20;
          const half = full - 10;
          return (
            <span key={i} className="relative h-7 w-7 text-text-lighter/40">
              <Star className="absolute inset-0 h-7 w-7" strokeWidth={1.5} />
              {shown >= full ? (
                <Star className="absolute inset-0 h-7 w-7 text-green" fill="currentColor" strokeWidth={0} />
              ) : shown >= half ? (
                <StarHalf className="absolute inset-0 h-7 w-7 text-green" fill="currentColor" strokeWidth={0} />
              ) : null}
              <button
                type="button"
                aria-label={`${half / 20} stars`}
                className="absolute inset-y-0 left-0 w-1/2"
                onMouseEnter={() => setHover(half)}
                onClick={() => onChange(value === half ? 0 : half)}
              />
              <button
                type="button"
                aria-label={`${full / 20} stars`}
                className="absolute inset-y-0 right-0 w-1/2"
                onMouseEnter={() => setHover(full)}
                onClick={() => onChange(value === full ? 0 : full)}
              />
            </span>
          );
        })}
      </div>
      {value > 0 && (
        <button type="button" onClick={() => onChange(0)} className="text-[11px] font-semibold text-text-lighter hover:text-red">
          clear
        </button>
      )}
    </div>
  );
}
