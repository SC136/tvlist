"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { deleteReview, saveReview } from "@/actions/review";
import { RichText } from "@/components/social/rich-text";
import { cn } from "@/lib/cn";
import type { MediaType } from "@/lib/media";

export function ReviewEditor({
  media,
  existing,
}: {
  media: { type: MediaType; tmdbId: number; title: string };
  existing: { id: number; summary: string; body: string; score: number; containsSpoilers: boolean } | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [score, setScore] = useState(existing?.score ?? 0);
  const [spoilers, setSpoilers] = useState(existing?.containsSpoilers ?? false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveReview({ type: media.type, tmdbId: media.tmdbId, summary, body, score, containsSpoilers: spoilers });
      if (!res.ok) return setError(res.error);
      router.push(`/review/${res.data!.id}`);
    });
  };

  const remove = () => {
    if (!existing || !confirm("Delete this review? This can't be undone.")) return;
    start(async () => {
      const res = await deleteReview(existing.id);
      if (res.ok) router.push(`/${media.type}/${media.tmdbId}/reviews`);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-end justify-between">
          <label htmlFor="review-body" className="text-[14px] font-bold text-bright">
            Review
          </label>
          <div className="flex gap-1 rounded bg-fg-grey p-0.5 text-[12px] font-semibold">
            <button type="button" onClick={() => setPreview(false)} className={cn("rounded px-3 py-1", !preview && "bg-fg text-accent shadow-sm")}>
              Write
            </button>
            <button type="button" onClick={() => setPreview(true)} className={cn("rounded px-3 py-1", preview && "bg-fg text-accent shadow-sm")}>
              Preview
            </button>
          </div>
        </div>
        {preview ? (
          <div className="card min-h-[300px] p-5">
            <RichText text={body || "Nothing to preview yet."} />
          </div>
        ) : (
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            maxLength={30000}
            placeholder={`What did you think of ${media.title}?`}
            className="input-base resize-y leading-relaxed"
          />
        )}
        <p className={cn("mt-1 text-right text-[12px]", body.trim().length < 200 ? "text-orange" : "text-text-lighter")}>
          {body.trim().length} / 200 minimum characters
        </p>
      </div>

      <div>
        <label htmlFor="review-summary" className="mb-2 block text-[14px] font-bold text-bright">
          Summary
        </label>
        <input
          id="review-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={140}
          placeholder="A one-line takeaway (20–140 characters)"
          className="input-base"
        />
        <p className="mt-1 text-right text-[12px] text-text-lighter">{summary.trim().length} / 140</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="review-score" className="mb-2 block text-[14px] font-bold text-bright">
            Score <span className="font-normal text-text-lighter">(1–100)</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              id="review-score"
              type="range"
              min={1}
              max={100}
              value={score || 50}
              onChange={(e) => setScore(Number(e.target.value))}
              className="flex-1 accent-[rgb(var(--accent))]"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={score || ""}
              onChange={(e) => setScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="input-base w-20 text-center"
              aria-label="Score"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 self-end text-[13px] font-semibold">
          <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
          This review contains spoilers
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        {existing ? (
          <button type="button" onClick={remove} disabled={pending} className="text-[13px] font-semibold text-red hover:underline">
            Delete review
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={submit} disabled={pending} className="btn btn-primary px-6 py-2.5">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Update Review" : "Publish Review"}
        </button>
      </div>
    </div>
  );
}
