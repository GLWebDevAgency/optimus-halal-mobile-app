/**
 * Dev seed: Enrich DB with specific products for the dev account.
 * Fetches full data from OpenFoodFacts, upserts products, creates scans.
 * Also cleans up incomplete scans.
 *
 * Usage: source .env && pnpm tsx src/db/seeds/seed-dev-products.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql, or, isNull } from "drizzle-orm";
import { products } from "../schema/products.js";
import { scans } from "../schema/scans.js";
import { users } from "../schema/users.js";

// ── Config ──────────────────────────────────────────────────
const DEV_EMAIL = "dev@optimus.fr";
const OFF_API = "https://world.openfoodfacts.org/api/v2/product";

const BARCODES_TO_SEED = [
  "3512690002044",  // Délice de Dinde — Isla Délice
  "3760049790252",  // Pain de mie Toastiligne complet — La Boulangère
];

// ── OFF fetch ───────────────────────────────────────────────
async function fetchOFF(barcode: string) {
  const res = await fetch(`${OFF_API}/${barcode}.json`, {
    headers: { "User-Agent": "Naqiy/1.0 (contact@naqiy.com)" },
  });
  const data = await res.json();
  if (data.status !== 1) throw new Error(`Product ${barcode} not found on OpenFoodFacts`);
  return data.product;
}

// Simple halal status detection from OFF labels
function detectHalalStatus(off: any): { status: "halal" | "haram" | "doubtful" | "unknown"; confidence: number } {
  const labels: string[] = off.labels_tags ?? [];
  const ingredientsAnalysis: string[] = off.ingredients_analysis_tags ?? [];
  const ingredientsText: string = (off.ingredients_text ?? "").toLowerCase();

  // Check for halal certification labels
  const halalLabels = labels.filter(
    (l: string) => l.includes("halal") || l.includes("certifi")
  );
  if (halalLabels.length > 0) {
    return { status: "halal", confidence: 0.88 };
  }

  // Check for haram indicators
  const haramKeywords = ["porc", "pork", "lard", "alcool", "alcohol", "vin", "wine", "éthanol", "ethanol", "gélatine porcine"];
  const hasHaram = haramKeywords.some((kw) => ingredientsText.includes(kw));
  if (hasHaram) {
    return { status: "haram", confidence: 0.85 };
  }

  // Check OFF's own analysis
  if (ingredientsAnalysis.includes("en:non-vegan")) {
    return { status: "doubtful", confidence: 0.5 };
  }

  return { status: "unknown", confidence: 0 };
}

// ── Main ────────────────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required. Run: source .env && pnpm tsx src/db/seeds/seed-dev-products.ts");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  // 1. Find dev user
  const [devUser] = await db.select().from(users).where(eq(users.email, DEV_EMAIL));
  if (!devUser) throw new Error(`User ${DEV_EMAIL} not found in database`);
  console.log(`✅ Found dev user: ${devUser.displayName} (${devUser.id})`);

  // 2. Delete ALL existing scans for dev user (clean slate)
  const deletedScans = await db
    .delete(scans)
    .where(eq(scans.userId, devUser.id))
    .returning();
  console.log(`🗑️  Deleted ${deletedScans.length} existing scans for dev user`);

  // 3. Fetch & upsert each product, then create a scan
  for (const barcode of BARCODES_TO_SEED) {
    console.log(`\n📦 Processing ${barcode}...`);

    const off = await fetchOFF(barcode);
    const name = off.product_name ?? "Produit inconnu";
    const brand = off.brands ?? null;
    const ingredients = off.ingredients_text
      ? off.ingredients_text.split(",").map((i: string) => i.trim())
      : [];

    const { status: halalStatus, confidence } = detectHalalStatus(off);

    console.log(`  📋 ${name} — ${brand}`);
    console.log(`  🧪 ${ingredients.length} ingrédients`);
    console.log(`  ☪️  Status: ${halalStatus} (confiance: ${(confidence * 100).toFixed(0)}%)`);
    console.log(`  🏷️  Labels: ${(off.labels_tags ?? []).join(", ") || "aucun"}`);

    // Upsert product
    const [product] = await db
      .insert(products)
      .values({
        barcode,
        name,
        brand,
        category: off.categories?.split(",")[0]?.trim() ?? null,
        ingredients,
        imageUrl: off.image_front_url ?? off.image_url ?? null,
        nutritionFacts: off.nutriments ?? null,
        offData: off,
        halalStatus,
        confidenceScore: confidence,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          name,
          brand,
          category: off.categories?.split(",")[0]?.trim() ?? null,
          ingredients,
          imageUrl: off.image_front_url ?? off.image_url ?? null,
          nutritionFacts: off.nutriments ?? null,
          offData: off,
          halalStatus,
          confidenceScore: confidence,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`  ✅ Product upserted: ${product.id}`);

    // Create scan record
    const [scan] = await db
      .insert(scans)
      .values({
        userId: devUser.id,
        productId: product.id,
        barcode,
        halalStatus,
        confidenceScore: confidence,
      })
      .returning();

    console.log(`  ✅ Scan created: ${scan.id} (${scan.scannedAt?.toISOString()})`);
  }

  console.log("\n════════════════════════════════════════");
  console.log("✅ Done! 2 products enriched, old scans cleaned.");
  console.log("   Next scan in the app will re-run full halal analysis.");
  console.log("════════════════════════════════════════");
} catch (err) {
  console.error("❌ Failed:", err);
  process.exit(1);
} finally {
  await client.end();
}
