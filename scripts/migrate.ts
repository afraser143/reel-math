// Applies database migrations. Runs in the Vercel build (`vercel-build`) and in CI.
// In development they also run automatically on the first request.
import { createDb } from "../src/db";

const url = process.env.DATABASE_URL;

// On a host like Vercel, falling back to PGlite would "succeed" against a throwaway
// database and ship a site whose sign-up is broken. Fail the deploy instead.
if (!url && (process.env.VERCEL || process.env.CI)) {
  console.error("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) and redeploy.");
  process.exit(1);
}

createDb({ url, dataDir: url ? undefined : ".pglite" })
  .then(() => {
    console.log(`Migrations applied${url ? "" : " (local PGlite)"}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
