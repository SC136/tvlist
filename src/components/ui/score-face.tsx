import { Frown, Meh, Smile } from "lucide-react";
import { scoreTone } from "@/lib/format";
import { cn } from "@/lib/cn";

const TONE_CLASS = { high: "text-green", mid: "text-orange", low: "text-red" } as const;

/** A percentage score with a coloured face icon, e.g. "78%". */
export function ScoreFace({ score, className, showIcon = true }: { score: number | null; className?: string; showIcon?: boolean }) {
  const tone = scoreTone(score);
  if (!tone || score === null) return null;
  const Icon = tone === "high" ? Smile : tone === "mid" ? Meh : Frown;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", className)}>
      {showIcon && <Icon className={cn("h-[1.15em] w-[1.15em]", TONE_CLASS[tone])} strokeWidth={2.25} aria-hidden />}
      <span>{score}%</span>
    </span>
  );
}
