"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateListSettings } from "@/actions/settings";
import { UserScore } from "@/components/ui/user-score";
import { cn } from "@/lib/cn";
import { SCORE_FORMATS, type ScoreFormat } from "@/lib/format";

export function ListSettings({ scoreFormat }: { scoreFormat: ScoreFormat }) {
  const [format, setFormat] = useState(scoreFormat);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card space-y-5 p-6">
      <div>
        <h2 className="text-[16px] font-bold text-bright">Scoring System</h2>
        <p className="mt-1 text-[13px] text-text-light">How you rate titles and how scores are shown to you. Changing it never loses precision: scores are stored out of 100.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SCORE_FORMATS.map((f) => (
          <label
            key={f.value}
            className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md border-2 p-3 transition", format === f.value ? "border-accent" : "border-transparent bg-fg-grey")}
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <input type="radio" name="score-format" checked={format === f.value} onChange={() => setFormat(f.value)} className="accent-[rgb(var(--accent))]" />
              {f.label}
            </span>
            <span className="text-[13px] text-text-lighter">
              e.g. <UserScore score={75} format={f.value} />
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && <span className="text-[13px] font-semibold text-green">{msg}</span>}
        <button
          type="button"
          disabled={pending || format === scoreFormat}
          onClick={() =>
            start(async () => {
              const res = await updateListSettings({ scoreFormat: format });
              setMsg(res.ok ? "Saved." : res.error);
            })
          }
          className="btn btn-primary px-6"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </section>
  );
}
