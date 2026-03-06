/**
 * Boycott seed adapter — called by run-all.ts
 *
 * Upserts on company_name (unique business key) so re-running
 * the seed updates existing rows instead of creating duplicates.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { BDS_SEED_DATA } from "./boycott-bds.js";
import { boycottTargets } from "../schema/boycott.js";

export async function seedBoycottTargets(db: PostgresJsDatabase): Promise<number> {
  // Clean slate — seed data is the single source of truth.
  // This also removes duplicates left by previous broken seeds.
  await db.delete(boycottTargets);

  // Insert all entries fresh (no conflict possible on empty table).
  // Future runs with the unique index on company_name will also
  // land here safely since we delete first.
  await db.insert(boycottTargets).values(BDS_SEED_DATA);

  return BDS_SEED_DATA.length;
}
