"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import type { ActionResult } from "./list";

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  await db
    .update(schema.notification)
    .set({ read: true })
    .where(and(eq(schema.notification.userId, viewer.id), eq(schema.notification.read, false)));
  refresh();
  return { ok: true };
}

export async function clearNotifications(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  await db.delete(schema.notification).where(eq(schema.notification.userId, viewer.id));
  refresh();
  return { ok: true };
}
