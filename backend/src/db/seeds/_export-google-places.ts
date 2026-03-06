/**
 * Export Google Places enrichment data from current DB to static JSON
 *
 * Exports stores' Google data + google_reviews + store_hours (from enrichment)
 * into a static JSON file that can be seeded on any environment without
 * needing GOOGLE_PLACES_API_KEY.
 *
 * This solves the "preview has no Google data" problem:
 *   1. Run enrichment on dev: pnpm tsx --env-file=.env src/db/seeds/enrich-google-places.ts
 *   2. Export: pnpm tsx --env-file=.env src/db/seeds/_export-google-places.ts
 *   3. Commit the generated JSON → now all envs get Google data via seed pipeline
 *
 * Usage:
 *   pnpm tsx --env-file=.env src/db/seeds/_export-google-places.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { isNotNull } from "drizzle-orm";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as schema from "../schema/index.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../../../asset/google-places-data.json");

const client = postgres(DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log("--- Exporting Google Places data ---\n");

  // 1. Get all enriched stores (have google_place_id)
  const enrichedStores = await db
    .select({
      sourceId: schema.stores.sourceId,
      googlePlaceId: schema.stores.googlePlaceId,
      googleMapsUrl: schema.stores.googleMapsUrl,
      googleRating: schema.stores.googleRating,
      googleReviewCount: schema.stores.googleReviewCount,
      googlePhotos: schema.stores.googlePhotos,
      imageUrl: schema.stores.imageUrl,
      phone: schema.stores.phone,
      website: schema.stores.website,
    })
    .from(schema.stores)
    .where(isNotNull(schema.stores.googlePlaceId));

  console.log(`  Enriched stores: ${enrichedStores.length}`);

  // 2. Get google_reviews for enriched stores
  const storeIds = await db
    .select({ id: schema.stores.id, sourceId: schema.stores.sourceId })
    .from(schema.stores)
    .where(isNotNull(schema.stores.googlePlaceId));

  const storeIdToSourceId = new Map(storeIds.map((s) => [s.id, s.sourceId]));

  const allReviews = await db
    .select({
      storeId: schema.googleReviews.storeId,
      googleReviewId: schema.googleReviews.googleReviewId,
      authorName: schema.googleReviews.authorName,
      authorPhotoUri: schema.googleReviews.authorPhotoUri,
      rating: schema.googleReviews.rating,
      text: schema.googleReviews.text,
      publishTime: schema.googleReviews.publishTime,
      relativeTime: schema.googleReviews.relativeTime,
      languageCode: schema.googleReviews.languageCode,
    })
    .from(schema.googleReviews);

  // Group reviews by store sourceId
  const reviewsBySourceId: Record<string, typeof allReviews> = {};
  for (const review of allReviews) {
    const sourceId = storeIdToSourceId.get(review.storeId);
    if (!sourceId) continue;
    if (!reviewsBySourceId[sourceId]) reviewsBySourceId[sourceId] = [];
    reviewsBySourceId[sourceId].push(review);
  }

  const totalReviews = allReviews.length;
  console.log(`  Google reviews: ${totalReviews}`);

  // 3. Get store_hours for enriched stores (from Google enrichment)
  const allHours = await db
    .select({
      storeId: schema.storeHours.storeId,
      dayOfWeek: schema.storeHours.dayOfWeek,
      openTime: schema.storeHours.openTime,
      closeTime: schema.storeHours.closeTime,
      isClosed: schema.storeHours.isClosed,
    })
    .from(schema.storeHours);

  const hoursBySourceId: Record<string, typeof allHours> = {};
  for (const hour of allHours) {
    const sourceId = storeIdToSourceId.get(hour.storeId);
    if (!sourceId) continue;
    if (!hoursBySourceId[sourceId]) hoursBySourceId[sourceId] = [];
    hoursBySourceId[sourceId].push(hour);
  }

  const totalHours = allHours.length;
  console.log(`  Store hours: ${totalHours}`);

  // 4. Build export structure (keyed by sourceId for stable matching)
  const exportData = {
    exportedAt: new Date().toISOString(),
    stores: enrichedStores.map((s) => ({
      sourceId: s.sourceId,
      googlePlaceId: s.googlePlaceId,
      googleMapsUrl: s.googleMapsUrl,
      googleRating: s.googleRating,
      googleReviewCount: s.googleReviewCount,
      googlePhotos: s.googlePhotos,
      imageUrl: s.imageUrl,
      phone: s.phone,
      website: s.website,
    })),
    reviews: reviewsBySourceId,
    hours: hoursBySourceId,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(exportData, null, 2));
  console.log(`\n  Written to: ${OUTPUT_PATH}`);
  console.log(`  File size: ${(Buffer.byteLength(JSON.stringify(exportData)) / 1024).toFixed(1)} KB`);

  await client.end();
}

main().catch((err) => {
  console.error("Export failed:", err);
  client.end();
  process.exit(1);
});
