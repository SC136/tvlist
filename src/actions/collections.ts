"use server";

import { refresh } from "next/cache";
import { and, asc, count, desc, eq, inArray, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer, isModerator } from "@/lib/session";
import { ensureMedia, findMedia } from "@/lib/queries/media";
import { notify } from "@/lib/notify";
import { withinLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./list";

const meta = z.object({
  title: z.string().trim().min(1, "Give your list a name.").max(100),
  description: z.string().trim().max(5000).nullable().optional(),
  ranked: z.boolean(),
  private: z.boolean(),
});

const mediaRef = z.object({ type: z.enum(["movie", "tv"]), tmdbId: z.number().int().positive() });

async function owned(collectionId: number, userId: string) {
  const row = await db.query.collection.findFirst({ where: eq(schema.collection.id, Number(collectionId)) });
  return row && row.userId === userId ? row : null;
}

export async function createCollection(raw: z.infer<typeof meta>, first?: { type: "movie" | "tv"; tmdbId: number }): Promise<ActionResult<{ id: number }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = meta.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid list." };
  if (!(await withinLimit(schema.collection, viewer.id, 10, 60 * 60))) return { ok: false, error: "You've created a lot of lists recently. Try again later." };
  const [row] = await db
    .insert(schema.collection)
    .values({ userId: viewer.id, title: parsed.data.title, description: parsed.data.description || null, ranked: parsed.data.ranked, private: parsed.data.private })
    .returning({ id: schema.collection.id });
  if (first) {
    const ref = mediaRef.safeParse(first);
    if (ref.success) {
      const media = await ensureMedia(ref.data.type, ref.data.tmdbId);
      if (media) await db.insert(schema.collectionItem).values({ collectionId: row.id, mediaId: media.id, position: 1 });
    }
  }
  refresh();
  return { ok: true, data: { id: row.id } };
}

export async function updateCollection(id: number, raw: z.infer<typeof meta>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = meta.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid list." };
  const row = await owned(id, viewer.id);
  if (!row) return { ok: false, error: "List not found." };
  await db
    .update(schema.collection)
    .set({ title: parsed.data.title, description: parsed.data.description || null, ranked: parsed.data.ranked, private: parsed.data.private })
    .where(eq(schema.collection.id, row.id));
  refresh();
  return { ok: true };
}

export async function deleteCollection(id: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await db.query.collection.findFirst({ where: eq(schema.collection.id, Number(id)) });
  if (!row) return { ok: true };
  if (row.userId !== viewer.id && !isModerator(viewer)) return { ok: false, error: "You can't delete that." };
  await db.delete(schema.collection).where(eq(schema.collection.id, row.id));
  await db.delete(schema.contentLike).where(and(eq(schema.contentLike.target, "COLLECTION"), eq(schema.contentLike.targetId, row.id)));
  return { ok: true };
}

/** The viewer's lists with whether each contains the given title (for the "Add to list" picker). */
export async function myCollectionsFor(raw: { type: "movie" | "tv"; tmdbId: number }) {
  const viewer = await getViewer();
  if (!viewer) return [];
  const parsed = mediaRef.safeParse(raw);
  if (!parsed.success) return [];
  const media = await findMedia(parsed.data.type, parsed.data.tmdbId);
  const lists = await db
    .select({
      id: schema.collection.id,
      title: schema.collection.title,
      private: schema.collection.private,
      items: sql<number>`(select count(*) from ${schema.collectionItem} where ${schema.collectionItem.collectionId} = ${schema.collection.id})::int`,
    })
    .from(schema.collection)
    .where(eq(schema.collection.userId, viewer.id))
    .orderBy(desc(schema.collection.updatedAt));
  let inSet = new Set<number>();
  if (media && lists.length) {
    const rows = await db
      .select({ id: schema.collectionItem.collectionId })
      .from(schema.collectionItem)
      .where(and(eq(schema.collectionItem.mediaId, media.id), inArray(schema.collectionItem.collectionId, lists.map((l) => l.id))));
    inSet = new Set(rows.map((r) => r.id));
  }
  return lists.map((l) => ({ ...l, has: inSet.has(l.id) }));
}

export async function toggleInCollection(
  collectionId: number,
  raw: { type: "movie" | "tv"; tmdbId: number },
  mode: "toggle" | "add" = "toggle",
): Promise<ActionResult<{ added: boolean; mediaId: number }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = mediaRef.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const row = await owned(collectionId, viewer.id);
  if (!row) return { ok: false, error: "List not found." };
  const media = await ensureMedia(parsed.data.type, parsed.data.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };
  const where = and(eq(schema.collectionItem.collectionId, row.id), eq(schema.collectionItem.mediaId, media.id));
  const existing = await db.query.collectionItem.findFirst({ where });
  if (existing && mode === "add") return { ok: true, data: { added: true, mediaId: media.id } };
  if (existing) {
    await db.delete(schema.collectionItem).where(where);
  } else {
    const [{ n }] = await db.select({ n: count() }).from(schema.collectionItem).where(eq(schema.collectionItem.collectionId, row.id));
    if (n >= 1000) return { ok: false, error: "Lists can hold up to 1,000 titles." };
    const [{ top }] = await db.select({ top: max(schema.collectionItem.position) }).from(schema.collectionItem).where(eq(schema.collectionItem.collectionId, row.id));
    await db.insert(schema.collectionItem).values({ collectionId: row.id, mediaId: media.id, position: (top ?? 0) + 1 });
  }
  await db.update(schema.collection).set({ updatedAt: new Date() }).where(eq(schema.collection.id, row.id));
  return { ok: true, data: { added: !existing, mediaId: media.id } };
}

export async function removeFromCollection(collectionId: number, mediaId: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await owned(collectionId, viewer.id);
  if (!row) return { ok: false, error: "List not found." };
  await db.delete(schema.collectionItem).where(and(eq(schema.collectionItem.collectionId, row.id), eq(schema.collectionItem.mediaId, Number(mediaId))));
  refresh();
  return { ok: true };
}

/** Saves a new order (array of local media ids, first = #1) and optional per-item notes. */
export async function reorderCollection(collectionId: number, mediaIds: number[]): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await owned(collectionId, viewer.id);
  if (!row) return { ok: false, error: "List not found." };
  const ids = z.array(z.number().int().positive()).max(1000).safeParse(mediaIds);
  if (!ids.success) return { ok: false, error: "Invalid order." };
  const current = await db
    .select({ mediaId: schema.collectionItem.mediaId })
    .from(schema.collectionItem)
    .where(eq(schema.collectionItem.collectionId, row.id))
    .orderBy(asc(schema.collectionItem.position));
  const valid = new Set(current.map((c) => c.mediaId));
  const ordered = ids.data.filter((id) => valid.has(id));
  for (const [i, mediaId] of ordered.entries()) {
    await db
      .update(schema.collectionItem)
      .set({ position: i + 1 })
      .where(and(eq(schema.collectionItem.collectionId, row.id), eq(schema.collectionItem.mediaId, mediaId)));
  }
  await db.update(schema.collection).set({ updatedAt: new Date() }).where(eq(schema.collection.id, row.id));
  refresh();
  return { ok: true };
}

export async function setCollectionItemNote(collectionId: number, mediaId: number, note: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await owned(collectionId, viewer.id);
  if (!row) return { ok: false, error: "List not found." };
  const text = String(note ?? "").trim().slice(0, 1000) || null;
  await db
    .update(schema.collectionItem)
    .set({ note: text })
    .where(and(eq(schema.collectionItem.collectionId, row.id), eq(schema.collectionItem.mediaId, Number(mediaId))));
  return { ok: true };
}

export async function toggleCollectionLike(collectionId: number): Promise<ActionResult<{ liked: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await db.query.collection.findFirst({ where: eq(schema.collection.id, Number(collectionId)) });
  if (!row || (row.private && row.userId !== viewer.id)) return { ok: false, error: "List not found." };
  const where = and(eq(schema.contentLike.target, "COLLECTION"), eq(schema.contentLike.targetId, row.id), eq(schema.contentLike.userId, viewer.id));
  const existing = await db.query.contentLike.findFirst({ where });
  if (existing) await db.delete(schema.contentLike).where(where);
  else {
    await db.insert(schema.contentLike).values({ target: "COLLECTION", targetId: row.id, userId: viewer.id }).onConflictDoNothing();
    await notify({ userId: row.userId, type: "COLLECTION_LIKE", actorId: viewer.id, collectionId: row.id });
  }
  return { ok: true, data: { liked: !existing } };
}
