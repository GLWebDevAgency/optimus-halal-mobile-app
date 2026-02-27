/**
 * Standalone seed runner for ingredient rulings.
 * Usage: DATABASE_URL="..." pnpm tsx src/db/seeds/run-ingredient-rulings-seed.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { seedIngredientRulings } from "./seed-ingredient-rulings.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  const count = await seedIngredientRulings(db);
  console.log(`✅ Seeded ${count} ingredient rulings`);
} catch (err) {
  console.error("❌ Seed failed:", err);
  process.exit(1);
} finally {
  await client.end();
}
