import "server-only";
import { and, count, eq, gt } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";

/**
 * Simple DB-backed write throttle: true when the user created fewer than
 * `max` rows in `table` during the last `windowSeconds`.
 */
export async function withinLimit(
  table: PgTable & { userId: PgColumn; createdAt: PgColumn },
  userId: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(table)
    .where(and(eq(table.userId, userId), gt(table.createdAt, new Date(Date.now() - windowSeconds * 1000))));
  return (row?.n ?? 0) < max;
}
