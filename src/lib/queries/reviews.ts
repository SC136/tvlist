import "server-only";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const ratingSum = sql<number>`coalesce((select sum(${schema.reviewRating.value}) from ${schema.reviewRating} where ${schema.reviewRating.reviewId} = ${schema.review.id}), 0)::int`;
const ratingCount = sql<number>`(select count(*) from ${schema.reviewRating} where ${schema.reviewRating.reviewId} = ${schema.review.id})::int`;
const upCount = sql<number>`(select count(*) from ${schema.reviewRating} where ${schema.reviewRating.reviewId} = ${schema.review.id} and ${schema.reviewRating.value} > 0)::int`;

export type ReviewListItem = Awaited<ReturnType<typeof listReviews>>[number];

export async function listReviews({
  where,
  limit = 20,
  offset = 0,
  order = "recent",
}: {
  where?: SQL;
  limit?: number;
  offset?: number;
  order?: "recent" | "top";
}) {
  return db
    .select({
      id: schema.review.id,
      summary: schema.review.summary,
      score: schema.review.score,
      containsSpoilers: schema.review.containsSpoilers,
      createdAt: schema.review.createdAt,
      rating: ratingSum,
      ratingCount,
      upCount,
      user: {
        id: schema.user.id,
        username: schema.user.username,
        displayUsername: schema.user.displayUsername,
        image: schema.user.image,
      },
      media: {
        id: schema.media.id,
        type: schema.media.type,
        tmdbId: schema.media.tmdbId,
        title: schema.media.title,
        posterPath: schema.media.posterPath,
        backdropPath: schema.media.backdropPath,
      },
    })
    .from(schema.review)
    .innerJoin(schema.user, eq(schema.user.id, schema.review.userId))
    .innerJoin(schema.media, eq(schema.media.id, schema.review.mediaId))
    .where(where)
    .orderBy(order === "top" ? desc(ratingSum) : desc(schema.review.createdAt), desc(schema.review.id))
    .limit(limit)
    .offset(offset);
}

export async function countReviews(where?: SQL) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.review)
    .innerJoin(schema.media, eq(schema.media.id, schema.review.mediaId))
    .where(where);
  return row?.n ?? 0;
}

export async function getReview(id: number, viewerId?: string | null) {
  const [row] = await db
    .select({
      id: schema.review.id,
      summary: schema.review.summary,
      body: schema.review.body,
      score: schema.review.score,
      containsSpoilers: schema.review.containsSpoilers,
      createdAt: schema.review.createdAt,
      updatedAt: schema.review.updatedAt,
      rating: ratingSum,
      ratingCount,
      upCount,
      userId: schema.review.userId,
      user: {
        id: schema.user.id,
        username: schema.user.username,
        displayUsername: schema.user.displayUsername,
        image: schema.user.image,
      },
      media: {
        id: schema.media.id,
        type: schema.media.type,
        tmdbId: schema.media.tmdbId,
        title: schema.media.title,
        posterPath: schema.media.posterPath,
        backdropPath: schema.media.backdropPath,
        year: schema.media.year,
      },
    })
    .from(schema.review)
    .innerJoin(schema.user, eq(schema.user.id, schema.review.userId))
    .innerJoin(schema.media, eq(schema.media.id, schema.review.mediaId))
    .where(eq(schema.review.id, id));
  if (!row) return null;
  let myRating = 0;
  if (viewerId) {
    const r = await db.query.reviewRating.findFirst({
      where: and(eq(schema.reviewRating.reviewId, id), eq(schema.reviewRating.userId, viewerId)),
    });
    myRating = r?.value ?? 0;
  }
  return { ...row, myRating };
}
