"use client";

import { useState } from "react";
import { Download, Loader2, UploadCloud } from "lucide-react";
import { importBatch, type ImportKind } from "@/actions/import";

const KINDS: { value: ImportKind; label: string; hint: string }[] = [
  { value: "letterboxd-diary", label: "Letterboxd diary.csv", hint: "Every logged viewing with dates, ratings and rewatches." },
  { value: "letterboxd-ratings", label: "Letterboxd ratings.csv", hint: "Your star ratings (marks titles as completed)." },
  { value: "letterboxd-watched", label: "Letterboxd watched.csv", hint: "Everything you've watched (marks as completed)." },
  { value: "letterboxd-watchlist", label: "Letterboxd watchlist.csv", hint: "Adds titles as Planning." },
  { value: "anilist", label: "AniList export (.json / .csv)", hint: "Anime & Manga lists with status, scores, and progress." },
  { value: "myanimelist", label: "MyAnimeList export (.xml / .json)", hint: "Anime & Manga lists exported from MyAnimeList." },
  { value: "omnilist", label: "Omnilist export (.json)", hint: "Restore a backup made with Omnilist Export." },
];

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, newlines in quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function mapGenericStatus(s?: string | null): string {
  if (!s) return "PLANNING";
  const lower = String(s).toLowerCase().trim();
  if (lower === "current" || lower === "watching" || lower === "reading" || lower === "1") return "CURRENT";
  if (lower === "completed" || lower === "2") return "COMPLETED";
  if (lower === "paused" || lower === "on-hold" || lower === "on_hold" || lower === "hold" || lower === "3") return "PAUSED";
  if (lower === "dropped" || lower === "4") return "DROPPED";
  if (lower === "repeating" || lower === "rewatching" || lower === "rereading") return "REPEATING";
  return "PLANNING";
}

function cleanDate(v?: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (s === "0000-00-00" || s.startsWith("0000") || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function letterboxdRows(text: string) {
  const [header, ...data] = parseCsv(text.replace(/^﻿/, ""));
  if (!header) return [];
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const iName = col("name");
  const iYear = col("year");
  const iDate = col("date");
  const iWatched = col("watched date");
  const iRating = col("rating");
  const iRewatch = col("rewatch");
  if (iName < 0) throw new Error("This doesn't look like a Letterboxd export (no Name column).");
  return data
    .filter((r) => r[iName]?.trim())
    .map((r) => ({
      name: r[iName].trim(),
      year: iYear >= 0 && Number(r[iYear]) ? Number(r[iYear]) : null,
      date: cleanDate(r[iDate]),
      watchedDate: iWatched >= 0 ? cleanDate(r[iWatched]) : null,
      rating: iRating >= 0 && r[iRating] ? Number(r[iRating]) || null : null,
      rewatch: iRewatch >= 0 ? r[iRewatch]?.trim().toLowerCase() === "yes" : false,
    }));
}

function anilistRows(text: string) {
  try {
    const json = JSON.parse(text);
    let rawList: Record<string, unknown>[] = [];
    if (Array.isArray(json)) {
      rawList = json as Record<string, unknown>[];
    } else if (Array.isArray(json.lists)) {
      rawList = json.lists.flatMap((l: { entries?: Record<string, unknown>[] }) => l.entries || []);
    } else if (Array.isArray(json.entries)) {
      rawList = json.entries as Record<string, unknown>[];
    } else if (Array.isArray(json.data?.MediaListCollection?.lists)) {
      rawList = json.data.MediaListCollection.lists.flatMap((l: { entries?: Record<string, unknown>[] }) => l.entries || []);
    }

    if (!rawList.length) throw new Error("No list entries found in this AniList file.");

    return rawList
      .filter((e) => e && (e.mediaId || (e.media as { id?: number })?.id || e.id))
      .map((e) => {
        const media = (e.media as { id?: number; type?: string; title?: { userPreferred?: string; romaji?: string; english?: string } }) || {};
        const mediaId = Number(e.mediaId || media.id || e.id);
        const type = (media.type?.toLowerCase() === "manga" || (e.type as string)?.toLowerCase() === "manga") ? "manga" : "anime";
        const title = media.title?.userPreferred || media.title?.romaji || media.title?.english || (e.title as string);
        const rawScore = Number(e.score) || 0;
        const score = rawScore > 0 && rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore);
        const status = mapGenericStatus(e.status as string);
        const progress = Number(e.progress) || 0;
        const repeat = Number(e.repeat) || 0;
        const notes = typeof e.notes === "string" ? e.notes : null;

        const formatAniDate = (d?: { year?: number; month?: number; day?: number } | string | null) => {
          if (!d) return null;
          if (typeof d === "string") return cleanDate(d);
          if (!d.year) return null;
          return `${d.year}-${String(d.month || 1).padStart(2, "0")}-${String(d.day || 1).padStart(2, "0")}`;
        };

        return {
          mediaId,
          type,
          title,
          status,
          score,
          progress,
          repeat,
          startedAt: cleanDate(formatAniDate(e.startedAt as any)),
          completedAt: cleanDate(formatAniDate(e.completedAt as any)),
          notes,
        };
      });
  } catch (err) {
    if (err instanceof Error && err.message.includes("No list entries")) throw err;
    // Fall back to CSV parser if user uploaded an AniList CSV
    const [header, ...data] = parseCsv(text.replace(/^﻿/, ""));
    if (!header || header.length < 2) throw new Error("Could not parse this AniList file.");
    const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
    const iId = col("id") >= 0 ? col("id") : col("media_id");
    const iTitle = col("series_title") >= 0 ? col("series_title") : col("title");
    const iScore = col("score");
    const iProgress = col("progress") >= 0 ? col("progress") : col("episodes_watched");
    const iStatus = col("status");
    const iType = col("series_type") >= 0 ? col("series_type") : col("type");

    return data
      .filter((r) => (iId >= 0 && Number(r[iId])) || (iTitle >= 0 && r[iTitle]?.trim()))
      .map((r) => {
        const mediaId = iId >= 0 ? Number(r[iId]) : 0;
        const type = (iType >= 0 && r[iType]?.toLowerCase().includes("manga")) ? "manga" : "anime";
        const rawScore = iScore >= 0 ? Number(r[iScore]) || 0 : 0;
        const score = rawScore > 0 && rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore);
        const progress = iProgress >= 0 ? Number(r[iProgress]) || 0 : 0;
        const status = iStatus >= 0 ? mapGenericStatus(r[iStatus]) : "PLANNING";
        return {
          mediaId: mediaId || 1,
          type,
          title: iTitle >= 0 ? r[iTitle].trim() : undefined,
          status,
          score,
          progress,
        };
      });
  }
}

function malRows(text: string) {
  const isXml = text.includes("<myanimelist>") || text.includes("<anime>") || text.includes("<manga>");
  if (isXml) {
    const items: {
      malId?: number | null;
      type: "anime" | "manga";
      title: string;
      status: string;
      score: number;
      progress: number;
      startedAt?: string | null;
      completedAt?: string | null;
    }[] = [];

    const blocks = text.match(/<(anime|manga)>([\s\S]*?)<\/\1>/gi) || [];
    for (const b of blocks) {
      const type = b.toLowerCase().startsWith("<manga") ? "manga" : "anime";
      const get = (tag: string) => {
        const open = `<${tag}>`;
        const close = `</${tag}>`;
        const start = b.indexOf(open);
        const end = b.indexOf(close);
        if (start === -1 || end === -1) return "";
        return b
          .slice(start + open.length, end)
          .replace(/<!\[CDATA\[/gi, "")
          .replace(/\]\]>/gi, "")
          .trim();
      };

      const title = get("series_title");
      if (!title) continue;

      const rawId = get("series_animedb_id") || get("series_mangadb_id");
      const malId = rawId ? Number(rawId) || null : null;
      const status = mapGenericStatus(get("my_status"));
      const rawScore = Number(get("my_score")) || 0;
      const score = rawScore > 0 && rawScore <= 10 ? rawScore * 10 : rawScore;
      const progress = Number(get("my_watched_episodes") || get("my_read_chapters")) || 0;

      items.push({
        malId,
        type,
        title,
        status,
        score,
        progress,
        startedAt: cleanDate(get("my_start_date")),
        completedAt: cleanDate(get("my_finish_date")),
      });
    }

    if (!items.length) throw new Error("No anime or manga entries found in this MyAnimeList file.");
    return items;
  }

  // Handle JSON
  try {
    const json = JSON.parse(text);
    const list = Array.isArray(json) ? json : json.anime || json.manga || json.data || [];
    if (!Array.isArray(list) || !list.length) throw new Error();
    return list.map((item: Record<string, unknown>) => ({
      malId: Number(item.mal_id || item.id || item.series_animedb_id) || null,
      type: ((item.type as string)?.toLowerCase() === "manga" ? "manga" : "anime") as "anime" | "manga",
      title: (item.title || item.name || item.series_title || "Untitled") as string,
      status: mapGenericStatus(item.status as string),
      score: Number(item.score) > 0 && Number(item.score) <= 10 ? Number(item.score) * 10 : Number(item.score) || 0,
      progress: Number(item.progress || item.episodes_watched || item.chapters_read) || 0,
    }));
  } catch {
    throw new Error("Could not parse this MyAnimeList file. Please upload an XML or JSON export from MyAnimeList.");
  }
}

function omnilistRows(text: string) {
  const data = JSON.parse(text) as { format?: string; list?: unknown[] };
  if ((data.format !== "omnilist-export" && data.format !== "tvlist-export") || !Array.isArray(data.list)) {
    throw new Error("That isn't an Omnilist backup export file.");
  }
  return data.list;
}

export function ImportExport() {
  const [kind, setKind] = useState<ImportKind>("letterboxd-diary");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; imported: number; skipped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    if (!file) return;
    setError(null);
    setRunning(true);
    try {
      const text = await file.text();
      let rows: unknown[];
      if (kind === "omnilist" || kind === "tvlist") {
        rows = omnilistRows(text);
      } else if (kind === "anilist") {
        rows = anilistRows(text);
      } else if (kind === "myanimelist") {
        rows = malRows(text);
      } else {
        rows = letterboxdRows(text);
      }
      const state = { done: 0, total: rows.length, imported: 0, skipped: [] as string[] };
      setProgress({ ...state });
      for (let i = 0; i < rows.length; i += 20) {
        const res = await importBatch(kind, rows.slice(i, i + 20));
        state.done = Math.min(rows.length, i + 20);
        state.imported += res.imported;
        state.skipped.push(...res.skipped);
        setProgress({ ...state, skipped: [...state.skipped] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setRunning(false);
    }
  }

  const instructions =
    kind === "omnilist" || kind === "tvlist"
      ? "Upload a JSON backup file generated with Omnilist Export to restore your data."
      : kind === "anilist"
        ? "On AniList, go to Settings → Account → Export Data, download your list as JSON or CSV, and import it here."
        : kind === "myanimelist"
          ? "On MyAnimeList, go to your profile/list export page, download the .xml or .json export file, and import it here."
          : "On Letterboxd, go to Settings → Data → Export Your Data, unzip it, then import the CSV files here. Titles are matched against TMDB by name and year.";

  return (
    <div className="space-y-8">
      <section className="card space-y-4 p-6">
        <h2 className="text-[16px] font-bold text-bright">Export</h2>
        <p className="text-[13px] text-text-light">Download your lists, diary, reviews, favourites and custom lists as a JSON file.</p>
        <a href="/api/export" download className="btn btn-primary">
          <Download className="h-4 w-4" /> Export My Data
        </a>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-[16px] font-bold text-bright">Import</h2>
        <p className="text-[13px] text-text-light">
          {instructions}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => (
            <label key={k.value} className={`cursor-pointer rounded-md border-2 p-3 ${kind === k.value ? "border-accent" : "border-transparent bg-fg-grey"}`}>
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="radio" name="import-kind" checked={kind === k.value} onChange={() => setKind(k.value)} className="accent-[rgb(var(--accent))]" />
                {k.label}
              </span>
              <span className="mt-1 block pl-5 text-[11px] text-text-lighter">{k.hint}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <input
            type="file"
            accept=".csv,.json,.xml"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setProgress(null);
            }}
            className="text-[13px] file:btn file:btn-secondary file:mr-3"
            aria-label="Import file"
          />
          <button type="button" disabled={!file || running} onClick={run} className="btn btn-primary">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Import
          </button>
        </div>

        {error && <p className="text-[13px] font-semibold text-red">{error}</p>}

        {progress && (
          <div className="space-y-2 rounded-md bg-fg-grey p-4 text-[13px]">
            <p className="font-semibold text-bright">
              {progress.done < progress.total ? "Importing…" : "Import finished!"}
            </p>
            <p className="text-text-light">
              {progress.imported} of {progress.total} imported
              {progress.skipped.length > 0 && ` (${progress.skipped.length} skipped)`}.
            </p>
            {progress.skipped.length > 0 && (
              <details className="text-[12px] text-text-lighter">
                <summary className="cursor-pointer font-semibold hover:text-text">
                  Show skipped items ({progress.skipped.length})
                </summary>
                <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5">
                  {progress.skipped.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
