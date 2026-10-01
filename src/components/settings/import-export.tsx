"use client";

import { useState } from "react";
import { Download, Loader2, UploadCloud } from "lucide-react";
import { importBatch, type ImportKind } from "@/actions/import";

const KINDS: { value: ImportKind; label: string; hint: string }[] = [
  { value: "letterboxd-diary", label: "Letterboxd diary.csv", hint: "Every logged viewing with dates, ratings and rewatches." },
  { value: "letterboxd-ratings", label: "Letterboxd ratings.csv", hint: "Your star ratings (marks titles as completed)." },
  { value: "letterboxd-watched", label: "Letterboxd watched.csv", hint: "Everything you've watched (marks as completed)." },
  { value: "letterboxd-watchlist", label: "Letterboxd watchlist.csv", hint: "Adds titles as Planning." },
  { value: "tvlist", label: "tvlist export (.json)", hint: "Restore a backup made with Export." },
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
  const date = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);
  return data
    .filter((r) => r[iName]?.trim())
    .map((r) => ({
      name: r[iName].trim(),
      year: iYear >= 0 && Number(r[iYear]) ? Number(r[iYear]) : null,
      date: date(r[iDate]),
      watchedDate: iWatched >= 0 ? date(r[iWatched]) : null,
      rating: iRating >= 0 && r[iRating] ? Number(r[iRating]) || null : null,
      rewatch: iRewatch >= 0 ? r[iRewatch]?.trim().toLowerCase() === "yes" : false,
    }));
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
      if (kind === "tvlist") {
        const data = JSON.parse(text) as { format?: string; list?: unknown[] };
        if (data.format !== "tvlist-export" || !Array.isArray(data.list)) throw new Error("That isn't a tvlist export file.");
        rows = data.list;
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
          On Letterboxd go to Settings → Data → Export Your Data, unzip it, then import the CSV files here. Titles are matched against TMDB by name and year.
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept={kind === "tvlist" ? "application/json,.json" : "text/csv,.csv"}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setProgress(null);
            }}
            className="text-[13px] file:mr-3 file:rounded file:border-0 file:bg-fg-grey file:px-3 file:py-2 file:font-semibold file:text-text"
          />
          <button type="button" onClick={run} disabled={!file || running} className="btn btn-primary">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Import
          </button>
        </div>
        {error && <p className="text-[13px] font-semibold text-red">{error}</p>}
        {progress && (
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-fg-grey-dark">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 100}%` }} />
            </div>
            <p className="text-[13px]">
              {progress.done}/{progress.total} processed · <span className="font-semibold text-green">{progress.imported} imported</span>
              {progress.skipped.length > 0 && <span className="text-orange"> · {progress.skipped.length} not matched</span>}
            </p>
            {!running && progress.skipped.length > 0 && (
              <details className="text-[12px] text-text-lighter">
                <summary className="cursor-pointer font-semibold">Show unmatched titles</summary>
                <p className="mt-2">{progress.skipped.slice(0, 200).join(", ")}</p>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
