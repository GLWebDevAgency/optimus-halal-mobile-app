/**
 * Ingredient Rulings seed adapter — called by run-all.ts
 *
 * Loads 47 scholarly-sourced halal rulings for ingredient detection engine v4.
 * Uses DELETE + batch INSERT (reference data managed entirely by seed).
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ingredientRulings } from "../schema/index.js";

export async function seedIngredientRulings(
  db: PostgresJsDatabase,
): Promise<number> {
  const { ingredientRulingsSeed } = await import(
    "./ingredient-rulings-seed.js"
  );

  // Reference data — safe to replace entirely on each deploy
  await db.delete(ingredientRulings);

  let count = 0;
  for (const ruling of ingredientRulingsSeed) {
    await db.insert(ingredientRulings).values(ruling);
    count++;
  }

  return count;
}
