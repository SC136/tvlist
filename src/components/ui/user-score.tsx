import { Frown, Meh, Smile, Star } from "lucide-react";
import { formatScore, scoreToFormat, type ScoreFormat } from "@/lib/format";
import { cn } from "@/lib/cn";

/** A user's own score rendered in the viewer's preferred format. */
export function UserScore({ score, format, className }: { score: number; format: ScoreFormat; className?: string }) {
  if (!score) return null;
  if (format === "POINT_5") {
    const stars = scoreToFormat(score, format);
    return (
      <span className={cn("inline-flex items-center gap-px text-orange", className)} aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-3.5 w-3.5" fill={i < stars ? "currentColor" : "none"} strokeWidth={i < stars ? 0 : 1.5} />
        ))}
      </span>
    );
  }
  if (format === "POINT_3") {
    const v = scoreToFormat(score, format);
    const Icon = v === 3 ? Smile : v === 2 ? Meh : Frown;
    return <Icon className={cn("h-5 w-5", v === 3 ? "text-green" : v === 2 ? "text-orange" : "text-red", className)} aria-label={formatScore(score, format)} />;
  }
  return <span className={className}>{formatScore(score, format)}</span>;
}
