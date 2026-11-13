import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/**
 * Connects to Postgres when DATABASE_URL is set, otherwise to an embedded
 * PGlite database, so `npm run dev` needs no setup. Migrations run on first use.
 */
export async function createDb(opts: { url?: string; dataDir?: string } = {}): Promise<Db> {
  if (opts.url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(new Pool({ connectionString: opts.url }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  // No dataDir means in-memory, which the tests use.
  const db = drizzle(new PGlite(opts.dataDir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

// Kept on globalThis so Next.js hot reloads don't open a new connection each time.
const globalForDb = globalThis as unknown as { reelMathDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.reelMathDb ??= createDb({
    url: process.env.DATABASE_URL,
    dataDir: path.join(process.cwd(), ".pglite"),
  });
  return globalForDb.reelMathDb;
}

export { schema };
