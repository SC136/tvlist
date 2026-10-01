#!/usr/bin/env node
/**
 * `npm run dev`
 *
 * - If DATABASE_URL is set (env or .env.local / .env), just runs `next dev`.
 * - Otherwise starts an embedded Postgres (PGlite) stored in .data/pglite as a
 *   local TCP server, applies migrations, and runs `next dev` against it.
 *   Zero setup: no Docker, no cloud account needed for local development.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const args = ["dev", ...process.argv.slice(2)];

function readEnvFile(file) {
  const full = path.join(root, file);
  if (!existsSync(full)) return {};
  const out = {};
  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const configured = process.env.DATABASE_URL || readEnvFile(".env.local").DATABASE_URL || readEnvFile(".env").DATABASE_URL;

function runNext(env) {
  const child = spawn(process.execPath, [nextBin, ...args], { stdio: "inherit", env });
  return child;
}

if (configured) {
  const child = runNext(process.env);
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const dataDir = path.join(root, ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir);
  await migrate(drizzle({ client: db }), { migrationsFolder: path.join(root, "drizzle") });

  const port = Number(process.env.PGLITE_PORT ?? 54329);
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  const url = `postgres://postgres:postgres@127.0.0.1:${port}/postgres`;
  console.log(`\n  ▸ Local database (PGlite) ready at ${url}\n    Data is stored in .data/pglite. Set DATABASE_URL to use Neon/Postgres instead.\n`);

  const child = runNext({ ...process.env, DATABASE_URL: url, TVLIST_LOCAL_DB: "1" });
  const shutdown = async (code = 0) => {
    try {
      await server.stop();
      await db.close();
    } finally {
      process.exit(code);
    }
  };
  child.on("exit", (code) => void shutdown(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}
