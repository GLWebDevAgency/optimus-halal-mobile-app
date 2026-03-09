/**
 * Product Lookup Service — DB-first resolution with OFF fallback.
 *
 * With 817K products in DB, 99%+ of scans resolve in <1ms.
 * OFF API is called ONLY for:
 *   1. Unknown barcodes (not in DB)
 *   2. Background refresh of stale products (>7 days, non-blocking)
 *
 * Architecture:
 *   resolveProduct()  → DB lookup → OFF fallback → create/return
 *   refreshProductInBackground() → fire-and-forget OFF re-fetch
 */

import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = PostgresJsDatabase<any>;
import { products } from "../db/schema/index.js";
import type { Product } from "../db/schema/products.js";
import {
  lookupBarcode,
  smartExtractIngredients,
  type OpenFoodFactsProduct,
} from "./barcode.service.js";
import { lookupBrandCertifier } from "./brand-certifier.service.js";
import { logger } from "../lib/logger.js";

// ── Types ─────────────────────────────────────────────────────

export type ProductSource = "db_fresh" | "db_stale" | "off_new" | "off_backfill";

export interface ProductLookupResult {
  product: Product;
  source: ProductSource;
  offData: Record<string, unknown> | null;
}

// ── Constants ─────────────────────────────────────────────────

/** Products older than this are considered stale and eligible for background refresh */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── OFF → Product column mapping (shared between insert & update) ──

const safeNum = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function mapOffToV2Fields(off: OpenFoodFactsProduct) {
  const nutriments = off.nutriments as Record<string, number | string> | undefined;
  return {
    genericName: off.generic_name ?? null,
    brandOwner: off.brand_owner ?? null,
    quantity: off.quantity ?? null,
    servingSize: off.serving_size ?? null,
    countriesTags: off.countries_tags ?? null,
    ingredientsText: off.ingredients_text ?? null,
    allergensTags: off.allergens_tags ?? null,
    tracesTags: off.traces_tags ?? null,
    additivesTags: off.additives_tags ?? null,
    ingredientsAnalysisTags: off.ingredients_analysis_tags ?? null,
    nutriscoreGrade: off.nutriscore_grade ?? null,
    novaGroup: off.nova_group ?? null,
    ecoscoreGrade: off.ecoscore_grade ?? null,
    energyKcal100g: safeNum(nutriments?.["energy-kcal_100g"]),
    fat100g: safeNum(nutriments?.fat_100g),
    saturatedFat100g: safeNum(nutriments?.["saturated-fat_100g"]),
    carbohydrates100g: safeNum(nutriments?.carbohydrates_100g),
    sugars100g: safeNum(nutriments?.sugars_100g),
    fiber100g: safeNum(nutriments?.fiber_100g),
    proteins100g: safeNum(nutriments?.proteins_100g),
    salt100g: safeNum(nutriments?.salt_100g),
    labelsTags: off.labels_tags ?? null,
    embCodes: off.emb_codes ?? null,
    originsTags: off.origins_tags ?? null,
    manufacturingPlaces: off.manufacturing_places ?? null,
    imageIngredientsUrl: off.image_ingredients_url ?? null,
    imageNutritionUrl: off.image_nutrition_url ?? null,
    imageFrontUrl: off.image_front_url ?? null,
    completeness: off.completeness ?? null,
    dataSources: ["off"] as string[],
    offLastModified: off.last_modified_datetime ? new Date(off.last_modified_datetime) : null,
    analysisVersion: 2 as const,
  };
}

// ── Main resolution function ──────────────────────────────────

export async function resolveProduct(
  db: AnyDB,
  barcode: string,
): Promise<ProductLookupResult | null> {
  // 1. DB lookup (0.3ms with index)
  const existing = await (db as any).query.products.findFirst({
    where: eq(products.barcode, barcode),
  }) as Product | undefined;

  if (existing) {
    const hasOffData = existing.offData !== null;
    const age = Date.now() - (existing.lastSyncedAt?.getTime() ?? 0);
    const isFresh = hasOffData && age < STALE_THRESHOLD_MS;

    return {
      product: existing,
      source: isFresh ? "db_fresh" : "db_stale",
      offData: (existing.offData as Record<string, unknown>) ?? null,
    };
  }

  // 2. OFF fallback — only for unknown barcodes
  const offResult = await lookupBarcode(barcode);
  if (!offResult.found || !offResult.product) return null;

  const off = offResult.product;
  const extraction = await smartExtractIngredients(off);

  // 3. Create product in DB
  const [newProduct] = await db
    .insert(products)
    .values({
      barcode,
      name: off.product_name ?? "Produit inconnu",
      brand: off.brands ?? null,
      category: off.categories?.split(",")[0]?.trim() ?? null,
      ingredients: extraction.ingredients.length > 0 ? extraction.ingredients : null,
      imageUrl: off.image_front_url ?? off.image_url ?? null,
      nutritionFacts: off.nutriments ?? null,
      offData: off as unknown as Record<string, unknown>,
      lastSyncedAt: new Date(),
      // Halal status will be set by the caller after analysis
      halalStatus: "unknown",
      confidenceScore: 0,
      ...mapOffToV2Fields(off),
    })
    .returning();

  return {
    product: newProduct,
    source: "off_new",
    offData: off as unknown as Record<string, unknown>,
  };
}

// ── Background refresh for stale products ─────────────────────

export function refreshProductInBackground(
  db: AnyDB,
  barcode: string,
  productId: string,
): void {
  // Fire-and-forget — don't block the scan response
  lookupBarcode(barcode)
    .then(async (result) => {
      if (!result.found || !result.product) return;
      const off = result.product;

      await db
        .update(products)
        .set({
          name: off.product_name ?? undefined,
          brand: off.brands ?? undefined,
          imageUrl: off.image_front_url ?? off.image_url ?? undefined,
          nutritionFacts: off.nutriments ?? undefined,
          offData: off as unknown as Record<string, unknown>,
          lastSyncedAt: new Date(),
          ...mapOffToV2Fields(off),
        })
        .where(eq(products.id, productId));

      logger.info("Background product refresh completed", { barcode, productId });
    })
    .catch((err) => {
      logger.warn("Background product refresh failed", {
        barcode,
        error: err instanceof Error ? err.message : String(err),
      });
    });
}

// ── Backfill legacy product with OFF data ─────────────────────

export async function backfillProductFromOff(
  db: AnyDB,
  product: Product,
): Promise<{ product: Product; offData: Record<string, unknown> }> {
  const offResult = await lookupBarcode(product.barcode);
  if (!offResult.found || !offResult.product) {
    return { product, offData: (product.offData as Record<string, unknown>) ?? {} };
  }

  const off = offResult.product;
  const offData = off as unknown as Record<string, unknown>;

  await db
    .update(products)
    .set({
      offData: off as unknown as Record<string, unknown>,
      name: off.product_name ?? product.name,
      brand: off.brands ?? product.brand,
      imageUrl: off.image_front_url ?? off.image_url ?? product.imageUrl,
      nutritionFacts: off.nutriments ?? product.nutritionFacts,
      lastSyncedAt: new Date(),
      ...mapOffToV2Fields(off),
    })
    .where(eq(products.id, product.id));

  const updatedProduct: Product = {
    ...product,
    offData: offData as any,
    name: off.product_name ?? product.name,
    brand: off.brands ?? product.brand,
    imageUrl: off.image_front_url ?? off.image_url ?? product.imageUrl,
    nutritionFacts: (off.nutriments ?? product.nutritionFacts) as any,
  };

  logger.info("Legacy product backfilled with OFF data", {
    barcode: product.barcode,
    productId: product.id,
  });

  return { product: updatedProduct, offData };
}

export { mapOffToV2Fields };
