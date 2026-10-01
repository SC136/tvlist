import { formatDays } from "@/lib/format";

type Item = { key: string; count: number; minutes: number; meanScore: number | null };

/** Vertical column chart (score distribution, years). */
export function ColumnChart({
  items,
  metric = "count",
  label,
  colorFor,
}: {
  items: Item[];
  metric?: "count" | "minutes" | "meanScore";
  label?: (k: string) => string;
  colorFor?: (k: string) => string;
}) {
  if (!items.length) return <p className="card p-5 text-[13px] text-text-lighter">Nothing to show yet.</p>;
  const value = (i: Item) => (metric === "count" ? i.count : metric === "minutes" ? Math.round(i.minutes / 60) : (i.meanScore ?? 0));
  const max = Math.max(1, ...items.map(value));
  return (
    <div className="card overflow-x-auto p-5">
      <div className="flex h-[170px] min-w-fit items-end gap-1.5" style={{ minWidth: items.length * 26 }}>
        {items.map((i) => (
          <div key={i.key} className="flex h-full min-w-[20px] flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-text-lighter">{value(i) || ""}</span>
            <div
              className="w-full max-w-[26px] rounded-t-md"
              style={{ height: `${Math.max(3, (value(i) / max) * 100)}%`, background: colorFor?.(i.key) ?? "rgb(var(--accent))" }}
              title={`${label ? label(i.key) : i.key}: ${value(i)}`}
            />
            <span className="text-[10px] font-semibold whitespace-nowrap text-text-lighter">{label ? label(i.key) : i.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal distribution bar with legend (formats, statuses, countries, lengths). */
export function Distribution({ items, colors, label }: { items: Item[]; colors?: string[]; label?: (k: string) => string }) {
  const palette = colors ?? ["#4f9dff", "#2fbf8a", "#8b7cf6", "#ec6fb0", "#ef5f7a", "#e08a1e", "#14b8c4", "#7c8aa0"];
  const total = items.reduce((a, i) => a + i.count, 0);
  if (!total) return <p className="card p-5 text-[13px] text-text-lighter">Nothing to show yet.</p>;
  const top = items.slice(0, 8);
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 sm:grid-cols-4">
        {top.map((i, idx) => (
          <div key={i.key}>
            <span className="inline-block max-w-full truncate rounded px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: palette[idx % palette.length] }}>
              {label ? label(i.key) : i.key}
            </span>
            <p className="mt-1 text-[12px] font-semibold">
              {i.count} <span className="text-text-lighter">({Math.round((i.count / total) * 100)}%)</span>
            </p>
          </div>
        ))}
      </div>
      <div className="flex h-2.5">
        {top.map((i, idx) => (
          <div key={i.key} style={{ width: `${(i.count / total) * 100}%`, background: palette[idx % palette.length] }} />
        ))}
      </div>
    </div>
  );
}

/** Ranked table for genres/studios/people. */
export function RankTable({
  items,
  render,
}: {
  items: Item[];
  render?: (i: Item) => React.ReactNode;
}) {
  if (!items.length) return <p className="card p-5 text-[13px] text-text-lighter">Nothing to show yet.</p>;
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[32px_1fr_60px_70px_80px] gap-3 border-b border-fg-grey-dark px-4 py-2.5 text-[11px] font-bold text-text-lighter uppercase">
        <span>#</span>
        <span>Name</span>
        <span className="text-right">Count</span>
        <span className="text-right">Mean</span>
        <span className="text-right">Days</span>
      </div>
      {items.map((i, idx) => (
        <div key={i.key} className="grid grid-cols-[32px_1fr_60px_70px_80px] items-center gap-3 border-b border-fg-grey-dark/50 px-4 py-2 text-[13px] last:border-0">
          <span className="font-bold text-text-lighter">{idx + 1}</span>
          <span className="min-w-0 truncate font-semibold text-bright">{render ? render(i) : i.key}</span>
          <span className="text-right">{i.count}</span>
          <span className="text-right text-accent">{i.meanScore ?? "–"}</span>
          <span className="text-right text-text-light">{formatDays(i.minutes)}</span>
        </div>
      ))}
    </div>
  );
}
