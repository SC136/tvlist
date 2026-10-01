"use client";

import { Frown, Meh, Smile, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { scoreFromFormat, scoreMax, scoreStep, scoreToFormat, type ScoreFormat } from "@/lib/format";

/** Score entry that adapts to the user's chosen score format. Value is 0–100. */
export function ScoreInput({
  value,
  onChange,
  format,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  format: ScoreFormat;
  id?: string;
}) {
  const shown = scoreToFormat(value, format);

  if (format === "POINT_5") {
    return (
      <div className="flex h-[38px] items-center gap-1" role="radiogroup" aria-label="Score">
        {Array.from({ length: 5 }, (_, i) => {
          const n = i + 1;
          const on = shown >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={shown === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => onChange(shown === n ? 0 : scoreFromFormat(n, format))}
              className="text-orange transition hover:scale-110"
            >
              <Star className="h-6 w-6" fill={on ? "currentColor" : "none"} strokeWidth={on ? 0 : 1.5} />
            </button>
          );
        })}
      </div>
    );
  }

  if (format === "POINT_3") {
    const faces = [
      { n: 1, Icon: Frown, cls: "text-red" },
      { n: 2, Icon: Meh, cls: "text-orange" },
      { n: 3, Icon: Smile, cls: "text-green" },
    ];
    return (
      <div className="flex h-[38px] items-center gap-2" role="radiogroup" aria-label="Score">
        {faces.map(({ n, Icon, cls }) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={shown === n}
            onClick={() => onChange(shown === n ? 0 : scoreFromFormat(n, format))}
            className={cn("rounded-full p-1 transition", shown === n ? cls : "text-text-lighter hover:text-text")}
          >
            <Icon className="h-7 w-7" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      max={scoreMax(format)}
      step={scoreStep(format)}
      value={shown || ""}
      placeholder="0"
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isNaN(v)) return;
        onChange(scoreFromFormat(Math.min(scoreMax(format), Math.max(0, v)), format));
      }}
      className="input-grey"
    />
  );
}
