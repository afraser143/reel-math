// Applies database migrations. Runs automatically on first request too; this is for CI and deploys.
import { createDb } from "../src/db";

createDb({ url: process.env.DATABASE_URL, dataDir: process.env.DATABASE_URL ? undefined : ".pglite" })
  .then(() => {
    console.log("Migrations applied");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
