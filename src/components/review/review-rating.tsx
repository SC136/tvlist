"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { rateReview } from "@/actions/review";
import { cn } from "@/lib/cn";

export function ReviewRating({
  reviewId,
  initial,
  up,
  total,
  canRate,
}: {
  reviewId: number;
  initial: number;
  up: number;
  total: number;
  canRate: boolean;
}) {
  const [mine, setMine] = useState(initial);
  const [, start] = useTransition();
  const upCount = up - (initial > 0 ? 1 : 0) + (mine > 0 ? 1 : 0);
  const totalCount = total - (initial !== 0 ? 1 : 0) + (mine !== 0 ? 1 : 0);

  const vote = (v: number) => {
    const next = mine === v ? 0 : v;
    setMine(next);
    start(async () => {
      const res = await rateReview(reviewId, next);
      if (!res.ok) setMine(mine);
    });
  };

  return (
    <div className="card flex flex-col items-center gap-3 p-6 text-center">
      {canRate && <p className="text-[14px] font-semibold text-bright">Was this review helpful?</p>}
      {canRate && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => vote(1)}
            aria-pressed={mine > 0}
            className={cn("btn px-5", mine > 0 ? "bg-green text-white" : "btn-secondary")}
          >
            <ThumbsUp className="h-4 w-4" /> Yes
          </button>
          <button
            type="button"
            onClick={() => vote(-1)}
            aria-pressed={mine < 0}
            className={cn("btn px-5", mine < 0 ? "bg-red text-white" : "btn-secondary")}
          >
            <ThumbsDown className="h-4 w-4" /> No
          </button>
        </div>
      )}
      <p className="text-[12px] text-text-lighter">
        {upCount} out of {totalCount} {totalCount === 1 ? "user" : "users"} found this review helpful
      </p>
    </div>
  );
}
