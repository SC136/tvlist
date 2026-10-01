#!/usr/bin/env node
/**
 * Build step used by Vercel (`vercel-build` in package.json).
 *
 *  1. On PRODUCTION deploys, apply any pending database migrations first.
 *     A failed migration fails the deploy, so a broken schema never goes live.
 *     (Preview deploys never touch the database unless RUN_MIGRATIONS=1.)
 *  2. Run `next build`.
 *
 * Migrations use the direct (non-pooled) connection: DATABASE_URL_UNPOOLED if set,
 * otherwise DATABASE_URL with Neon's "-pooler" host suffix removed.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = process.cwd();

function run(label, script, args, env = process.env) {
  console.log(`\n▸ ${label}`);
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: "inherit", env });
  if (result.status !== 0) {
    console.error(`\n✖ ${label} failed (exit ${result.status ?? "signal"}).`);
    process.exit(result.status ?? 1);
  }
}

// Production deploys must be fully configured: fail fast with a clear message
// instead of shipping a site whose login or database is broken.
if (process.env.VERCEL_ENV === "production") {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL (Neon pooled connection string)");
  if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) missing.push("BETTER_AUTH_SECRET (random string, 32+ characters)");
  if (missing.length) {
    const list = missing.map((m) => `  - ${m}`).join("\n");
    console.error(
      `\n✖ Missing required environment variables for a production deploy:\n${list}\n` +
        "Add them in Vercel → Project → Settings → Environment Variables, then redeploy.",
    );
    process.exit(1);
  }
  if (!process.env.TMDB_API_KEY) console.warn("\n⚠ TMDB_API_KEY is not set: the site will show only a small demo catalog.");
  if (!process.env.CRON_SECRET) console.warn("\n⚠ CRON_SECRET is not set: the daily airing-notification job will refuse to run.");
}

const shouldMigrate = process.env.VERCEL_ENV === "production" || process.env.RUN_MIGRATIONS === "1";
const pooled = process.env.DATABASE_URL ?? "";
const direct = process.env.DATABASE_URL_UNPOOLED || pooled.replace("-pooler", "");

if (shouldMigrate && direct) {
  run("Applying database migrations", path.join(root, "node_modules", "drizzle-kit", "bin.cjs"), ["migrate"], {
    ...process.env,
    DATABASE_URL: direct,
  });
} else if (shouldMigrate) {
  console.warn("\n⚠ Skipping migrations: DATABASE_URL is not set for this environment.");
} else {
  console.log("\n▸ Skipping migrations (only run on production deploys; set RUN_MIGRATIONS=1 to force).");
}

run("Building Next.js", require.resolve("next/dist/bin/next"), ["build"]);
