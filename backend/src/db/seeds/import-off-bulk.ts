/**
 * OFF Bulk Import Pipeline
 *
 * Streams the OpenFoodFacts worldwide CSV (~1.17GB gzipped, ~4.4M products),
 * filters for French products with completeness > 0.3, and batch-upserts
 * into the products table using the V2 schema.
 *
 * Features:
 *   - Streaming decompression (zlib) → readline → batch insert
 *   - Memory-efficient: never loads more than one batch (~500 rows) in RAM
 *   - Pre-computes basic halal status from labels + ingredients keywords
 *   - Builds nutrition_facts JSONB from denormalized CSV columns
 *   - Upsert on barcode (ON CONFLICT DO UPDATE)
 *   - Progress reporting every 10K rows
 *
 * Usage:
 *   source .env && pnpm tsx src/db/seeds/import-off-bulk.ts [path-to-csv.gz]
 *
 * Default path: /tmp/off-products.csv.gz
 */

import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../schema/products.js";
import { sql } from "drizzle-orm";

// ── Configuration ────────────────────────────────────────────
const CSV_PATH = process.argv[2] || "/tmp/off-products.csv.gz";
const BATCH_SIZE = 500; // 500 rows × ~42 cols = ~21K params (well under PG's 65K limit)
const MIN_COMPLETENESS = 0.3;
const COUNTRY_FILTER = "en:france";

// ── Column index mapping (from OFF CSV headers) ──────────────
// These are populated dynamically from the header row
interface ColMap {
  code: number;
  product_name: number;
  generic_name: number;
  brands: number;
  brand_owner: number;
  quantity: number;
  serving_size: number;
  countries_tags: number;
  categories: number;
  ingredients_text: number;
  allergens: number;
  traces_tags: number;
  additives_tags: number;
  ingredients_analysis_tags: number;
  nutriscore_grade: number;
  nova_group: number;
  labels_tags: number;
  emb_codes: number;
  origins_tags: number;
  manufacturing_places: number;
  image_url: number;
  image_ingredients_url: number;
  image_nutrition_url: number;
  completeness: number;
  last_modified_datetime: number;
  // Nutrition columns (use dashes in CSV headers)
  "energy-kcal_100g": number;
  fat_100g: number;
  "saturated-fat_100g": number;
  carbohydrates_100g: number;
  sugars_100g: number;
  fiber_100g: number;
  proteins_100g: number;
  salt_100g: number;
  // Ecoscore
  environmental_score_grade: number;
}

// ── Helpers ──────────────────────────────────────────────────

/** Parse comma-separated tags into string array, filtering empty values */
function parseTags(raw: string): string[] | null {
  if (!raw || raw.trim() === "") return null;
  const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
  return tags.length > 0 ? tags : null;
}

/** Safe float parse — returns null for empty/NaN */
function safeFloat(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/** Safe int parse */
function safeInt(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Truncate string to max length, return null if empty */
function safeStr(raw: string, maxLen: number): string | null {
  if (!raw || raw.trim() === "") return null;
  return raw.trim().substring(0, maxLen);
}

/** Parse ISO datetime to Date, null if invalid */
function safeDate(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}

// ── Halal status detection (same logic as seed-dev-products.ts) ──

const HARAM_KEYWORDS = [
  "porc", "pork", "lard", "saindoux", "gelatine de porc",
  "gelatine porcine", "jambon", "ham", "bacon", "chorizo",
  "saucisson", "cervelas", "rillettes de porc", "porcine",
  "pig", "schwein", "cochon",
];

const DOUBTFUL_KEYWORDS = [
  "gelatine", "e120", "e441", "e471", "e472",
  "presure animale", "carmin", "cochenille",
  "shellac", "e904", "e542",
];

function detectHalalStatus(
  ingredientsText: string,
  labelsTags: string[] | null,
  additivesTags: string[] | null,
): { status: "halal" | "haram" | "doubtful" | "unknown"; confidence: number } {
  // 1. Halal label → halal
  if (labelsTags?.some((l) => l.includes("halal"))) {
    return { status: "halal", confidence: 0.85 };
  }

  const lowerIngredients = ingredientsText.toLowerCase();

  // 2. Haram keywords in ingredients
  if (HARAM_KEYWORDS.some((kw) => lowerIngredients.includes(kw))) {
    return { status: "haram", confidence: 0.9 };
  }

  // 3. Doubtful keywords in ingredients or additives
  const hasDubious = DOUBTFUL_KEYWORDS.some((kw) => lowerIngredients.includes(kw));
  const hasDubiousAdditive = additivesTags?.some((t) =>
    ["en:e120", "en:e441", "en:e471", "en:e472", "en:e904", "en:e542"].includes(t)
  );
  if (hasDubious || hasDubiousAdditive) {
    return { status: "doubtful", confidence: 0.55 };
  }

  return { status: "unknown", confidence: 0 };
}

// ── Build column map from header row ─────────────────────────

function buildColMap(headers: string[]): ColMap {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => { idx[h] = i; });

  const required = ["code", "product_name", "completeness", "countries_tags"];
  for (const r of required) {
    if (idx[r] === undefined) {
      throw new Error(`Required column "${r}" not found in CSV headers`);
    }
  }

  return {
    code: idx["code"],
    product_name: idx["product_name"],
    generic_name: idx["generic_name"],
    brands: idx["brands"],
    brand_owner: idx["brand_owner"],
    quantity: idx["quantity"],
    serving_size: idx["serving_size"],
    countries_tags: idx["countries_tags"],
    categories: idx["categories"],
    ingredients_text: idx["ingredients_text"],
    allergens: idx["allergens"],
    traces_tags: idx["traces_tags"],
    additives_tags: idx["additives_tags"],
    ingredients_analysis_tags: idx["ingredients_analysis_tags"],
    nutriscore_grade: idx["nutriscore_grade"],
    nova_group: idx["nova_group"],
    labels_tags: idx["labels_tags"],
    emb_codes: idx["emb_codes"],
    origins_tags: idx["origins_tags"],
    manufacturing_places: idx["manufacturing_places"],
    image_url: idx["image_url"],
    image_ingredients_url: idx["image_ingredients_url"],
    image_nutrition_url: idx["image_nutrition_url"],
    completeness: idx["completeness"],
    last_modified_datetime: idx["last_modified_datetime"],
    "energy-kcal_100g": idx["energy-kcal_100g"],
    fat_100g: idx["fat_100g"],
    "saturated-fat_100g": idx["saturated-fat_100g"],
    carbohydrates_100g: idx["carbohydrates_100g"],
    sugars_100g: idx["sugars_100g"],
    fiber_100g: idx["fiber_100g"],
    proteins_100g: idx["proteins_100g"],
    salt_100g: idx["salt_100g"],
    environmental_score_grade: idx["environmental_score_grade"] ?? idx["ecoscore_grade"],
  };
}

// ── Row → product record ─────────────────────────────────────

function rowToProduct(fields: string[], cols: ColMap) {
  const get = (i: number | undefined) => (i !== undefined && i < fields.length) ? fields[i] : "";

  const barcode = get(cols.code).trim();
  if (!barcode || barcode.length < 4 || barcode.length > 50) return null;

  const name = safeStr(get(cols.product_name), 255);
  if (!name) return null; // Skip products without a name

  const ingredientsText = get(cols.ingredients_text).trim() || null;
  const labelsTags = parseTags(get(cols.labels_tags));
  const additivesTags = parseTags(get(cols.additives_tags));
  const allergensTags = parseTags(get(cols.allergens));
  const tracesTags = parseTags(get(cols.traces_tags));

  // Halal analysis
  const { status: halalStatus, confidence } = detectHalalStatus(
    ingredientsText ?? "",
    labelsTags,
    additivesTags,
  );

  // V1 ingredients array (split text on comma for backward compat)
  const ingredientsList = ingredientsText
    ? ingredientsText.split(",").map((i) => i.trim()).filter(Boolean).slice(0, 100)
    : null;

  // Build nutrition_facts JSONB for V1 compat
  const energyKcal = safeFloat(get(cols["energy-kcal_100g"]));
  const fat = safeFloat(get(cols.fat_100g));
  const saturatedFat = safeFloat(get(cols["saturated-fat_100g"]));
  const carbs = safeFloat(get(cols.carbohydrates_100g));
  const sugars = safeFloat(get(cols.sugars_100g));
  const fiber = safeFloat(get(cols.fiber_100g));
  const proteins = safeFloat(get(cols.proteins_100g));
  const salt = safeFloat(get(cols.salt_100g));

  const nutritionFacts: Record<string, number> = {};
  if (energyKcal !== null) nutritionFacts["energy-kcal_100g"] = energyKcal;
  if (fat !== null) nutritionFacts["fat_100g"] = fat;
  if (saturatedFat !== null) nutritionFacts["saturated-fat_100g"] = saturatedFat;
  if (carbs !== null) nutritionFacts["carbohydrates_100g"] = carbs;
  if (sugars !== null) nutritionFacts["sugars_100g"] = sugars;
  if (fiber !== null) nutritionFacts["fiber_100g"] = fiber;
  if (proteins !== null) nutritionFacts["proteins_100g"] = proteins;
  if (salt !== null) nutritionFacts["salt_100g"] = salt;

  const brand = safeStr(get(cols.brands), 255);
  const category = get(cols.categories)
    ? safeStr(get(cols.categories).split(",")[0]?.trim() ?? "", 100)
    : null;
  const imageUrl = safeStr(get(cols.image_url), 2000);

  return {
    barcode,
    name,
    brand,
    category,
    ingredients: ingredientsList,
    imageUrl,
    nutritionFacts: Object.keys(nutritionFacts).length > 0 ? nutritionFacts : null,
    halalStatus,
    confidenceScore: confidence,
    lastSyncedAt: new Date(),

    // ── V2 columns ──
    genericName: safeStr(get(cols.generic_name), 500),
    brandOwner: safeStr(get(cols.brand_owner), 255),
    quantity: safeStr(get(cols.quantity), 100),
    servingSize: safeStr(get(cols.serving_size), 100),
    countriesTags: parseTags(get(cols.countries_tags)),
    ingredientsText: ingredientsText ? ingredientsText.substring(0, 10000) : null,
    allergensTags,
    tracesTags,
    additivesTags,
    ingredientsAnalysisTags: parseTags(get(cols.ingredients_analysis_tags)),
    nutriscoreGrade: safeStr(get(cols.nutriscore_grade), 1),
    novaGroup: safeInt(get(cols.nova_group)),
    ecoscoreGrade: safeStr(get(cols.environmental_score_grade), 1),
    energyKcal100g: energyKcal,
    fat100g: fat,
    saturatedFat100g: saturatedFat,
    carbohydrates100g: carbs,
    sugars100g: sugars,
    fiber100g: fiber,
    proteins100g: proteins,
    salt100g: salt,
    labelsTags,
    embCodes: safeStr(get(cols.emb_codes), 255),
    originsTags: parseTags(get(cols.origins_tags)),
    manufacturingPlaces: safeStr(get(cols.manufacturing_places), 500),
    imageFrontUrl: imageUrl, // image_url = front image in CSV
    imageIngredientsUrl: safeStr(get(cols.image_ingredients_url), 2000),
    imageNutritionUrl: safeStr(get(cols.image_nutrition_url), 2000),
    completeness: safeFloat(get(cols.completeness)),
    dataSources: ["off"],
    offLastModified: safeDate(get(cols.last_modified_datetime)),
    analysisVersion: 1,
  };
}

// ── Deduplicate batch (same barcode twice in one batch) ──────

function deduplicateBatch(
  batch: NonNullable<ReturnType<typeof rowToProduct>>[],
): NonNullable<ReturnType<typeof rowToProduct>>[] {
  const map = new Map<string, NonNullable<ReturnType<typeof rowToProduct>>>();
  for (const row of batch) {
    const existing = map.get(row.barcode);
    if (!existing || (row.completeness ?? 0) > (existing.completeness ?? 0)) {
      map.set(row.barcode, row);
    }
  }
  return Array.from(map.values());
}

// ── Batch upsert ─────────────────────────────────────────────

async function upsertBatch(
  db: ReturnType<typeof drizzle>,
  batch: NonNullable<ReturnType<typeof rowToProduct>>[],
) {
  if (batch.length === 0) return 0;

  await db
    .insert(products)
    .values(batch)
    .onConflictDoUpdate({
      target: products.barcode,
      set: {
        name: sql`excluded.name`,
        brand: sql`excluded.brand`,
        category: sql`excluded.category`,
        ingredients: sql`excluded.ingredients`,
        imageUrl: sql`excluded.image_url`,
        nutritionFacts: sql`excluded.nutrition_facts`,
        halalStatus: sql`excluded.halal_status`,
        confidenceScore: sql`excluded.confidence_score`,
        lastSyncedAt: sql`excluded.last_synced_at`,
        // V2
        genericName: sql`excluded.generic_name`,
        brandOwner: sql`excluded.brand_owner`,
        quantity: sql`excluded.quantity`,
        servingSize: sql`excluded.serving_size`,
        countriesTags: sql`excluded.countries_tags`,
        ingredientsText: sql`excluded.ingredients_text`,
        allergensTags: sql`excluded.allergens_tags`,
        tracesTags: sql`excluded.traces_tags`,
        additivesTags: sql`excluded.additives_tags`,
        ingredientsAnalysisTags: sql`excluded.ingredients_analysis_tags`,
        nutriscoreGrade: sql`excluded.nutriscore_grade`,
        novaGroup: sql`excluded.nova_group`,
        ecoscoreGrade: sql`excluded.ecoscore_grade`,
        energyKcal100g: sql`excluded.energy_kcal_100g`,
        fat100g: sql`excluded.fat_100g`,
        saturatedFat100g: sql`excluded.saturated_fat_100g`,
        carbohydrates100g: sql`excluded.carbohydrates_100g`,
        sugars100g: sql`excluded.sugars_100g`,
        fiber100g: sql`excluded.fiber_100g`,
        proteins100g: sql`excluded.proteins_100g`,
        salt100g: sql`excluded.salt_100g`,
        labelsTags: sql`excluded.labels_tags`,
        embCodes: sql`excluded.emb_codes`,
        originsTags: sql`excluded.origins_tags`,
        manufacturingPlaces: sql`excluded.manufacturing_places`,
        imageFrontUrl: sql`excluded.image_front_url`,
        imageIngredientsUrl: sql`excluded.image_ingredients_url`,
        imageNutritionUrl: sql`excluded.image_nutrition_url`,
        completeness: sql`excluded.completeness`,
        dataSources: sql`excluded.data_sources`,
        offLastModified: sql`excluded.off_last_modified`,
        analysisVersion: sql`excluded.analysis_version`,
        updatedAt: sql`now()`,
      },
    });

  return batch.length;
}

// ── Main pipeline ────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required. Run: source .env && pnpm tsx src/db/seeds/import-off-bulk.ts");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║     Naqiy OFF Bulk Import Pipeline                  ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Source : ${CSV_PATH.substring(0, 42).padEnd(42)} ║`);
  console.log(`║  Filter : ${COUNTRY_FILTER}, completeness > ${MIN_COMPLETENESS}       ║`);
  console.log(`║  Batch  : ${BATCH_SIZE} rows per INSERT                      ║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const client = postgres(url, { max: 4 });
  const db = drizzle(client);

  // Stats
  let totalRows = 0;
  let filteredIn = 0;
  let upserted = 0;
  let skippedNoName = 0;
  let skippedCountry = 0;
  let skippedCompleteness = 0;
  let batchErrors = 0;
  const halalCounts = { halal: 0, haram: 0, doubtful: 0, unknown: 0 };
  const startTime = Date.now();

  // Streaming pipeline
  const fileStream = createReadStream(CSV_PATH);
  const gunzip = createGunzip();
  const rl = createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity,
  });

  let cols: ColMap | null = null;
  let batch: NonNullable<ReturnType<typeof rowToProduct>>[] = [];

  for await (const line of rl) {
    // First line = headers
    if (!cols) {
      const headers = line.split("\t");
      cols = buildColMap(headers);
      console.log(`[HEADERS] ${headers.length} columns parsed\n`);
      continue;
    }

    totalRows++;
    const fields = line.split("\t");

    // ── Filter 1: Country ──
    const countriesRaw = fields[cols.countries_tags] ?? "";
    if (!countriesRaw.includes(COUNTRY_FILTER)) {
      skippedCountry++;
      // Progress on total rows (including skipped)
      if (totalRows % 500000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`  [SCAN] ${(totalRows / 1000).toFixed(0)}K rows scanned, ${filteredIn} FR matched (${elapsed}s)`);
      }
      continue;
    }

    // ── Filter 2: Completeness ──
    const completenessRaw = fields[cols.completeness] ?? "";
    const completeness = parseFloat(completenessRaw);
    if (!Number.isFinite(completeness) || completeness < MIN_COMPLETENESS) {
      skippedCompleteness++;
      continue;
    }

    // ── Transform row ──
    const product = rowToProduct(fields, cols);
    if (!product) {
      skippedNoName++;
      continue;
    }

    filteredIn++;
    halalCounts[product.halalStatus]++;
    batch.push(product);

    // ── Flush batch ──
    if (batch.length >= BATCH_SIZE) {
      // Deduplicate within batch (keep highest completeness)
      const deduped = deduplicateBatch(batch);
      try {
        await upsertBatch(db, deduped);
        upserted += deduped.length;
      } catch (err) {
        batchErrors++;
        console.error(`  [ERROR] Batch ${Math.floor(upserted / BATCH_SIZE) + 1}: ${(err as Error).message.substring(0, 200)}`);
      }
      batch = [];

      // Progress every 10K upserted
      if (upserted % 10000 < BATCH_SIZE) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const rate = (upserted / ((Date.now() - startTime) / 1000)).toFixed(0);
        console.log(
          `  [PROGRESS] ${upserted.toLocaleString()} upserted | ` +
          `${totalRows.toLocaleString()} scanned | ${rate}/s | ${elapsed}s`
        );
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const deduped = deduplicateBatch(batch);
    try {
      await upsertBatch(db, deduped);
      upserted += deduped.length;
    } catch (err) {
      batchErrors++;
      console.error(`  [ERROR] Final batch: ${(err as Error).message.substring(0, 500)}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                 IMPORT COMPLETE                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Total rows scanned  : ${totalRows.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Skipped (country)   : ${skippedCountry.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Skipped (complet.)  : ${skippedCompleteness.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Skipped (no name)   : ${skippedNoName.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Filtered in (FR)    : ${filteredIn.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Upserted to DB      : ${upserted.toLocaleString().padStart(12)}               ║`);
  console.log(`║  Batch errors        : ${batchErrors.toLocaleString().padStart(12)}               ║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Halal Analysis                                     ║");
  console.log(`║    halal    : ${halalCounts.halal.toLocaleString().padStart(10)}                         ║`);
  console.log(`║    haram    : ${halalCounts.haram.toLocaleString().padStart(10)}                         ║`);
  console.log(`║    doubtful : ${halalCounts.doubtful.toLocaleString().padStart(10)}                         ║`);
  console.log(`║    unknown  : ${halalCounts.unknown.toLocaleString().padStart(10)}                         ║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Duration : ${elapsed}s                                   ║`);
  console.log("╚══════════════════════════════════════════════════════╝");

  await client.end();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
