import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

interface DbOptions {
  /** Postgres connection string. Without it, an embedded PGlite database is used. */
  url?: string;
  /** PGlite data directory. Omit for an in-memory database (tests). */
  dataDir?: string;
  /** Apply pending migrations on connect. */
  migrate?: boolean;
}

/**
 * Connects to Postgres when a URL is given, otherwise to an embedded PGlite
 * database, so `npm run dev` needs no setup.
 */
export async function createDb({ url, dataDir, migrate = true }: DbOptions = {}): Promise<Db> {
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    // Serverless functions each hold their own pool, so keep it small.
    const db = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
    if (migrate) {
      const { migrate: run } = await import("drizzle-orm/node-postgres/migrator");
      await run(db, { migrationsFolder: MIGRATIONS });
    }
    return db as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const db = drizzle(new PGlite(dataDir), { schema });
  if (migrate) {
    const { migrate: run } = await import("drizzle-orm/pglite/migrator");
    await run(db, { migrationsFolder: MIGRATIONS });
  }
  return db as unknown as Db;
}

// Kept on globalThis so Next.js hot reloads don't open a new connection each time.
const globalForDb = globalThis as unknown as { reelMathDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.reelMathDb ??= connectFromEnv();
  return globalForDb.reelMathDb;
}

function connectFromEnv(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (process.env.NODE_ENV === "production") {
    // Hosted filesystems are read-only or wiped between requests, so PGlite would lose data.
    if (!url) throw new Error("DATABASE_URL must be set in production");
    // Production migrations run once at build time (`npm run db:migrate`), not per cold start.
    return createDb({ url, migrate: false });
  }
  return createDb({ url, dataDir: path.join(process.cwd(), ".pglite") });
}

export { schema };
