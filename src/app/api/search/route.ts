import { NextResponse } from "next/server";
import { ilike, isNotNull, or, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { searchAll } from "@/lib/tmdb";

export interface QuickSearchResult {
  movies: { id: number; title: string; year: number | null; posterPath: string | null }[];
  tv: { id: number; title: string; year: number | null; posterPath: string | null }[];
  people: { id: number; name: string; profilePath: string | null; department: string | null }[];
  users: { username: string; name: string; image: string | null }[];
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return NextResponse.json({ movies: [], tv: [], people: [], users: [] } satisfies QuickSearchResult);

  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const [tmdb, users] = await Promise.all([
    searchAll(q).catch(() => ({ movies: [], tv: [], people: [] })),
    db
      .select({
        username: schema.user.username,
        displayUsername: schema.user.displayUsername,
        name: schema.user.name,
        image: schema.user.image,
      })
      .from(schema.user)
      .where(
        and(
          isNotNull(schema.user.username),
          or(ilike(schema.user.username, `%${escaped}%`), ilike(schema.user.displayUsername, `%${escaped}%`)),
        ),
      )
      .limit(4),
  ]);

  const body: QuickSearchResult = {
    movies: tmdb.movies.slice(0, 5).map((m) => ({ id: m.id, title: m.title, year: m.year, posterPath: m.posterPath })),
    tv: tmdb.tv.slice(0, 5).map((m) => ({ id: m.id, title: m.title, year: m.year, posterPath: m.posterPath })),
    people: tmdb.people.slice(0, 4).map((p) => ({ id: p.id, name: p.name, profilePath: p.profilePath, department: p.department })),
    users: users.map((u) => ({ username: u.username!, name: u.displayUsername || u.username || u.name, image: u.image })),
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, max-age=60" } });
}
