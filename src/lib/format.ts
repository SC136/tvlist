/* Client-safe display helpers. */

import type { MediaCategory } from "@/lib/media";

export type ScoreFormat = "POINT_100" | "POINT_10_DECIMAL" | "POINT_10" | "POINT_5" | "POINT_3";
export type ListStatus = "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";

export const SCORE_FORMATS: { value: ScoreFormat; label: string }[] = [
  { value: "POINT_100", label: "100 Point (55/100)" },
  { value: "POINT_10_DECIMAL", label: "10 Point Decimal (5.5/10)" },
  { value: "POINT_10", label: "10 Point (5/10)" },
  { value: "POINT_5", label: "5 Star (3/5)" },
  { value: "POINT_3", label: "3 Point Smiley :)" },
];

export const LIST_STATUSES: ListStatus[] = ["CURRENT", "PLANNING", "COMPLETED", "REPEATING", "PAUSED", "DROPPED"];

export function statusLabel(status: ListStatus, type: MediaCategory): string {
  switch (status) {
    case "CURRENT":
      return type === "game"
        ? "Playing"
        : type === "manga" || type === "book"
          ? "Reading"
          : type === "music"
            ? "Listening"
            : "Watching";
    case "PLANNING":
      return type === "game"
        ? "Backlog"
        : type === "book"
          ? "Want to Read"
          : type === "music"
            ? "Want to Listen"
            : "Planning";
    case "COMPLETED":
      return type === "music" ? "Listened" : "Completed";
    case "DROPPED":
      return "Dropped";
    case "PAUSED":
      return "Paused";
    case "REPEATING":
      return type === "game"
        ? "Replaying"
        : type === "manga" || type === "book"
          ? "Rereading"
          : type === "music"
            ? "Relistening"
            : "Rewatching";
  }
}

/** "Set as Watching" etc. on the add-to-list button. */
export function statusAction(status: ListStatus, type?: MediaCategory): string {
  switch (status) {
    case "CURRENT":
      return type === "game"
        ? "Playing"
        : type === "manga" || type === "book"
          ? "Reading"
          : type === "music"
            ? "Listening"
            : "Watching";
    case "PLANNING":
      return type === "game"
        ? "Backlog"
        : type === "book"
          ? "Want to Read"
          : type === "music"
            ? "Want to Listen"
            : "Planning";
    case "COMPLETED":
      return type === "music" ? "Listened" : "Completed";
    case "DROPPED":
      return "Dropped";
    case "PAUSED":
      return "Paused";
    case "REPEATING":
      return type === "game"
        ? "Replaying"
        : type === "manga" || type === "book"
          ? "Rereading"
          : type === "music"
            ? "Relistening"
            : "Rewatching";
  }
}

export const STATUS_COLORS: Record<ListStatus, string> = {
  CURRENT: "#2fbf8a",
  PLANNING: "#4f9dff",
  COMPLETED: "#8b7cf6",
  REPEATING: "#14b8c4",
  PAUSED: "#e08a1e",
  DROPPED: "#ef5f7a",
};

/* ------------------------------- Scores ---------------------------------- */

/** Converts a 0–100 stored score into the value shown in the given format. */
export function scoreToFormat(score: number, format: ScoreFormat): number {
  if (!score) return 0;
  switch (format) {
    case "POINT_100":
      return Math.round(score);
    case "POINT_10_DECIMAL":
      return Math.round(score) / 10;
    case "POINT_10":
      return Math.max(1, Math.round(score / 10));
    case "POINT_5":
      return Math.max(1, Math.round(score / 20));
    case "POINT_3":
      return score >= 70 ? 3 : score >= 40 ? 2 : 1;
  }
}

/** Converts a value entered in the given format back to the 0–100 scale. */
export function scoreFromFormat(value: number, format: ScoreFormat): number {
  if (!value || value < 0) return 0;
  let result: number;
  switch (format) {
    case "POINT_100":
      result = value;
      break;
    case "POINT_10_DECIMAL":
      result = value * 10;
      break;
    case "POINT_10":
      result = value * 10;
      break;
    case "POINT_5":
      result = value * 20;
      break;
    case "POINT_3":
      result = value >= 3 ? 85 : value === 2 ? 60 : 35;
      break;
  }
  return Math.max(0, Math.min(100, Math.round(result)));
}

export function scoreMax(format: ScoreFormat): number {
  switch (format) {
    case "POINT_100":
      return 100;
    case "POINT_10_DECIMAL":
    case "POINT_10":
      return 10;
    case "POINT_5":
      return 5;
    case "POINT_3":
      return 3;
  }
}

export function scoreStep(format: ScoreFormat): number {
  return format === "POINT_10_DECIMAL" ? 0.5 : 1;
}

/** Text form of a score; POINT_5 / POINT_3 have visual renderers in <Score>. */
export function formatScore(score: number, format: ScoreFormat): string {
  if (!score) return "";
  const v = scoreToFormat(score, format);
  switch (format) {
    case "POINT_10_DECIMAL":
      return v.toFixed(1);
    case "POINT_5":
      return `${v}★`;
    case "POINT_3":
      return v === 3 ? ":)" : v === 2 ? ":|" : ":(";
    default:
      return String(v);
  }
}

/** Colour band used by score faces: green / orange / red. */
export function scoreTone(percent: number | null | undefined): "high" | "mid" | "low" | null {
  if (percent === null || percent === undefined) return null;
  if (percent >= 75) return "high";
  if (percent >= 60) return "mid";
  return "low";
}

/* -------------------------------- Dates ---------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Jul 15, 2010" from an ISO date (timezone-safe, no Date parsing). */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y) return null;
  if (!m) return String(y);
  if (!d) return `${MONTHS[m - 1]} ${y}`;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function monthName(month: number, long = false): string {
  return (long ? MONTHS_LONG : MONTHS)[month - 1] ?? "";
}

export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/** Days until an ISO date (can be negative). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function airingIn(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = daysUntil(iso);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------ Durations -------------------------------- */

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} mins`;
  return m ? `${h} hour${h > 1 ? "s" : ""}, ${m} mins` : `${h} hour${h > 1 ? "s" : ""}`;
}

export function formatDays(minutes: number): string {
  return (minutes / 60 / 24).toFixed(1);
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0";
  return n.toLocaleString("en-US");
}

export function formatMoney(n: number | null | undefined): string | null {
  if (!n) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${formatNumber(n)} ${n === 1 ? word : pluralWord}`;
}
