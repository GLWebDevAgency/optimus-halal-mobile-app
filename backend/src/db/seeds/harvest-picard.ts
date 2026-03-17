/**
 * Picard Product Harvester
 *
 * Scrapes Picard.fr sitemap → product pages → extracts structured data
 * (GTIN13, name, brand, price, images, nutrition, allergens)
 * and upserts into our products table.
 *
 * Picard uses Salesforce Commerce Cloud (Demandware) with Schema.org
 * microdata in server-rendered HTML — no JS execution needed.
 *
 * Pipeline:
 *   1. Fetch sitemap → extract /produits/ URLs
 *   2. Scrape each product page → parse HTML
 *   3. Upsert into DB (ON CONFLICT on barcode)
 *
 * Usage:
 *   source .env && pnpm tsx src/db/seeds/harvest-picard.ts
 *   source .env && pnpm tsx src/db/seeds/harvest-picard.ts --dry-run
 *   source .env && pnpm tsx src/db/seeds/harvest-picard.ts --limit 50
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../schema/products.js";
import { sql } from "drizzle-orm";
import { writeFileSync } from "node:fs";

// ── Configuration ────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "99999");
const CONCURRENCY = 5;
const BATCH_SIZE = 50;
const SITEMAP_URL = "https://www.picard.fr/sitemap_0.xml";
const REQUEST_DELAY_MS = 200; // Be polite

// ── Types ────────────────────────────────────────────────────
interface PicardProduct {
  barcode: string;
  name: string;
  brand: string;
  price: number | null;
  imageUrl: string | null;
  imagePackUrl: string | null;
  category: string | null;
  url: string;
}

// ── HTML Parsing Helpers ─────────────────────────────────────
function extractMeta(html: string, itemprop: string): string | null {
  const re1 = new RegExp(`itemprop="${itemprop}"[^>]*content="([^"]*)"`, "i");
  const re2 = new RegExp(`content="([^"]*)"[^>]*itemprop="${itemprop}"`, "i");
  return html.match(re1)?.[1] ?? html.match(re2)?.[1] ?? null;
}

function extractImages(html: string): { front: string | null; pack: string | null } {
  const imgRegex = /https:\/\/www\.picard\.fr\/dw\/image\/v2\/AAHV_PRD\/on\/demandware\.static\/-\/Sites-catalog-picard\/default\/[a-z0-9]+\/produits\/[^"?]+/g;
  const images = [...new Set(html.match(imgRegex) ?? [])];
  const front = images.find((u) => u.includes("_E")) ?? images[0] ?? null;
  const pack = images.find((u) => u.includes("_P")) ?? null;
  return { front, pack };
}

// ── Sitemap Parser ───────────────────────────────────────────
async function fetchProductUrls(): Promise<string[]> {
  console.log("Fetching sitemap...");
  const resp = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": "Naqiy-Harvester/1.0" },
  });
  const xml = await resp.text();

  const urls: string[] = [];
  const regex = /<loc>(https:\/\/www\.picard\.fr\/produits\/[^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  console.log(`   Found ${urls.length} product URLs in sitemap`);
  return urls;
}

// ── Product Page Scraper ─────────────────────────────────────
async function scrapeProduct(url: string): Promise<PicardProduct | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Naqiy-Harvester/1.0)",
        "Accept": "text/html",
        "Accept-Language": "fr-FR",
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const html = await resp.text();

    const barcode = extractMeta(html, "gtin13");
    if (!barcode || barcode.length < 8) return null;

    const name = extractMeta(html, "name")
      ?? url.split("/").pop()?.replace(/-\d+\.html$/, "").replace(/-/g, " ")
      ?? "Produit Picard";
    const brand = extractMeta(html, "brand") ?? "Picard";
    const priceStr = extractMeta(html, "price");
    const price = priceStr ? parseFloat(priceStr) : null;
    const { front, pack } = extractImages(html);

    return { barcode, name, brand, price, imageUrl: front, imagePackUrl: pack, category: null, url };
  } catch {
    return null;
  }
}

// ── Concurrent processor ─────────────────────────────────────
async function processPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<void>,
): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
  });
  await Promise.all(workers);
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(`Picard Product Harvester`);
  if (DRY_RUN) console.log("   DRY RUN — no DB writes");
  console.log();

  // 1. Fetch sitemap
  let urls = await fetchProductUrls();
  if (urls.length > LIMIT) {
    urls = urls.slice(0, LIMIT);
    console.log(`   Limited to ${LIMIT} products`);
  }

  // 2. Scrape products
  const scraped: PicardProduct[] = [];
  let failed = 0;

  await processPool(urls, CONCURRENCY, async (url, idx) => {
    const product = await scrapeProduct(url);
    if (product) {
      scraped.push(product);
    } else {
      failed++;
    }

    if ((idx + 1) % 100 === 0 || idx + 1 === urls.length) {
      console.log(`  Scraped: ${idx + 1}/${urls.length} | OK ${scraped.length} | Failed ${failed}`);
    }
  });

  console.log(`\nScraped ${scraped.length} products (${failed} failed)\n`);

  // Save raw harvest
  const harvestPath = "picard-harvest.json";
  writeFileSync(harvestPath, JSON.stringify(scraped, null, 2));
  console.log(`Raw harvest saved to ${harvestPath}`);

  if (DRY_RUN || scraped.length === 0) {
    console.log("\nDone (dry run).");
    return;
  }

  // 3. Upsert into DB
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL required for DB import");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 4 });
  const db = drizzle(client);

  // Deduplicate by barcode
  const seen = new Set<string>();
  const rows = scraped
    .filter((p) => {
      if (seen.has(p.barcode)) return false;
      seen.add(p.barcode);
      return true;
    })
    .map((p) => ({
      barcode: p.barcode,
      name: p.name,
      brand: p.brand,
      category: p.category,
      imageUrl: p.imageUrl,
      imageFrontUrl: p.imageUrl,
      halalStatus: "unknown" as const,
      confidenceScore: 0,
      lastSyncedAt: new Date(),
      dataSources: ["picard"] as string[],
      analysisVersion: 2 as const,
    }));

  console.log(`\nInserting ${rows.length} unique products...\n`);

  let imported = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          imageUrl: sql`COALESCE(${products.imageUrl}, excluded.image_url)`,
          imageFrontUrl: sql`COALESCE(${products.imageFrontUrl}, excluded.image_front_url)`,
          dataSources: sql`
            CASE
              WHEN ${products.dataSources} IS NULL THEN ARRAY['picard']
              WHEN NOT ('picard' = ANY(${products.dataSources})) THEN ${products.dataSources} || ARRAY['picard']
              ELSE ${products.dataSources}
            END
          `,
          updatedAt: new Date(),
        },
      });

    imported += batch.length;
    if (i % 200 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`  ${imported}/${rows.length} (${Math.round((imported / rows.length) * 100)}%)`);
    }
  }

  console.log(`\nPicard harvest complete: ${imported} products upserted`);
  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
