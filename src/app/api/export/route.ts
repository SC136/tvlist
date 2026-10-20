import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";

/** Downloads everything a user owns as JSON (re-importable from Settings → Import). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const [entries, diary, reviews, favourites, people, collections] = await Promise.all([
    db
      .select({ e: schema.listEntry, m: { type: schema.media.type, tmdbId: schema.media.tmdbId, title: schema.media.title } })
      .from(schema.listEntry)
      .innerJoin(schema.media, eq(schema.media.id, schema.listEntry.mediaId))
      .where(eq(schema.listEntry.userId, viewer.id)),
    db
      .select({ d: schema.diaryEntry, m: { type: schema.media.type, tmdbId: schema.media.tmdbId, title: schema.media.title } })
      .from(schema.diaryEntry)
      .innerJoin(schema.media, eq(schema.media.id, schema.diaryEntry.mediaId))
      .where(eq(schema.diaryEntry.userId, viewer.id)),
    db
      .select({ r: schema.review, m: { type: schema.media.type, tmdbId: schema.media.tmdbId, title: schema.media.title } })
      .from(schema.review)
      .innerJoin(schema.media, eq(schema.media.id, schema.review.mediaId))
      .where(eq(schema.review.userId, viewer.id)),
    db
      .select({ m: { type: schema.media.type, tmdbId: schema.media.tmdbId, title: schema.media.title } })
      .from(schema.favourite)
      .innerJoin(schema.media, eq(schema.media.id, schema.favourite.mediaId))
      .where(eq(schema.favourite.userId, viewer.id)),
    db.select().from(schema.favouritePerson).where(eq(schema.favouritePerson.userId, viewer.id)),
    db.query.collection.findMany({
      where: eq(schema.collection.userId, viewer.id),
      with: { items: { with: { media: { columns: { type: true, tmdbId: true, title: true } } } } },
    }),
  ]);

  const data = {
    format: "tvlist-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    user: { username: viewer.username, about: viewer.about, scoreFormat: viewer.scoreFormat },
    list: entries.map(({ e, m }) => ({
      type: m.type,
      tmdbId: m.tmdbId,
      title: m.title,
      status: e.status,
      score: e.score,
      progress: e.progress,
      repeat: e.repeat,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      notes: e.notes,
      private: e.private,
    })),
    diary: diary.map(({ d, m }) => ({
      type: m.type,
      tmdbId: m.tmdbId,
      title: m.title,
      watchedOn: d.watchedOn,
      score: d.score,
      rewatch: d.rewatch,
      liked: d.liked,
      season: d.season,
      note: d.note,
    })),
    reviews: reviews.map(({ r, m }) => ({
      type: m.type,
      tmdbId: m.tmdbId,
      title: m.title,
      summary: r.summary,
      body: r.body,
      score: r.score,
      containsSpoilers: r.containsSpoilers,
      createdAt: r.createdAt,
    })),
    favourites: favourites.map(({ m }) => m),
    favouritePeople: people.map((p) => ({ personId: p.personId, name: p.name, profilePath: p.profilePath })),
    lists: collections.map((c) => ({
      title: c.title,
      description: c.description,
      ranked: c.ranked,
      private: c.private,
      items: c.items
        .sort((a, b) => a.position - b.position)
        .map((i) => ({ type: i.media.type, tmdbId: i.media.tmdbId, title: i.media.title, note: i.note })),
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="omnilist-${viewer.username}-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
