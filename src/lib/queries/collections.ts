import "server-only";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const itemCount = sql<number>`(select count(*) from ${schema.collectionItem} where ${schema.collectionItem.collectionId} = ${schema.collection.id})::int`;
const likeCount = sql<number>`(select count(*) from ${schema.contentLike} where ${schema.contentLike.target} = 'COLLECTION' and ${schema.contentLike.targetId} = ${schema.collection.id})::int`;

export type CollectionSummary = Awaited<ReturnType<typeof listCollections>>[number];

export async function listCollections({ where, order = "recent", limit = 24, offset = 0 }: { where?: SQL; order?: "recent" | "popular"; limit?: number; offset?: number }) {
  const rows = await db
    .select({
      id: schema.collection.id,
      title: schema.collection.title,
      description: schema.collection.description,
      ranked: schema.collection.ranked,
      private: schema.collection.private,
      updatedAt: schema.collection.updatedAt,
      items: itemCount,
      likes: likeCount,
      user: { username: schema.user.username, displayUsername: schema.user.displayUsername, name: schema.user.name, image: schema.user.image },
    })
    .from(schema.collection)
    .innerJoin(schema.user, eq(schema.user.id, schema.collection.userId))
    .where(where)
    .orderBy(order === "popular" ? desc(likeCount) : desc(schema.collection.updatedAt), desc(schema.collection.id))
    .limit(limit)
    .offset(offset);

  const ids = rows.map((r) => r.id);
  const posters = ids.length
    ? await db
        .select({ collectionId: schema.collectionItem.collectionId, posterPath: schema.media.posterPath, position: schema.collectionItem.position })
        .from(schema.collectionItem)
        .innerJoin(schema.media, eq(schema.media.id, schema.collectionItem.mediaId))
        .where(and(inArray(schema.collectionItem.collectionId, ids), sql`${schema.collectionItem.position} <= 5`))
        .orderBy(asc(schema.collectionItem.position))
    : [];
  return rows.map((r) => ({
    ...r,
    posters: posters.filter((p) => p.collectionId === r.id).map((p) => p.posterPath),
  }));
}

export async function getCollection(id: number, viewerId: string | null) {
  const row = await db.query.collection.findFirst({
    where: eq(schema.collection.id, id),
    with: { user: { columns: { id: true, username: true, displayUsername: true, name: true, image: true } } },
  });
  if (!row) return null;
  if (row.private && row.userId !== viewerId) return null;
  const items = await db
    .select({ item: schema.collectionItem, media: schema.media })
    .from(schema.collectionItem)
    .innerJoin(schema.media, eq(schema.media.id, schema.collectionItem.mediaId))
    .where(eq(schema.collectionItem.collectionId, id))
    .orderBy(asc(schema.collectionItem.position));
  const [likes] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.contentLike)
    .where(and(eq(schema.contentLike.target, "COLLECTION"), eq(schema.contentLike.targetId, id)));
  const liked = viewerId
    ? Boolean(
        await db.query.contentLike.findFirst({
          where: and(eq(schema.contentLike.target, "COLLECTION"), eq(schema.contentLike.targetId, id), eq(schema.contentLike.userId, viewerId)),
        }),
      )
    : false;
  return { ...row, items, likes: likes?.n ?? 0, liked };
}
