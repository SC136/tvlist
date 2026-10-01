"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEFAULT_PALETTE, hslHex, isPaletteId, PALETTES, type Palette, type PaletteId } from "@/lib/palettes";

const EVENT = "tvlist:palette";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function read(): PaletteId {
  const value = document.documentElement.dataset.palette;
  return isPaletteId(value) ? value : DEFAULT_PALETTE;
}

function choose(id: PaletteId) {
  document.documentElement.dataset.palette = id;
  try {
    localStorage.setItem("palette", id);
  } catch {
    /* storage unavailable: the choice still applies until the tab closes */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Round preview: the palette's surface colour on one half, its accent on the other. */
function Swatch({ palette, size }: { palette: Palette; size: number }) {
  // Lighter than the real page background so it stays visible on dark footers; the outline works on light and dark.
  const surface = hslHex(palette.hue, palette.sat, 26);
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full shadow-[0_0_0_1px_rgb(140_140_140/0.55)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${surface} 50%, ${palette.dark.accent} 50%)`,
      }}
    />
  );
}

/**
 * Lets visitors pick one of the site palettes. The choice is saved in this
 * browser (like the light/dark setting) and applied before first paint.
 */
export function PalettePicker({ variant = "swatches" }: { variant?: "swatches" | "cards" }) {
  const current = useSyncExternalStore(subscribe, read, () => DEFAULT_PALETTE);

  if (variant === "cards") {
    return (
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Colour palette">
        {PALETTES.map((p) => {
          const active = current === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition",
                active ? "border-accent bg-fg-grey" : "border-transparent bg-fg-grey hover:border-text-lighter/40",
              )}
            >
              <span className="relative">
                <Swatch palette={p} size={40} />
                {active && (
                  <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-bright">{p.name}</span>
                <span className="block truncate text-[12px] text-text-lighter">{p.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour palette">
      {PALETTES.map((p) => {
        const active = current === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${p.name}: ${p.blurb}`}
            onClick={() => choose(p.id)}
            className={cn(
              "inline-flex items-center justify-center rounded-full p-[3px] transition",
              active ? "ring-2 ring-accent ring-offset-2 ring-offset-nav" : "hover:scale-110",
            )}
          >
            <Swatch palette={p} size={26} />
            <span className="sr-only">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
