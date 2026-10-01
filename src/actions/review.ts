"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer, isModerator } from "@/lib/session";
import { ensureMedia } from "@/lib/queries/media";
import { withinLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./list";

const reviewInput = z.object({
  type: z.enum(["movie", "tv"]),
  tmdbId: z.number().int().positive(),
  summary: z.string().trim().min(20, "Summary must be at least 20 characters.").max(140, "Summary must be at most 140 characters."),
  body: z.string().trim().min(200, "Reviews need at least 200 characters.").max(30000, "That review is too long."),
  score: z.number().int().min(1, "Give it a score from 1 to 100.").max(100),
  containsSpoilers: z.boolean(),
});

export type ReviewInput = z.infer<typeof reviewInput>;

export async function saveReview(raw: ReviewInput): Promise<ActionResult<{ id: number }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = reviewInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  const media = await ensureMedia(parsed.data.type, parsed.data.tmdbId);
  if (!media) return { ok: false, error: "That title couldn't be found." };

  const existing = await db.query.review.findFirst({
    where: and(eq(schema.review.userId, viewer.id), eq(schema.review.mediaId, media.id)),
  });
  const values = {
    summary: parsed.data.summary,
    body: parsed.data.body,
    score: parsed.data.score,
    containsSpoilers: parsed.data.containsSpoilers,
  };
  if (existing) {
    await db.update(schema.review).set(values).where(eq(schema.review.id, existing.id));
    refresh();
    return { ok: true, data: { id: existing.id } };
  }
  if (!(await withinLimit(schema.review, viewer.id, 5, 60 * 60))) return { ok: false, error: "You've posted a lot of reviews recently. Try again later." };
  const [row] = await db.insert(schema.review).values({ userId: viewer.id, mediaId: media.id, ...values }).returning({ id: schema.review.id });
  refresh();
  return { ok: true, data: { id: row.id } };
}

export async function deleteReview(id: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const row = await db.query.review.findFirst({ where: eq(schema.review.id, Number(id)) });
  if (!row) return { ok: true };
  if (row.userId !== viewer.id && !isModerator(viewer)) return { ok: false, error: "You can't delete that." };
  await db.delete(schema.review).where(eq(schema.review.id, row.id));
  return { ok: true };
}

/** +1 helpful, -1 not helpful, 0 clears. */
export async function rateReview(id: number, value: number): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const v = Math.sign(Number(value));
  const row = await db.query.review.findFirst({ where: eq(schema.review.id, Number(id)), columns: { id: true, userId: true } });
  if (!row) return { ok: false, error: "Review not found." };
  if (row.userId === viewer.id) return { ok: false, error: "You can't rate your own review." };
  const where = and(eq(schema.reviewRating.reviewId, row.id), eq(schema.reviewRating.userId, viewer.id));
  if (v === 0) {
    await db.delete(schema.reviewRating).where(where);
  } else {
    await db
      .insert(schema.reviewRating)
      .values({ reviewId: row.id, userId: viewer.id, value: v })
      .onConflictDoUpdate({ target: [schema.reviewRating.reviewId, schema.reviewRating.userId], set: { value: v } });
  }
  refresh();
  return { ok: true };
}
