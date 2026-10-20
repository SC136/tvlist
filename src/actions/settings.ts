"use server";

import { refresh } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import {
  DEFAULT_PROFILE_TABS,
  imageUrlSchema,
  PROFILE_COLORS,
  usernameSchema,
  websiteSchema,
} from "@/lib/validation";
import { SCORE_FORMATS } from "@/lib/format";
import type { ActionResult } from "./list";

const tabValues = DEFAULT_PROFILE_TABS.map((t) => t.value) as [string, ...string[]];

const profileInput = z.object({
  displayName: z.string().trim().max(30),
  about: z.string().max(5000),
  image: imageUrlSchema,
  bannerImage: imageUrlSchema,
  profileColor: z.enum(PROFILE_COLORS),
  statusQuote: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(60).nullable().optional(),
  website: websiteSchema,
  defaultTab: z.enum(tabValues).default("overview"),
});

export async function updateProfile(raw: z.input<typeof profileInput>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = profileInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  const display = parsed.data.displayName || viewer.username || viewer.name;
  // The display name may only differ from the username in letter case, so profile URLs stay predictable.
  if (display.toLowerCase() !== (viewer.username ?? "").toLowerCase()) {
    return { ok: false, error: "Display name can only change the capitalisation of your username." };
  }
  await db
    .update(schema.user)
    .set({
      displayUsername: display,
      about: parsed.data.about.trim() || null,
      image: parsed.data.image,
      bannerImage: parsed.data.bannerImage,
      profileColor: parsed.data.profileColor,
      statusQuote: parsed.data.statusQuote?.trim() || null,
      location: parsed.data.location?.trim() || null,
      website: parsed.data.website,
      defaultTab: parsed.data.defaultTab,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, viewer.id));
  refresh();
  return { ok: true };
}

export async function changeUsername(raw: string): Promise<ActionResult<{ username: string }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid username." };
  const username = parsed.data.toLowerCase();
  const taken = await db.query.user.findFirst({
    where: and(eq(schema.user.username, username), ne(schema.user.id, viewer.id)),
    columns: { id: true },
  });
  if (taken) return { ok: false, error: "That username is taken." };
  await db
    .update(schema.user)
    .set({ username, displayUsername: parsed.data, name: parsed.data, updatedAt: new Date() })
    .where(eq(schema.user.id, viewer.id));
  refresh();
  return { ok: true, data: { username } };
}

export async function updateListSettings(raw: { scoreFormat: string }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please log in first." };
  const format = SCORE_FORMATS.find((f) => f.value === raw.scoreFormat)?.value;
  if (!format) return { ok: false, error: "Unknown score format." };
  await db.update(schema.user).set({ scoreFormat: format, updatedAt: new Date() }).where(eq(schema.user.id, viewer.id));
  refresh();
  return { ok: true };
}
