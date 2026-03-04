/**
 * Standalone seed runner for brand-certifier mappings.
 * Usage: pnpm tsx --env-file=.env src/db/seeds/run-brand-certifiers-seed.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { seedBrandCertifiers } from "./seed-brand-certifiers.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  const count = await seedBrandCertifiers(db);
  console.log(`✅ Seeded ${count} brand-certifier mappings`);
} catch (err) {
  console.error("❌ Seed failed:", err);
  process.exit(1);
} finally {
  await client.end();
}
