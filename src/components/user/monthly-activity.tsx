import { monthName } from "@/lib/format";

/**
 * Twelve-month activity chart: one bar per calendar month (this month last),
 * built from per-day activity counts keyed "YYYY-MM-DD".
 */
export function MonthlyActivity({ counts }: { counts: Record<string, number> }) {
  const now = new Date();
  const months: { key: string; month: number; label: string; n: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({ key, month: d.getUTCMonth() + 1, label: monthName(d.getUTCMonth() + 1), n: 0 });
  }
  for (const [day, n] of Object.entries(counts)) {
    const m = months.find((x) => x.key === day.slice(0, 7));
    if (m) m.n += n;
  }
  const total = months.reduce((a, m) => a + m.n, 0);
  const max = Math.max(1, ...months.map((m) => m.n));
  const busiest = months.reduce((best, m) => (m.n > best.n ? m : best), months[0]);

  return (
    <div className="card p-4">
      <div className="flex h-[110px] items-end gap-1.5 sm:gap-2" role="img" aria-label={`${total} activities in the last 12 months`}>
        {months.map((m) => (
          <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${m.label}: ${m.n} activit${m.n === 1 ? "y" : "ies"}`}>
            <div
              className="w-full rounded-md bg-accent transition-[height]"
              style={{ height: `${m.n ? Math.max(8, (m.n / max) * 100) : 4}%`, opacity: m.n ? 0.35 + 0.65 * (m.n / max) : 0.18 }}
            />
            <span className="text-[10px] font-semibold text-text-lighter">{m.label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-text-lighter">
        {total === 0
          ? "No activity in the last 12 months."
          : `${total} ${total === 1 ? "activity" : "activities"} in the last 12 months · busiest month: ${busiest.label}`}
      </p>
    </div>
  );
}
