/**
 * One-time script: seed reference data on Railway DB
 *
 * Usage:
 *   DATABASE_URL=<railway_public_url> pnpm tsx src/db/seeds/_seed-railway.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { seedReferenceData } from "./run-all.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

console.log("━━━ Seeding reference data on Railway DB ━━━\n");

try {
  const stats = await seedReferenceData(db);
  console.log("\n✅ Done");
  console.log(JSON.stringify(stats, null, 2));
} catch (err) {
  console.error("❌ Seed failed:", err);
} finally {
  await client.end();
}
