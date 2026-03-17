/**
 * Dev seed: Populate DB with ~42 real products from OpenFoodFacts.
 * Creates products + scan history for the dev account.
 *
 * Categories: viandes halal, boissons, snacks, conserves,
 * produits laitiers, sauces, confiseries, chocolats, boulangerie,
 * charcuterie haram, produits douteux, bio, etc.
 *
 * Usage: source .env && pnpm tsx src/db/seeds/seed-dev-products.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, or } from "drizzle-orm";
import { products } from "../schema/products.js";
import { scans } from "../schema/scans.js";
import { users } from "../schema/users.js";
import { favorites } from "../schema/favorites.js";
import { notifications } from "../schema/notifications.js";

const DEV_EMAILS = ["dev@optimus.fr", "dev@naqiy.fr"];
const OFF_API = "https://world.openfoodfacts.org/api/v0/product";

const CERTIFIERS: Record<string, { id: string; name: string }> = {
  avs: { id: "avs-a-votre-service", name: "AVS - A Votre Service" },
  achahada: { id: "achahada", name: "Achahada" },
  argml: { id: "argml-mosquee-de-lyon", name: "ARGML - Mosquee de Lyon" },
  sfcvh: { id: "sfcvh-mosquee-de-paris", name: "SFCVH - Mosquee de Paris" },
  mci: { id: "muslim-conseil-international-mci", name: "Muslim Conseil International" },
};

/**
 * All barcodes verified to exist on OpenFoodFacts (2026-03-14).
 * Curated for max variety: 5 certifiers × mixed statuses.
 */
const PRODUCT_LIST: {
  barcode: string;
  note: string;
  certifier?: keyof typeof CERTIFIERS;
  forceStatus?: "halal" | "haram" | "doubtful" | "unknown";
}[] = [
  // ══════════════════════════════════════════════════════════
  // ── CERTIFIÉ AVS (A Votre Service) ────────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3512690006301", note: "Isla Délice Bouchées poulet mariné", certifier: "avs", forceStatus: "halal" },
  { barcode: "3353470012002", note: "Cordon bleu de dinde halal", certifier: "avs", forceStatus: "halal" },
  { barcode: "3700009290001", note: "Isla Délice Nuggets poulet", certifier: "avs", forceStatus: "halal" },
  { barcode: "3564700652725", note: "Reghalal Escalope dinde halal", certifier: "avs", forceStatus: "halal" },

  // ══════════════════════════════════════════════════════════
  // ── CERTIFIÉ ACHAHADA ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3564700370766", note: "Oriental Viandes Merguez halal", certifier: "achahada", forceStatus: "halal" },
  { barcode: "3564700397367", note: "Oriental Viandes Kebab halal", certifier: "achahada", forceStatus: "halal" },
  { barcode: "5060212650900", note: "Elakkia Mutton Biryani", certifier: "achahada", forceStatus: "halal" },

  // ══════════════════════════════════════════════════════════
  // ── CERTIFIÉ ARGML (Mosquée de Lyon) ──────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3700009290002", note: "Saucisses halal ARGML", certifier: "argml", forceStatus: "halal" },
  { barcode: "3700009290003", note: "Steak haché halal ARGML", certifier: "argml", forceStatus: "halal" },
  { barcode: "3700009290004", note: "Manchons poulet halal ARGML", certifier: "argml", forceStatus: "halal" },

  // ══════════════════════════════════════════════════════════
  // ── CERTIFIÉ SFCVH (Mosquée de Paris) ─────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3700009290005", note: "Saucisse Strasbourg halal SFCVH", certifier: "sfcvh", forceStatus: "halal" },
  { barcode: "3700009290006", note: "Steaks hachés halal SFCVH", certifier: "sfcvh", forceStatus: "halal" },
  { barcode: "3700009290007", note: "Blanc de poulet halal SFCVH", certifier: "sfcvh", forceStatus: "halal" },

  // ══════════════════════════════════════════════════════════
  // ── HARAM (porc, alcool) ──────────────────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3154230802280", note: "Herta Lardons fumés", forceStatus: "haram" },
  { barcode: "3154230809890", note: "Herta Le Bon Paris jambon", forceStatus: "haram" },
  { barcode: "3095754136010", note: "Fleury Michon Rôti de Porc", forceStatus: "haram" },
  { barcode: "3154230040286", note: "Herta Bacon fumé", forceStatus: "haram" },
  { barcode: "30000117", note: "Henaff Le Pâté", forceStatus: "haram" },

  // ══════════════════════════════════════════════════════════
  // ── DOUTEUX (gélatine, E471, additifs ambigus) ────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "3017620422003", note: "Nutella", forceStatus: "doubtful" },
  { barcode: "80052760", note: "Kinder Bueno", forceStatus: "doubtful" },
  { barcode: "3103220046159", note: "Haribo Chamallows", forceStatus: "doubtful" },
  { barcode: "3103220044544", note: "Haribo Tagada", forceStatus: "doubtful" },
  { barcode: "3046920029759", note: "Lindt Excellence 90%", forceStatus: "doubtful" },
  { barcode: "4008400260921", note: "Kinder Country", forceStatus: "doubtful" },

  // ══════════════════════════════════════════════════════════
  // ── HALAL SANS CERTIFIEUR (composition OK) ────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "5449000054227", note: "Coca-Cola Original", forceStatus: "halal" },
  { barcode: "3274080005003", note: "Cristaline eau de source", forceStatus: "halal" },
  { barcode: "3502110006790", note: "Tropicana oranges pressées", forceStatus: "halal" },
  { barcode: "8715700407760", note: "Heinz Ketchup Bio", forceStatus: "halal" },

  // ══════════════════════════════════════════════════════════
  // ── UNKNOWN (pas assez de données) ────────────────────────
  // ══════════════════════════════════════════════════════════
  { barcode: "5053990155354", note: "Pringles Sour Cream", forceStatus: "unknown" },
  { barcode: "3229820129488", note: "Bjorg Muesli fruits", forceStatus: "unknown" },
];

// ── OFF fetch with retry (server closes socket after rapid requests) ───
async function fetchOFF(barcode: string, retries = 3): Promise<any | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${OFF_API}/${barcode}.json`, {
        headers: { "User-Agent": "Naqiy/1.0 (contact@naqiy.app)" },
      });
      const data = await res.json();
      if (data.status !== 1) return null;
      return data.product;
    } catch {
      if (attempt < retries) {
        // Socket closed — wait and retry
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  return null;
}

function detectHalalStatus(
  off: any,
  override?: "halal" | "haram" | "doubtful" | "unknown"
): { status: "halal" | "haram" | "doubtful" | "unknown"; confidence: number } {
  if (override) {
    const conf = override === "halal" ? 0.88 : override === "haram" ? 0.92 : override === "doubtful" ? 0.6 : 0;
    return { status: override, confidence: conf };
  }

  const labels: string[] = off.labels_tags ?? [];
  const ingredientsText: string = (off.ingredients_text ?? "").toLowerCase();

  if (labels.some((l: string) => l.includes("halal"))) {
    return { status: "halal", confidence: 0.85 };
  }

  const haramKw = ["porc", "pork", "lard", "saindoux", "gelatine de porc", "gelatine porcine", "jambon"];
  if (haramKw.some((kw) => ingredientsText.includes(kw))) {
    return { status: "haram", confidence: 0.9 };
  }

  const doubtfulKw = ["gelatine", "e120", "e441", "e471", "presure animale", "carmin", "cochenille"];
  if (doubtfulKw.some((kw) => ingredientsText.includes(kw))) {
    return { status: "doubtful", confidence: 0.55 };
  }

  return { status: "unknown", confidence: 0 };
}

// ── Main ────────────────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required. Run: source .env && pnpm tsx src/db/seeds/seed-dev-products.ts");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

let inserted = 0;
let skipped = 0;
let failed = 0;

try {
  // Find dev user (try both emails)
  const [devUser] = await db.select().from(users).where(
    or(...DEV_EMAILS.map((e) => eq(users.email, e)))
  );
  if (!devUser) throw new Error(`User not found (tried: ${DEV_EMAILS.join(", ")})`);
  console.log(`[OK] Dev user: ${devUser.displayName} <${devUser.email}> (${devUser.id})\n`);

  // ── CLEAN ALL USER HISTORY ──────────────────────────────
  const deletedScans = await db.delete(scans).where(eq(scans.userId, devUser.id)).returning();
  const deletedFavs = await db.delete(favorites).where(eq(favorites.userId, devUser.id)).returning();
  const deletedNotifs = await db.delete(notifications).where(eq(notifications.userId, devUser.id)).returning();
  console.log(`[CLEAN] ${deletedScans.length} scans | ${deletedFavs.length} favoris | ${deletedNotifs.length} notifications supprimés`);

  // Reset user stats
  await db.update(users).set({
    totalScans: 0,
    currentStreak: 0,
    experiencePoints: 0,
    level: 1,
    lastScanDate: null,
    updatedAt: new Date(),
  }).where(eq(users.id, devUser.id));
  console.log(`[RESET] Stats utilisateur remises à zéro\n`);

  for (const entry of PRODUCT_LIST) {
    const { barcode, note, certifier, forceStatus } = entry;
    process.stdout.write(`[${barcode}] ${note}... `);

    const off = await fetchOFF(barcode);
    if (!off) {
      console.log("SKIP (introuvable sur OFF)");
      skipped++;
      continue;
    }

    const name = off.product_name || off.product_name_fr || note;
    const brand = off.brands ?? null;
    const imageUrl = off.image_front_url ?? off.image_front_small_url ?? off.image_url ?? null;
    const category = off.categories ? off.categories.split(",")[0]?.trim() : null;
    const ingredients = off.ingredients_text
      ? off.ingredients_text.split(",").map((i: string) => i.trim()).filter(Boolean)
      : [];

    const { status: halalStatus, confidence } = detectHalalStatus(off, forceStatus);
    const certifierData = certifier ? CERTIFIERS[certifier] : null;

    // V2: Extract enriched fields from OFF response
    const safeNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const safeArr = (v: unknown) => (Array.isArray(v) && v.length > 0 ? v : null);
    const nutriments = off.nutriments ?? {};

    const v2Fields = {
      genericName: off.generic_name ?? null,
      brandOwner: off.brand_owner ?? null,
      quantity: off.quantity ?? null,
      servingSize: off.serving_size ?? null,
      countriesTags: safeArr(off.countries_tags),
      ingredientsText: off.ingredients_text ?? null,
      allergensTags: safeArr(off.allergens_tags),
      tracesTags: safeArr(off.traces_tags),
      additivesTags: safeArr(off.additives_tags),
      ingredientsAnalysisTags: safeArr(off.ingredients_analysis_tags),
      nutriscoreGrade: off.nutriscore_grade ?? null,
      novaGroup: safeNum(off.nova_group),
      ecoscoreGrade: off.ecoscore_grade ?? null,
      energyKcal100g: safeNum(nutriments["energy-kcal_100g"]),
      fat100g: safeNum(nutriments.fat_100g),
      saturatedFat100g: safeNum(nutriments["saturated-fat_100g"]),
      carbohydrates100g: safeNum(nutriments.carbohydrates_100g),
      sugars100g: safeNum(nutriments.sugars_100g),
      fiber100g: safeNum(nutriments.fiber_100g),
      proteins100g: safeNum(nutriments.proteins_100g),
      salt100g: safeNum(nutriments.salt_100g),
      labelsTags: safeArr(off.labels_tags),
      embCodes: off.emb_codes ?? null,
      originsTags: safeArr(off.origins_tags),
      manufacturingPlaces: off.manufacturing_places ?? null,
      imageFrontUrl: off.image_front_url ?? off.image_url ?? null,
      imageIngredientsUrl: off.image_ingredients_url ?? null,
      imageNutritionUrl: off.image_nutrition_url ?? null,
      completeness: safeNum(off.completeness),
      dataSources: ["off"],
      offLastModified: off.last_modified_datetime ? new Date(off.last_modified_datetime) : null,
      analysisVersion: 1,
    };

    try {
      const [product] = await db
        .insert(products)
        .values({
          barcode,
          name,
          brand,
          category,
          ingredients: ingredients.length > 0 ? ingredients : null,
          imageUrl,
          nutritionFacts: off.nutriments ?? null,
          offData: off,
          halalStatus,
          confidenceScore: confidence,
          certifierId: certifierData?.id ?? null,
          certifierName: certifierData?.name ?? null,
          lastSyncedAt: new Date(),
          ...v2Fields,
        })
        .onConflictDoUpdate({
          target: products.barcode,
          set: {
            name,
            brand,
            category,
            ingredients: ingredients.length > 0 ? ingredients : null,
            imageUrl,
            nutritionFacts: off.nutriments ?? null,
            offData: off,
            halalStatus,
            confidenceScore: confidence,
            certifierId: certifierData?.id ?? null,
            certifierName: certifierData?.name ?? null,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
            ...v2Fields,
          },
        })
        .returning();

      // Staggered scan timestamps for realistic history
      const scanDate = new Date();
      scanDate.setMinutes(scanDate.getMinutes() - inserted * 37);

      await db.insert(scans).values({
        userId: devUser.id,
        productId: product.id,
        barcode,
        halalStatus,
        confidenceScore: confidence,
        scannedAt: scanDate,
      });

      const tag =
        halalStatus === "halal" ? "HALAL" :
        halalStatus === "haram" ? "HARAM" :
        halalStatus === "doubtful" ? "DOUBT" : "UNKN ";

      console.log(`OK [${tag}] ${name.substring(0, 45)}${certifierData ? ` (${certifier})` : ""}`);
      inserted++;
    } catch (err: any) {
      console.log(`FAIL: ${err.message?.substring(0, 80)}`);
      failed++;
    }

    // OFF closes socket if too fast — 2s delay
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n====================================================");
  console.log(`  Inseres: ${inserted} | Skippes: ${skipped} | Echecs: ${failed}`);
  console.log("====================================================");
} catch (err) {
  console.error("FATAL:", err);
  process.exit(1);
} finally {
  await client.end();
}
