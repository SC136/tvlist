"use server";

import { and, eq, gt, or } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/site";
import { validatePasswordStrength } from "@/lib/validation";
import type { ActionResult } from "./list";

/** Request a password reset link by email or username. */
export async function requestPasswordReset(rawIdentifier: string): Promise<
  ActionResult<{ email: string; resetUrl?: string }>
> {
  const identifier = rawIdentifier.trim().toLowerCase();
  if (!identifier) {
    return { ok: false, error: "Please enter your email or username." };
  }

  const user = await db.query.user.findFirst({
    where: or(eq(schema.user.email, identifier), eq(schema.user.username, identifier)),
  });

  if (!user) {
    // Return friendly generic message to prevent account enumeration
    return {
      ok: true,
      data: { email: identifier },
    };
  }

  // Create verification token (1-hour expiration)
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(schema.verification).values({
    id: crypto.randomUUID(),
    identifier: `reset-password:${token}`,
    value: user.id,
    expiresAt,
  });

  const resetUrl = `${siteUrl()}/reset-password?token=${token}`;

  console.log(`\n==================================================`);
  console.log(`[PASSWORD RESET REQUEST]`);
  console.log(`User: ${user.name} (@${user.username})`);
  console.log(`Email: ${user.email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`==================================================\n`);

  // In development, provide the direct reset URL on screen for convenience
  const isDev = process.env.NODE_ENV !== "production";
  return {
    ok: true,
    data: {
      email: user.email,
      resetUrl: isDev ? resetUrl : undefined,
    },
  };
}

/** Reset password using a valid reset token. */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<ActionResult> {
  if (!token?.trim()) {
    return { ok: false, error: "Missing or invalid reset token." };
  }
  const pwCheck = validatePasswordStrength(newPassword);
  if (!pwCheck.valid) {
    return { ok: false, error: pwCheck.error ?? "Password is too simple." };
  }

  const cleanToken = token.trim();
  const record = await db.query.verification.findFirst({
    where: and(
      eq(schema.verification.identifier, `reset-password:${cleanToken}`),
      gt(schema.verification.expiresAt, new Date()),
    ),
  });

  if (!record) {
    return {
      ok: false,
      error: "This password reset link has expired or is invalid. Please request a new one.",
    };
  }

  const userId = record.value;
  const hashedPassword = await hashPassword(newPassword);

  // Update or insert credential account
  const account = await db.query.account.findFirst({
    where: and(eq(schema.account.userId, userId), eq(schema.account.providerId, "credential")),
  });

  if (account) {
    await db
      .update(schema.account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.account.id, account.id));
  } else {
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });
  }

  // Delete used token so it cannot be reused
  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, `reset-password:${cleanToken}`));

  return { ok: true };
}
