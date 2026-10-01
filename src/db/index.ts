import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

// Connections are lazy, so a missing URL only fails when a query actually runs
// (keeps `next build` working on machines without database access).
const MISSING = "postgres://missing-database-url@127.0.0.1:1/missing";

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV !== "production") {
    console.warn("[tvlist] DATABASE_URL is not set. Use `npm run dev` (starts a local database) or set DATABASE_URL.");
  }
  const client = postgres(url || MISSING, {
    // Neon's pooler (PgBouncer, transaction mode) and the local PGlite server don't support prepared statements.
    prepare: false,
    // The local PGlite server is single-session; one connection keeps queries from interleaving.
    max: process.env.TVLIST_LOCAL_DB ? 1 : 5,
    idle_timeout: 20,
  });
  return drizzle({ client, schema });
}

// One pool per server process, reused across hot reloads in development.
const globalForDb = globalThis as unknown as { __tvlistDb?: Database };

export const db = (globalForDb.__tvlistDb ??= createDb());
export { schema };
