"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { recordListActivity } from "@/lib/activity";
import { getViewer } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { LIST_STATUSES, todayIso, type ListStatus } from "@/lib/format";
import type { MediaType } from "@/lib/media";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const mediaRef = z.object({
  type: z.enum(["movie", "tv", "anime", "game", "manga", "book", "music"]),
  tmdbId: z.number().int().positive(),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

const entryInput = mediaRef.extend({
  status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]),
  score: z.number().int().min(0).max(100),
  progress: z.number().int().min(0).max(100000),
  repeat: z.number().int().min(0).max(1000),
  startedAt: isoDate,
  completedAt: isoDate,
  notes: z.string().max(2000).nullable().optional(),
  private: z.boolean(),
});

export type EntryInput = z.infer<typeof entryInput>;

export interface SavedEntry {
  status: ListStatus;
  score: number;
  progress: number;
  repeat: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  private: boolean;
}

function toSaved(row: typeof schema.listEntry.$inferSelect): SavedEntry {
  return {
    status: row.status,
    score: row.score,
    progress: row.progress,
    repeat: row.repeat,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    notes: row.notes,
    private: row.private,
  };
}

async function upsertEntry(userId: string, input: EntryInput): Promise<ActionResult<SavedEntry>> {
  const media = await ensureMedia(input.type, input.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };

  const prev = await db.query.listEntry.findFirst({
    where: and(eq(schema.listEntry.userId, userId), eq(schema.listEntry.mediaId, media.id)),
  });

  const total = media.type === "movie" ? 1 : media.episodes ?? 0;
  let progress = input.progress;
  if (total > 0) progress = Math.min(progress, total);
  const values = {
    status: input.status,
    score: input.score,
    progress,
    repeat: input.repeat,
    startedAt: input.startedAt ?? null,
    completedAt: input.completedAt ?? null,
    notes: input.notes?.trim() || null,
    private: input.private,
  };

  // Completing fills in progress and the finish date automatically.
  if (values.status === "COMPLETED") {
    if (total > 0) values.progress = total;
    if (!values.completedAt && prev?.status !== "COMPLETED") values.completedAt = todayIso();
    if (!values.startedAt && media.type === "movie") values.startedAt = values.completedAt;
  }
  if ((values.status === "CURRENT" || values.status === "REPEATING") && !values.startedAt) values.startedAt = todayIso();
  // Watching the final episode completes the show.
  if (values.status === "CURRENT" && media.type === "tv" && total > 0 && values.progress >= total && media.status === "Finished") {
    values.status = "COMPLETED";
    values.completedAt ??= todayIso();
  }
  if (values.status === "REPEATING" && prev?.status === "REPEATING" && total > 0 && values.progress >= total) {
    values.status = "COMPLETED";
    values.repeat += 1;
  }

  const [row] = prev
    ? await db.update(schema.listEntry).set(values).where(eq(schema.listEntry.id, prev.id)).returning()
    : await db.insert(schema.listEntry).values({ userId, mediaId: media.id, ...values }).returning();

  await recordListActivity(userId, media, prev ? { status: prev.status, progress: prev.progress } : null, {
    status: row.status,
    progress: row.progress,
    private: row.private,
  });

  // Finishing something also logs it in the diary.
  if (row.status === "COMPLETED" && prev?.status !== "COMPLETED") {
    await db.insert(schema.diaryEntry).values({
      userId,
      mediaId: media.id,
      watchedOn: row.completedAt ?? todayIso(),
      score: row.score,
      rewatch: (prev?.repeat ?? 0) < row.repeat || prev?.status === "REPEATING",
    });
  }

  return { ok: true, data: toSaved(row) };
}

export async function saveListEntry(raw: EntryInput): Promise<ActionResult<SavedEntry>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = entryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Some of those values aren't valid." };
  const result = await upsertEntry(viewer.id, parsed.data);
  refresh();
  return result;
}

/** One-click status from the "Add to List" dropdown, keeping existing fields. */
export async function setListStatus(raw: { type: MediaType; tmdbId: number; status: ListStatus }): Promise<ActionResult<SavedEntry>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = mediaRef.extend({ status: z.enum(LIST_STATUSES as [ListStatus, ...ListStatus[]]) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const media = await ensureMedia(parsed.data.type, parsed.data.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };
  const existing = await db.query.listEntry.findFirst({
    where: and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, media.id)),
  });
  const result = await upsertEntry(viewer.id, {
    type: parsed.data.type,
    tmdbId: parsed.data.tmdbId,
    status: parsed.data.status,
    score: existing?.score ?? 0,
    progress: existing?.progress ?? 0,
    repeat: existing?.repeat ?? 0,
    startedAt: existing?.startedAt ?? null,
    completedAt: existing?.completedAt ?? null,
    notes: existing?.notes ?? null,
    private: existing?.private ?? false,
  });
  refresh();
  return result;
}

/** "+1" episode from progress widgets. */
export async function incrementProgress(raw: { type: MediaType; tmdbId: number }): Promise<ActionResult<SavedEntry>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = mediaRef.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const media = await ensureMedia(parsed.data.type, parsed.data.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };
  const existing = await db.query.listEntry.findFirst({
    where: and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, media.id)),
  });
  if (!existing) return { ok: false, error: "Add it to your list first." };
  const total = media.type === "movie" ? 1 : media.episodes ?? 0;
  const progress = existing.progress + 1;
  const finished = total > 0 && progress >= total && (media.type === "movie" || media.status === "Finished");
  const result = await upsertEntry(viewer.id, {
    type: parsed.data.type,
    tmdbId: parsed.data.tmdbId,
    status: finished ? "COMPLETED" : existing.status === "PLANNING" ? "CURRENT" : existing.status,
    score: existing.score,
    progress,
    repeat: existing.repeat,
    startedAt: existing.startedAt,
    completedAt: existing.completedAt,
    notes: existing.notes,
    private: existing.private,
  });
  refresh();
  return result;
}

export async function deleteListEntry(raw: { type: MediaType; tmdbId: number }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = mediaRef.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const media = await db.query.media.findFirst({
    where: and(eq(schema.media.type, parsed.data.type), eq(schema.media.tmdbId, parsed.data.tmdbId)),
  });
  if (media) {
    await db
      .delete(schema.listEntry)
      .where(and(eq(schema.listEntry.userId, viewer.id), eq(schema.listEntry.mediaId, media.id)));
  }
  refresh();
  return { ok: true };
}

export async function toggleFavourite(raw: { type: MediaType; tmdbId: number }): Promise<ActionResult<{ favourite: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = mediaRef.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const media = await ensureMedia(parsed.data.type, parsed.data.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };
  const where = and(eq(schema.favourite.userId, viewer.id), eq(schema.favourite.mediaId, media.id));
  const existing = await db.query.favourite.findFirst({ where });
  if (existing) await db.delete(schema.favourite).where(where);
  else await db.insert(schema.favourite).values({ userId: viewer.id, mediaId: media.id });
  refresh();
  return { ok: true, data: { favourite: !existing } };
}

export async function toggleFavouritePerson(raw: { personId: number; name: string; profilePath: string | null }): Promise<ActionResult<{ favourite: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = z
    .object({ personId: z.number().int().positive(), name: z.string().min(1).max(200), profilePath: z.string().max(200).nullable() })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const where = and(eq(schema.favouritePerson.userId, viewer.id), eq(schema.favouritePerson.personId, parsed.data.personId));
  const existing = await db.query.favouritePerson.findFirst({ where });
  if (existing) await db.delete(schema.favouritePerson).where(where);
  else await db.insert(schema.favouritePerson).values({ userId: viewer.id, ...parsed.data });
  refresh();
  return { ok: true, data: { favourite: !existing } };
}
