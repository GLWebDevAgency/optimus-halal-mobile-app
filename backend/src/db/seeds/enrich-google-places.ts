/**
 * Google Places Enrichment Pipeline
 *
 * Enriches all stores in the database with Google Places data:
 *   - Rating, review count, business status
 *   - Top 5 reviews → google_reviews table
 *   - Opening hours → store_hours table
 *   - Top 3 photos → R2 → stores.google_photos + stores.imageUrl
 *   - Phone, website, Google Maps URL
 *
 * Features:
 *   - Resumable: skips stores already enriched (google_place_id IS NOT NULL)
 *   - Rate-limited: 100ms delay between API calls
 *   - Idempotent: safe to re-run (upserts everywhere)
 *   - Error-tolerant: logs and continues on single-store failure
 *
 * Usage:
 *   pnpm tsx --env-file=.env src/db/seeds/enrich-google-places.ts
 *
 * Options:
 *   --force    Re-enrich stores already processed
 *   --limit=N  Process only N stores (for testing)
 *   --dry-run  Fetch from Google but don't write to DB
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, isNull, sql as dsql } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as schema from "../schema/index.js";

// ── Config ──────────────────────────────────────────────────────────

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY is required in .env");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required in .env");
  process.exit(1);
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "naqiy";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

const HAS_R2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_DOMAIN);

// CLI args
const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY_RUN = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

// API constants
const PLACES_BASE = "https://places.googleapis.com/v1/places";
const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.photos",
  "places.reviews",
  "places.businessStatus",
  "places.types",
].join(",");

const DELAY_MS = 120; // ms between API calls (safe margin for 600 QPM)
const MAX_PHOTOS = 3; // photos to download per store
const PHOTO_WIDTH = 800; // px — good balance quality/size for mobile

// ── Types ───────────────────────────────────────────────────────────

interface PlaceResult {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: {
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  };
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
  reviews?: Array<{
    name: string;
    rating: number;
    text?: { text: string; languageCode: string };
    authorAttribution?: { displayName: string; photoUri: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
  }>;
  businessStatus?: string;
  types?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pad(n: number, len: number = 2): string {
  return String(n).padStart(len, "0");
}

function formatTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

async function textSearch(
  name: string,
  address: string,
  city: string,
  lat: number,
  lng: number,
): Promise<PlaceResult | null> {
  const body = {
    textQuery: `${name} ${address} ${city}`,
    languageCode: "fr",
    locationBias: {
      circle: { center: { latitude: lat, longitude: lng }, radius: 500.0 },
    },
    maxResultCount: 1,
  };

  const res = await fetch(`${PLACES_BASE}:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": SEARCH_FIELDS,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { places?: PlaceResult[] };
  return data.places?.[0] ?? null;
}

async function downloadPhoto(photoName: string, width: number): Promise<Buffer | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${width}&key=${API_KEY}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

// ── R2 upload ───────────────────────────────────────────────────────

let _s3: S3Client | null = null;

function getS3(): S3Client {
  if (_s3) return _s3;
  _s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return _s3;
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `https://${R2_PUBLIC_DOMAIN}/${key}`;
}

// ── Main pipeline ───────────────────────────────────────────────────

async function main() {
  const client = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("━━━ Naqiy — Google Places Enrichment Pipeline ━━━\n");
  console.log(`  Mode:    ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`  Force:   ${FORCE ? "YES (re-enrich all)" : "NO (skip enriched)"}`);
  console.log(`  R2:      ${HAS_R2 ? "YES (photos uploaded)" : "NO (photos skipped)"}`);
  if (LIMIT) console.log(`  Limit:   ${LIMIT} stores`);
  console.log();

  // Fetch stores to enrich
  const whereClause = FORCE ? undefined : isNull(schema.stores.googlePlaceId);
  let allStores = await db
    .select({
      id: schema.stores.id,
      name: schema.stores.name,
      address: schema.stores.address,
      city: schema.stores.city,
      latitude: schema.stores.latitude,
      longitude: schema.stores.longitude,
      phone: schema.stores.phone,
      website: schema.stores.website,
    })
    .from(schema.stores)
    .where(whereClause)
    .orderBy(schema.stores.name);

  if (LIMIT) allStores = allStores.slice(0, LIMIT);

  console.log(`  Stores to process: ${allStores.length}\n`);

  const stats = {
    total: allStores.length,
    matched: 0,
    noMatch: 0,
    errors: 0,
    photosUploaded: 0,
    reviewsInserted: 0,
    hoursInserted: 0,
  };

  for (let i = 0; i < allStores.length; i++) {
    const store = allStores[i];
    const progress = `[${i + 1}/${allStores.length}]`;

    try {
      // Search Google Places
      const place = await textSearch(
        store.name,
        store.address,
        store.city,
        store.latitude,
        store.longitude,
      );

      if (!place) {
        console.log(`  ${progress} ❌ ${store.name} — no match`);
        stats.noMatch++;
        await sleep(DELAY_MS);
        continue;
      }

      // Validate location match (reject if >2km away)
      if (place.location) {
        const dLat = Math.abs(place.location.latitude - store.latitude);
        const dLng = Math.abs(place.location.longitude - store.longitude);
        const distKm = Math.sqrt(dLat ** 2 + dLng ** 2) * 111;
        if (distKm > 2) {
          console.log(
            `  ${progress} ⚠️  ${store.name} — match too far (${distKm.toFixed(1)}km): "${place.displayName?.text}"`,
          );
          stats.noMatch++;
          await sleep(DELAY_MS);
          continue;
        }
      }

      const rating = place.rating ?? null;
      const reviewCount = place.userRatingCount ?? 0;
      const displayMatch = place.displayName?.text ?? "?";

      console.log(
        `  ${progress} ✅ ${store.name} → "${displayMatch}" ⭐${rating ?? "?"} (${reviewCount})`,
      );

      if (DRY_RUN) {
        stats.matched++;
        await sleep(DELAY_MS);
        continue;
      }

      // ── Upload photos to R2 ──
      const photoUrls: string[] = [];
      if (HAS_R2 && place.photos && place.photos.length > 0) {
        const photosToUpload = place.photos.slice(0, MAX_PHOTOS);
        for (let p = 0; p < photosToUpload.length; p++) {
          try {
            const photoData = await downloadPhoto(photosToUpload[p].name, PHOTO_WIDTH);
            if (photoData) {
              const key = `stores/${store.id}/google-${p}.jpg`;
              const url = await uploadToR2(key, photoData, "image/jpeg");
              photoUrls.push(url);
              stats.photosUploaded++;
            }
          } catch {
            // Photo download/upload failure is non-fatal
          }
          await sleep(50); // Small delay between photo downloads
        }
      }

      // ── Update store record ──
      await db
        .update(schema.stores)
        .set({
          googlePlaceId: place.id,
          googleMapsUrl: place.googleMapsUri ?? null,
          googleRating: rating,
          googleReviewCount: reviewCount,
          googlePhotos: photoUrls,
          googleEnrichedAt: new Date(),
          // Enrich missing fields
          averageRating: rating ?? 0,
          reviewCount: reviewCount,
          imageUrl: photoUrls[0] ?? null,
          phone: store.phone || place.nationalPhoneNumber || null,
          website: store.website || place.websiteUri || null,
          isActive: place.businessStatus !== "CLOSED_PERMANENTLY",
          updatedAt: new Date(),
        })
        .where(eq(schema.stores.id, store.id));

      // ── Insert opening hours ──
      if (place.regularOpeningHours?.periods) {
        // Delete existing hours for this store (idempotent)
        await db
          .delete(schema.storeHours)
          .where(eq(schema.storeHours.storeId, store.id));

        // Track which days have hours
        const daysWithHours = new Set<number>();

        for (const period of place.regularOpeningHours.periods) {
          const openDay = period.open.day;
          daysWithHours.add(openDay);

          await db.insert(schema.storeHours).values({
            storeId: store.id,
            dayOfWeek: openDay,
            openTime: formatTime(period.open.hour, period.open.minute),
            closeTime: period.close
              ? formatTime(period.close.hour, period.close.minute)
              : "23:59",
            isClosed: false,
          });
          stats.hoursInserted++;
        }

        // Insert "closed" entries for missing days
        for (let d = 0; d <= 6; d++) {
          if (!daysWithHours.has(d)) {
            await db.insert(schema.storeHours).values({
              storeId: store.id,
              dayOfWeek: d,
              isClosed: true,
            });
            stats.hoursInserted++;
          }
        }
      }

      // ── Insert Google reviews ──
      if (place.reviews && place.reviews.length > 0) {
        for (const review of place.reviews) {
          await db
            .insert(schema.googleReviews)
            .values({
              storeId: store.id,
              googleReviewId: review.name,
              authorName: review.authorAttribution?.displayName ?? "Anonyme",
              authorPhotoUri: review.authorAttribution?.photoUri ?? null,
              rating: review.rating,
              text: review.text?.text ?? null,
              publishTime: review.publishTime ? new Date(review.publishTime) : null,
              relativeTime: review.relativePublishTimeDescription ?? null,
              languageCode: review.text?.languageCode ?? "fr",
            })
            .onConflictDoUpdate({
              target: schema.googleReviews.googleReviewId,
              set: {
                rating: review.rating,
                text: review.text?.text ?? null,
                relativeTime: review.relativePublishTimeDescription ?? null,
                updatedAt: new Date(),
              },
            });
          stats.reviewsInserted++;
        }
      }

      stats.matched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ${progress} 💥 ${store.name} — ${msg}`);
      stats.errors++;
    }

    await sleep(DELAY_MS);
  }

  // ── Summary ──
  console.log("\n━━━ Enrichment Complete ━━━\n");
  console.log(`  Total processed:  ${stats.total}`);
  console.log(`  Matched:          ${stats.matched}`);
  console.log(`  No match:         ${stats.noMatch}`);
  console.log(`  Errors:           ${stats.errors}`);
  console.log(`  Photos uploaded:  ${stats.photosUploaded}`);
  console.log(`  Reviews inserted: ${stats.reviewsInserted}`);
  console.log(`  Hours inserted:   ${stats.hoursInserted}`);

  // DB totals
  const [storeCount] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(schema.stores);
  const [enrichedCount] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(schema.stores)
    .where(dsql`google_place_id IS NOT NULL`);
  const [reviewCount] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(schema.googleReviews);
  const [hoursCount] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(schema.storeHours);

  console.log(`\n  DB totals:`);
  console.log(`    Stores:            ${storeCount.count}`);
  console.log(`    Enriched:          ${enrichedCount.count}`);
  console.log(`    Google reviews:    ${reviewCount.count}`);
  console.log(`    Store hours:       ${hoursCount.count}`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
