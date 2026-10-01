import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Standard page body below the fixed nav. */
export function Page({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cn(narrow ? "container-narrow" : "container-page", "pt-[84px] pb-16 md:pt-[100px]", className)}>
      {children}
    </div>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card px-6 py-10 text-center text-[13px] text-text-lighter", className)}>{children}</div>;
}

export function SectionHeader({
  title,
  href,
  linkLabel = "View All",
  className,
}: {
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <h2 className="text-[15px] font-bold tracking-wide text-bright uppercase md:text-[16px]">{title}</h2>
      {href && (
        <Link href={href} className="text-[12px] font-semibold text-text-lighter transition hover:text-accent">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function Tag({ children, className, href }: { children: ReactNode; className?: string; href?: string }) {
  const classes = cn(
    "inline-flex items-center rounded-full bg-fg-grey px-2.5 py-0.5 text-[11px] font-semibold text-text-light lowercase transition",
    href && "hover:text-accent",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <span className={classes}>{children}</span>
  );
}

/** Prev / page numbers / next, preserving other query params. */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded px-2 text-[13px] font-semibold transition";
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className={cn(btn, "bg-fg hover:text-accent")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages[0] > 1 && (
        <>
          <Link href={href(1)} className={cn(btn, "bg-fg hover:text-accent")}>
            1
          </Link>
          {pages[0] > 2 && <span className="px-1 text-text-lighter">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(btn, p === page ? "bg-accent text-on-accent" : "bg-fg hover:text-accent")}
        >
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-text-lighter">…</span>}
          <Link href={href(totalPages)} className={cn(btn, "bg-fg hover:text-accent")}>
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} className={cn(btn, "bg-fg hover:text-accent")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

/** Server-rendered relative time with the absolute time as a tooltip. */
export function TimeAgo({ date, className }: { date: Date | string; className?: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <time dateTime={d.toISOString()} title={d.toUTCString()} className={className}>
      {relative(d)}
    </time>
  );
}

function relative(then: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [31_536_000, "year"],
    [2_592_000, "month"],
    [604_800, "week"],
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}
