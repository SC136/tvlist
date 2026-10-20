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

export const DEFAULT_PROFILE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "movielist", label: "Movie List" },
  { value: "tvlist", label: "TV List" },
  { value: "animelist", label: "Anime List" },
  { value: "mangalist", label: "Manga List" },
  { value: "booklist", label: "Book List" },
  { value: "musiclist", label: "Music List" },
  { value: "gamelist", label: "Game List" },
  { value: "diary", label: "Diary" },
] as const;

export type DefaultProfileTab = (typeof DEFAULT_PROFILE_TABS)[number]["value"];

export const websiteSchema = z
  .string()
  .trim()
  .max(250)
  .refine((v) => v === "" || /^https?:\/\/[^\s"'<>]+$/i.test(v), "Website must start with http:// or https://")
  .transform((v) => (v === "" ? null : v))
  .nullish();

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyui",
  "qwerty123",
  "admin123",
  "letmein1",
  "iloveyou",
  "welcome1",
  "pass1234",
  "guest123",
  "abc12345",
  "11111111",
  "00000000",
  "87654321",
]);

/**
 * Validates password strength:
 * - At least 8 characters, at most 128
 * - Not a commonly guessed trivial password (e.g. 12345678, password, qwerty123)
 * - Not a single repeated character (e.g. aaaaaaaa, 11111111)
 * - Must contain at least one letter and at least one number or symbol
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password must be at most 128 characters long." };
  }
  const lower = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(lower)) {
    return { valid: false, error: "Password is too common and easily guessed. Please choose a stronger password." };
  }
  if (/^(.)\1+$/.test(password)) {
    return { valid: false, error: "Password cannot consist of a single repeated character." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter." };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number or symbol." };
  }
  return { valid: true };
}

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters long.")
  .superRefine((p, ctx) => {
    const res = validatePasswordStrength(p);
    if (!res.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error ?? "Password is too simple.",
      });
    }
  });

export const textPostSchema = z.string().trim().min(1, "Write something first.").max(5000);
export const replySchema = z.string().trim().min(1, "Write something first.").max(2000);
