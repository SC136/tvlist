import { cn } from "@/lib/cn";
import { LogoGlyph } from "./logo-glyph";

/** Omnilist wordmark: the mark followed by the name. Follows the active palette. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoGlyph accent="rgb(var(--accent))" ink="rgb(var(--on-accent))" className="h-8 w-8 shrink-0" />
      <span className="text-[20px] font-extrabold tracking-tight text-white">
        omni<span className="text-accent">list</span>
      </span>
    </span>
  );
}
