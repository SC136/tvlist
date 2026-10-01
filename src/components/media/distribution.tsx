import { STATUS_COLORS, statusLabel, type ListStatus } from "@/lib/format";
import type { MediaType } from "@/lib/media";

const ORDER: ListStatus[] = ["CURRENT", "PLANNING", "COMPLETED", "REPEATING", "PAUSED", "DROPPED"];

/** Status distribution: pills with counts above a stacked bar. */
export function StatusDistribution({ rows, type }: { rows: { status: ListStatus; n: number }[]; type: MediaType }) {
  const total = rows.reduce((a, r) => a + r.n, 0);
  const sorted = ORDER.map((s) => ({ status: s, n: rows.find((r) => r.status === s)?.n ?? 0 })).filter((r) => r.n > 0);
  if (!total) return <p className="card p-5 text-[13px] text-text-lighter">No one has added this yet.</p>;
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap gap-x-6 gap-y-3 p-5">
        {sorted.map((r) => (
          <div key={r.status}>
            <span className="inline-block rounded px-2.5 py-1 text-[12px] font-bold text-white" style={{ background: STATUS_COLORS[r.status] }}>
              {statusLabel(r.status, type)}
            </span>
            <p className="mt-1 text-[13px] font-semibold" style={{ color: STATUS_COLORS[r.status] }}>
              {r.n.toLocaleString("en-US")} <span className="text-text-lighter">Users</span>
            </p>
          </div>
        ))}
      </div>
      <div className="flex h-2.5">
        {sorted.map((r) => (
          <div key={r.status} style={{ width: `${(r.n / total) * 100}%`, background: STATUS_COLORS[r.status] }} title={`${statusLabel(r.status, type)}: ${r.n}`} />
        ))}
      </div>
    </div>
  );
}

function bucketColor(bucket: number): string {
  // Red → orange → green across 10..100.
  const t = (bucket - 10) / 90;
  const hue = Math.round(t * 115);
  return `hsl(${hue} 72% 55%)`;
}

/** Vertical bars for the 10..100 score buckets. */
export function ScoreDistribution({ rows }: { rows: { bucket: number; n: number }[] }) {
  const buckets = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0);
  if (!total) return <p className="card p-5 text-[13px] text-text-lighter">No scores yet.</p>;
  return (
    <div className="card p-5">
      <div className="flex h-[150px] items-end gap-2 md:gap-3">
        {buckets.map((b) => {
          const n = rows.find((r) => r.bucket === b)?.n ?? 0;
          return (
            <div key={b} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-semibold text-text-lighter">{n || ""}</span>
              <div
                className="w-full max-w-[28px] rounded-full"
                style={{ height: `${Math.max(n ? 6 : 3, (n / max) * 100)}%`, background: n ? bucketColor(b) : "rgb(var(--foreground-grey-dark))" }}
                title={`${b}: ${n}`}
              />
              <span className="text-[11px] font-semibold text-text-lighter">{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
