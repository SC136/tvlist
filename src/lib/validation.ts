import { z } from "zod";
import { PALETTE_IDS } from "@/lib/palettes";

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export const usernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, "3–20 characters: letters, numbers and underscores only.");

/** Accepts empty (cleared) or an https image URL. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\/[^\s"'<>]+$/i.test(v), "Must be an https:// URL.")
  .transform((v) => (v === "" ? null : v));

/** Profile colours are the site palettes, plus "auto" (follow whatever palette the visitor uses). */
export const PROFILE_COLORS = ["auto", ...PALETTE_IDS] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];

/** CSS class that re-tints a subtree with a profile colour ("" = leave as the visitor's palette). */
export function profileAccentClass(color: string | null | undefined): string {
  return color && color !== "auto" && (PALETTE_IDS as readonly string[]).includes(color) ? `accent-${color}` : "";
}

export const textPostSchema = z.string().trim().min(1, "Write something first.").max(5000);
export const replySchema = z.string().trim().min(1, "Write something first.").max(2000);
