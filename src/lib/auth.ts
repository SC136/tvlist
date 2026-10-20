import "server-only";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl, trustedOrigins } from "@/lib/site";
import { USERNAME_PATTERN } from "@/lib/validation";

const socialProviders: BetterAuthOptions["socialProviders"] = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  socialProviders.discord = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  };
}

export const enabledSocialProviders = Object.keys(socialProviders) as ("google" | "discord")[];

/** Social sign-ups arrive without a username; derive a free one they can change later. */
async function generateUsername(seed: string): Promise<string> {
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 16) || "user";
  const padded = base.length < 3 ? `${base}user` : base;
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? padded : `${padded.slice(0, 15)}${Math.floor(Math.random() * 10000)}`;
    const taken = await db.query.user.findFirst({
      where: eq(schema.user.username, candidate),
      columns: { id: true },
    });
    if (!taken) return candidate;
  }
  return `user${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export const auth = betterAuth({
  appName: "Omnilist",
  baseURL: siteUrl(),
  trustedOrigins: trustedOrigins(),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders,
  user: {
    changeEmail: { enabled: true },
    deleteUser: { enabled: true },
    additionalFields: {
      about: { type: "string", required: false, input: false },
      bannerImage: { type: "string", required: false, input: false },
      website: { type: "string", required: false, input: false },
      location: { type: "string", required: false, input: false },
      statusQuote: { type: "string", required: false, input: false },
      defaultTab: { type: "string", required: false, input: false, defaultValue: "overview" },
      profileColor: { type: "string", required: false, input: false, defaultValue: "auto" },
      scoreFormat: { type: "string", required: false, input: false, defaultValue: "POINT_10_DECIMAL" },
      role: { type: "string", required: false, input: false, defaultValue: "user" },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const record = user as typeof user & { username?: string | null; displayUsername?: string | null };
          if (record.username) return { data: user };
          const generated = await generateUsername(record.name || record.email.split("@")[0]);
          return { data: { ...user, username: generated, displayUsername: generated } };
        },
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
      usernameValidator: (value) => USERNAME_PATTERN.test(value),
    }),
    // Must stay last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
