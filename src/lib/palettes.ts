/**
 * Site colour palettes. Each palette is a hue + saturation for the surfaces
 * plus an accent colour (and the text colour that sits on top of it) for each
 * of light and dark mode. Everything else is derived, so adding a palette is
 * one line. The CSS for every palette is generated from this file
 * (see `paletteCss`), and the picker UI reads the same data.
 */

export const PALETTE_IDS = ["marquee", "noir", "lagoon", "orchid", "forest", "azure", "graphite"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export const DEFAULT_PALETTE: PaletteId = "marquee";

export interface Palette {
  id: PaletteId;
  name: string;
  blurb: string;
  /** Surface tint (0–360) and strength (0–100). Strength 0 = pure grey. */
  hue: number;
  sat: number;
  dark: { accent: string; on: string };
  light: { accent: string; on: string };
}

export const PALETTES: Palette[] = [
  {
    id: "marquee",
    name: "Marquee",
    blurb: "Warm gold on cinema charcoal",
    hue: 28,
    sat: 14,
    dark: { accent: "#f5b042", on: "#1b1204" },
    light: { accent: "#9c5700", on: "#ffffff" },
  },
  {
    id: "noir",
    name: "Neon Noir",
    blurb: "Hot pink on midnight plum",
    hue: 300,
    sat: 22,
    dark: { accent: "#ff63ae", on: "#220712" },
    light: { accent: "#c2185b", on: "#ffffff" },
  },
  {
    id: "lagoon",
    name: "Lagoon",
    blurb: "Teal on deep sea",
    hue: 187,
    sat: 30,
    dark: { accent: "#2dd4bf", on: "#04201c" },
    light: { accent: "#0f766e", on: "#ffffff" },
  },
  {
    id: "orchid",
    name: "Orchid",
    blurb: "Violet on indigo ink",
    hue: 255,
    sat: 28,
    dark: { accent: "#a78bfa", on: "#150b33" },
    light: { accent: "#6d28d9", on: "#ffffff" },
  },
  {
    id: "forest",
    name: "Forest",
    blurb: "Fresh green on pine black",
    hue: 150,
    sat: 22,
    dark: { accent: "#4ade80", on: "#05200f" },
    light: { accent: "#15803d", on: "#ffffff" },
  },
  {
    id: "azure",
    name: "Azure",
    blurb: "Clear blue on slate",
    hue: 220,
    sat: 24,
    dark: { accent: "#5ea8ff", on: "#06182e" },
    light: { accent: "#1d5fd0", on: "#ffffff" },
  },
  {
    id: "graphite",
    name: "Graphite",
    blurb: "Neutral and minimal",
    hue: 220,
    sat: 0,
    dark: { accent: "#e4e4e7", on: "#18181b" },
    light: { accent: "#27272a", on: "#ffffff" },
  },
];

export function getPalette(id: string | null | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && (PALETTE_IDS as readonly string[]).includes(value);
}

/* ------------------------------ colour maths ------------------------------ */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const triplet = (rgb: [number, number, number]) => rgb.join(" ");
const hsl = (h: number, s: number, l: number) => triplet(hslToRgb(h, s, l));

export function hslHex(h: number, s: number, l: number): string {
  return `#${hslToRgb(h, s, l)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Page background colour for a palette (used for the browser theme-color). */
export function paletteBackground(p: Palette, mode: "light" | "dark"): string {
  return mode === "dark" ? hslHex(p.hue, p.sat, 7) : hslHex(p.hue, p.sat * 0.45, 95.5);
}

/* ------------------------------- CSS output ------------------------------- */

type Mode = "light" | "dark";

// Status / semantic colours are shared by all palettes (tuned per mode for contrast).
const SEMANTIC: Record<Mode, Record<string, string>> = {
  dark: { green: "74 214 140", red: "250 100 112", orange: "252 168 76", purple: "150 128 250", pink: "248 120 176" },
  light: { green: "14 128 80", red: "205 48 68", orange: "172 84 0", purple: "112 80 224", pink: "196 50 114" },
};

function tokens(p: Palette, mode: Mode): string {
  const { hue: h, sat: s } = p;
  const accent = hexToRgb(mode === "dark" ? p.dark.accent : p.light.accent);
  const on = hexToRgb(mode === "dark" ? p.dark.on : p.light.on);
  const t: Record<string, string> =
    mode === "dark"
      ? {
          background: hsl(h, s, 7),
          foreground: hsl(h, s, 11),
          "foreground-grey": hsl(h, s, 8.5),
          "foreground-grey-dark": hsl(h, s, 5.5),
          nav: hsl(h, s, 10),
          "nav-text": hsl(h, s * 0.35, 72),
          text: hsl(h, s * 0.35, 72),
          "text-light": hsl(h, s * 0.3, 60),
          "text-lighter": hsl(h, s * 0.3, 64),
          "text-bright": hsl(h, s * 0.3, 95),
          overlay: hsl(h, s, 11),
          shadow: "0 0 0",
        }
      : {
          background: hsl(h, s * 0.45, 95.5),
          foreground: hsl(h, s * 0.3, 99),
          "foreground-grey": hsl(h, s * 0.45, 96.5),
          "foreground-grey-dark": hsl(h, s * 0.45, 91.5),
          nav: hsl(h, Math.max(s, 6) * 0.9, 13),
          "nav-text": hsl(h, s * 0.35, 74),
          text: hsl(h, s * 0.3, 34),
          "text-light": hsl(h, s * 0.25, 40),
          "text-lighter": hsl(h, s * 0.2, 43),
          "text-bright": hsl(h, s * 0.45, 20),
          overlay: hsl(h, s * 0.3, 99),
          shadow: hsl(h, s * 0.6, 18),
        };
  const all: Record<string, string> = {
    ...t,
    ...SEMANTIC[mode],
    accent: triplet(accent),
    "on-accent": triplet(on),
  };
  return `${Object.entries(all)
    .map(([k, v]) => `--${k}:${v};`)
    .join("")}color-scheme:${mode};`;
}

/**
 * All palette CSS in one string:
 *  - default palette on `:root` (+ dark variant)
 *  - `[data-palette="id"]` overrides for every palette
 *  - `.accent-<id>` classes that re-tint a subtree (used for profile colours)
 */
export function paletteCss(): string {
  const [first, ...rest] = PALETTES;
  const out: string[] = [];
  out.push(`:root{${tokens(first, "light")}}`);
  out.push(`:root[data-theme="dark"]{${tokens(first, "dark")}}`);
  for (const p of rest) {
    out.push(`:root[data-palette="${p.id}"]{${tokens(p, "light")}}`);
    out.push(`:root[data-palette="${p.id}"][data-theme="dark"]{${tokens(p, "dark")}}`);
  }
  for (const p of PALETTES) {
    const light = `--accent:${triplet(hexToRgb(p.light.accent))};--on-accent:${triplet(hexToRgb(p.light.on))};`;
    const dark = `--accent:${triplet(hexToRgb(p.dark.accent))};--on-accent:${triplet(hexToRgb(p.dark.on))};`;
    out.push(`.accent-${p.id}{${light}}`);
    out.push(`:root[data-theme="dark"] .accent-${p.id}{${dark}}`);
  }
  return out.join("\n");
}
