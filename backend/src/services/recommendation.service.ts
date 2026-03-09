/**
 * Recommendation Service — Smart alternatives engine.
 *
 * Finds halal alternative products in the same category, filtered by
 * user allergens and dietary preferences, sorted by halal status + health score.
 *
 * Uses existing DB indexes:
 *   - products_category_idx (btree on category)
 *   - products_halal_status_idx (btree on halalStatus)
 *   - products_allergens_gin_idx (GIN on allergensTags)
 */

import { type SQL, sql, eq, and, ne, desc, not, arrayOverlaps, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { products } from "../db/schema/index.js";
import type * as schema from "../db/schema/index.js";

// ── Types ───────────────────────────────────────────────────

export interface RecommendationInput {
  /** Product to find alternatives for */
  productId: string;
  productCategory: string | null;
  productCategoryId: string | null;
  productBarcode: string | null;
  /** User allergen tags (e.g., ["en:gluten", "en:milk"]) */
  userAllergens?: string[];
  /** Dietary filters — only return products matching these */
  userDietaryPrefs?: {
    glutenFree?: boolean;
    lactoseFree?: boolean;
    palmOilFree?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
  };
  limit: number;
}

export interface AlternativeProduct {
  id: string;
  barcode: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string | null;
  confidenceScore: number | null;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
}

// ── Main Function ───────────────────────────────────────────

/**
 * Find alternative products for a given product.
 *
 * Algorithm:
 *   1. Same categoryId or category text
 *   2. Exclude current product (by id)
 *   3. Exclude products with user allergens (GIN overlap)
 *   4. Sort: best NutriScore (A→E) → highest confidence
 *   5. Limit results
 */
export async function findAlternatives(
  db: PostgresJsDatabase<typeof schema>,
  input: RecommendationInput,
): Promise<AlternativeProduct[]> {
  const conditions: SQL[] = [];

  // Category match: prefer categoryId, fallback to category text
  if (input.productCategoryId) {
    conditions.push(eq(products.categoryId, input.productCategoryId));
  } else if (input.productCategory) {
    conditions.push(eq(products.category, input.productCategory));
  } else {
    return []; // no category to match on
  }

  // Exclude current product
  conditions.push(ne(products.id, input.productId));

  // Only halal products
  conditions.push(eq(products.halalStatus, "halal"));

  // Exclude products that overlap with user allergens (null-safe: NULL allergensTags are excluded)
  if (input.userAllergens && input.userAllergens.length > 0) {
    conditions.push(isNotNull(products.allergensTags));
    conditions.push(
      not(arrayOverlaps(products.allergensTags, input.userAllergens))
    );
  }

  // Filter by dietary analysis tags (from OFF ingredientsAnalysisTags)
  if (input.userDietaryPrefs?.vegan) {
    conditions.push(
      sql`${products.ingredientsAnalysisTags} @> ARRAY['en:vegan']::text[]`
    );
  } else if (input.userDietaryPrefs?.vegetarian) {
    conditions.push(
      sql`${products.ingredientsAnalysisTags} @> ARRAY['en:vegetarian']::text[]`
    );
  }
  if (input.userDietaryPrefs?.palmOilFree) {
    conditions.push(
      sql`NOT (${products.ingredientsAnalysisTags} && ARRAY['en:palm-oil']::text[])`
    );
  }
  // Gluten-free: exclude products with gluten allergen tag
  if (input.userDietaryPrefs?.glutenFree) {
    conditions.push(
      sql`NOT (${products.allergensTags} && ARRAY['en:gluten']::text[]) OR ${products.allergensTags} IS NULL`
    );
  }
  // Lactose-free: exclude products with milk allergen tag
  if (input.userDietaryPrefs?.lactoseFree) {
    conditions.push(
      sql`NOT (${products.allergensTags} && ARRAY['en:milk']::text[]) OR ${products.allergensTags} IS NULL`
    );
  }

  const results = await db
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      brand: products.brand,
      imageUrl: products.imageUrl,
      halalStatus: products.halalStatus,
      confidenceScore: products.confidenceScore,
      nutriscoreGrade: products.nutriscoreGrade,
      novaGroup: products.novaGroup,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(
      // Best NutriScore first (A < B < … < E), then highest confidence
      sql`${products.nutriscoreGrade} ASC NULLS LAST`,
      desc(products.confidenceScore),
    )
    .limit(input.limit);

  return results;
}
