import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export type Viewer = typeof schema.user.$inferSelect;

/**
 * The signed-in user's full row (fresh from the DB, so profile edits show
 * immediately), or null. Deduped per request.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const row = await db.query.user.findFirst({ where: eq(schema.user.id, session.user.id) });
  return row ?? null;
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export function isModerator(viewer: Pick<Viewer, "role"> | null | undefined): boolean {
  return viewer?.role === "admin" || viewer?.role === "moderator";
}

/** The minimal, serializable viewer shape passed to client feed components. */
export function toFeedViewer(viewer: Viewer | null) {
  if (!viewer) return null;
  return {
    id: viewer.id,
    username: viewer.username ?? "",
    name: viewer.displayUsername || viewer.username || viewer.name,
    image: viewer.image,
    moderator: isModerator(viewer),
  };
}

export function displayName(u: { displayUsername?: string | null; username?: string | null; name?: string | null }): string {
  return u.displayUsername || u.username || u.name || "user";
}
