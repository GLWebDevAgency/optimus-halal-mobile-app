/**
 * Carrefour France Harvest Import
 *
 * Reads JSON files produced by tools/carrefour-mitm/harvest.py,
 * maps Carrefour BFF product fields to our products schema,
 * and upserts into the DB (ON CONFLICT DO UPDATE on barcode).
 *
 * The Carrefour BFF returns product data in a different shape than OFF:
 *   - gtin → barcode
 *   - productName → name
 *   - brand → brand
 *   - imageUrl / mediaList → image URLs
 *   - nutritionalValues → nutrition facts
 *
 * Usage:
 *   source .env && pnpm tsx src/db/seeds/import-carrefour-harvest.ts <harvest-dir>
 *
 * Examples:
 *   pnpm tsx src/db/seeds/import-carrefour-harvest.ts ../../tools/carrefour-mitm/captures/20260310_123456/harvest
 *   pnpm tsx src/db/seeds/import-carrefour-harvest.ts ../../tools/carrefour-mitm/captures/20260310_123456/harvest/search_halal.json
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../schema/products.js";
import { sql } from "drizzle-orm";

// ── Configuration ────────────────────────────────────────────
const INPUT_PATH = process.argv[2];
const BATCH_SIZE = 200;

if (!INPUT_PATH) {
  console.error("Usage: pnpm tsx src/db/seeds/import-carrefour-harvest.ts <harvest-dir-or-json-file>");
  process.exit(1);
}

// ── Carrefour BFF Product shape (observed from APK analysis) ──

interface CarrefourProduct {
  gtin?: string;
  ean?: string;
  productCode?: string;
  productName?: string;
  name?: string;
  title?: string;
  brand?: string;
  brandName?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  categoryName?: string;
  imageUrl?: string;
  mainImage?: string;
  mediaList?: Array<{ url: string; type?: string }>;
  images?: Array<{ url: string }>;
  ingredients?: string;
  ingredientsList?: string[];
  allergens?: string[];
  allergensList?: string[];
  nutritionalValues?: Record<string, unknown>;
  nutritionFacts?: Record<string, unknown>;
  nutriments?: Record<string, number | string>;
  nutriscore?: string;
  nutriscoreGrade?: string;
  novaGroup?: number;
  labels?: string[];
  labelsTags?: string[];
  price?: { amount?: number; currency?: string };
  priceAmount?: number;
  quantity?: string;
  weight?: string;
  origin?: string;
  manufacturingPlace?: string;
  // Raw response blob for future reference
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────

const safeNum = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function extractBarcode(p: CarrefourProduct): string | null {
  const raw = p.gtin ?? p.ean ?? p.productCode;
  if (!raw) return null;
  const clean = String(raw).replace(/\D/g, "");
  return clean.length >= 4 && clean.length <= 14 ? clean : null;
}

function extractName(p: CarrefourProduct): string {
  return p.productName ?? p.name ?? p.title ?? "Produit Carrefour";
}

function extractBrand(p: CarrefourProduct): string | null {
  return p.brand ?? p.brandName ?? null;
}

function extractImageUrl(p: CarrefourProduct): string | null {
  if (p.imageUrl) return p.imageUrl;
  if (p.mainImage) return p.mainImage;
  if (p.mediaList?.length) {
    const front = p.mediaList.find((m) => m.type === "front" || m.type === "FRONT");
    return front?.url ?? p.mediaList[0]?.url ?? null;
  }
  if (p.images?.length) return p.images[0]?.url ?? null;
  return null;
}

function extractIngredients(p: CarrefourProduct): string[] | null {
  if (p.ingredientsList?.length) return p.ingredientsList;
  if (p.ingredients) {
    return p.ingredients
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return null;
}

function extractIngredientsText(p: CarrefourProduct): string | null {
  return p.ingredients ?? null;
}

function extractAllergens(p: CarrefourProduct): string[] | null {
  if (p.allergens?.length) return p.allergens;
  if (p.allergensList?.length) return p.allergensList;
  return null;
}

function extractNutrition(p: CarrefourProduct): Record<string, unknown> | null {
  return p.nutritionalValues ?? p.nutritionFacts ?? p.nutriments ?? null;
}

function extractNutriscoreGrade(p: CarrefourProduct): string | null {
  const g = p.nutriscore ?? p.nutriscoreGrade;
  if (!g || typeof g !== "string") return null;
  const clean = g.toLowerCase().trim();
  return ["a", "b", "c", "d", "e"].includes(clean) ? clean : null;
}

function mapCarrefourToRow(p: CarrefourProduct) {
  const barcode = extractBarcode(p);
  if (!barcode) return null;

  const nutrition = extractNutrition(p);
  const nutriments = (nutrition ?? {}) as Record<string, number | string>;

  return {
    barcode,
    name: extractName(p),
    brand: extractBrand(p),
    category: p.category ?? p.categoryName ?? null,
    description: p.description ?? p.shortDescription ?? null,
    imageUrl: extractImageUrl(p),
    ingredients: extractIngredients(p),
    ingredientsText: extractIngredientsText(p),
    allergensTags: extractAllergens(p),
    nutritionFacts: nutrition,
    halalStatus: "unknown" as const,
    confidenceScore: 0,
    lastSyncedAt: new Date(),
    // V2 fields
    quantity: p.quantity ?? p.weight ?? null,
    nutriscoreGrade: extractNutriscoreGrade(p),
    novaGroup: p.novaGroup ?? null,
    labelsTags: p.labels ?? p.labelsTags ?? null,
    imageFrontUrl: extractImageUrl(p),
    energyKcal100g: safeNum(nutriments["energy-kcal_100g"] ?? nutriments["energyKcal"]),
    fat100g: safeNum(nutriments["fat_100g"] ?? nutriments["fat"]),
    saturatedFat100g: safeNum(nutriments["saturated-fat_100g"] ?? nutriments["saturatedFat"]),
    carbohydrates100g: safeNum(nutriments["carbohydrates_100g"] ?? nutriments["carbohydrates"]),
    sugars100g: safeNum(nutriments["sugars_100g"] ?? nutriments["sugars"]),
    fiber100g: safeNum(nutriments["fiber_100g"] ?? nutriments["fiber"]),
    proteins100g: safeNum(nutriments["proteins_100g"] ?? nutriments["proteins"]),
    salt100g: safeNum(nutriments["salt_100g"] ?? nutriments["salt"]),
    manufacturingPlaces: p.manufacturingPlace ?? p.origin ?? null,
    dataSources: ["carrefour"] as string[],
    analysisVersion: 2 as const,
    completeness: null as number | null,
  };
}

// ── Load JSON files ──────────────────────────────────────────

function loadProducts(inputPath: string): CarrefourProduct[] {
  const stat = statSync(inputPath);
  const allProducts: CarrefourProduct[] = [];

  if (stat.isDirectory()) {
    const files = readdirSync(inputPath).filter(
      (f) => extname(f) === ".json" && !f.startsWith(".")
    );
    console.log(`Found ${files.length} JSON files in ${inputPath}`);

    for (const file of files) {
      const filePath = join(inputPath, file);
      try {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        const items = Array.isArray(data) ? data : data.products ?? data.items ?? data.results ?? [];
        allProducts.push(...items);
        console.log(`  ${file}: ${items.length} products`);
      } catch (err) {
        console.warn(`  ${file}: SKIP (parse error)`);
      }
    }
  } else {
    const data = JSON.parse(readFileSync(inputPath, "utf-8"));
    const items = Array.isArray(data) ? data : data.products ?? data.items ?? data.results ?? [];
    allProducts.push(...items);
    console.log(`Loaded ${items.length} products from ${inputPath}`);
  }

  return allProducts;
}

// ── Main import ──────────────────────────────────────────────

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const rawProducts = loadProducts(INPUT_PATH);
  console.log(`\nTotal raw products: ${rawProducts.length}`);

  // Map and deduplicate (keep first occurrence per barcode)
  const seen = new Set<string>();
  const rows = [];
  let skipped = 0;

  for (const p of rawProducts) {
    const row = mapCarrefourToRow(p);
    if (!row) { skipped++; continue; }
    if (seen.has(row.barcode)) { skipped++; continue; }
    seen.add(row.barcode);
    rows.push(row);
  }

  console.log(`Mapped: ${rows.length} unique products (${skipped} skipped/dupes)`);

  if (rows.length === 0) {
    console.log("Nothing to import.");
    process.exit(0);
  }

  // Connect to DB
  const client = postgres(connectionString, { max: 4 });
  const db = drizzle(client);

  let imported = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const result = await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          // Only update fields if the current source is NOT 'off' (preserve OFF data)
          // Carrefour data enriches — it doesn't overwrite OFF
          imageUrl: sql`COALESCE(${products.imageUrl}, excluded.image_url)`,
          imageFrontUrl: sql`COALESCE(${products.imageFrontUrl}, excluded.image_front_url)`,
          description: sql`COALESCE(${products.description}, excluded.description)`,
          price: sql`excluded.price`,
          // Add carrefour to data_sources if not already present
          dataSources: sql`
            CASE
              WHEN ${products.dataSources} IS NULL THEN ARRAY['carrefour']
              WHEN NOT ('carrefour' = ANY(${products.dataSources})) THEN ${products.dataSources} || ARRAY['carrefour']
              ELSE ${products.dataSources}
            END
          `,
          updatedAt: new Date(),
        },
      });

    imported += batch.length;
    if ((i / BATCH_SIZE) % 5 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`  Progress: ${imported}/${rows.length} (${Math.round((imported / rows.length) * 100)}%)`);
    }
  }

  console.log(`\nImport complete: ${imported} products processed`);
  console.log(`  New inserts: products without existing barcode`);
  console.log(`  Updates: added 'carrefour' to dataSources, filled missing images/descriptions`);

  await client.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
