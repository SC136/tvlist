import type { MetadataRoute } from "next";
import { desc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const statics = ["", "/search/movie", "/search/tv", "/search/people", "/reviews", "/lists", "/forum", "/airing", "/about"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  try {
    const [media, users, reviews] = await Promise.all([
      db.select({ type: schema.media.type, tmdbId: schema.media.tmdbId, updatedAt: schema.media.updatedAt }).from(schema.media).orderBy(desc(schema.media.updatedAt)).limit(20000),
      db.select({ username: schema.user.username }).from(schema.user).where(isNotNull(schema.user.username)).limit(10000),
      db.select({ id: schema.review.id, updatedAt: schema.review.updatedAt }).from(schema.review).limit(10000),
    ]);
    const lists = await db.select({ id: schema.collection.id, updatedAt: schema.collection.updatedAt }).from(schema.collection).where(eq(schema.collection.private, false)).limit(10000);
    return [
      ...statics,
      ...media.map((m) => ({ url: `${base}/${m.type}/${m.tmdbId}`, lastModified: m.updatedAt })),
      ...users.map((u) => ({ url: `${base}/user/${u.username}` })),
      ...reviews.map((r) => ({ url: `${base}/review/${r.id}`, lastModified: r.updatedAt })),
      ...lists.map((l) => ({ url: `${base}/list/${l.id}`, lastModified: l.updatedAt })),
    ];
  } catch {
    return statics;
  }
}
