import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Resolve drizzle/ relative to the project root (2 levels up from dist/db/migrate.js)
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "../../drizzle");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

console.log(`Running migrations from ${migrationsFolder}...`);
await migrate(db, { migrationsFolder });
console.log("Migrations applied successfully");

await client.end();
process.exit(0);
