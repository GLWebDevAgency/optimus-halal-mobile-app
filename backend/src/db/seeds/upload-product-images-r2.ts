/**
 * Product Image → R2 Uploader
 *
 * Queries products that have an imageUrl but no imageR2Key,
 * downloads the image, uploads to R2, and sets imageR2Key in DB.
 *
 * Works with images from ANY source (OFF, Carrefour, etc.).
 * R2 key format: products/{barcode}/front.{ext}
 *
 * Features:
 *   - Batch processing with configurable concurrency
 *   - Retry with exponential backoff on download failures
 *   - Skips already-uploaded products (imageR2Key IS NOT NULL)
 *   - Content-Type detection from response headers
 *   - Progress reporting every 50 images
 *   - Dry-run mode for testing
 *
 * Usage:
 *   source .env && pnpm tsx src/db/seeds/upload-product-images-r2.ts
 *   source .env && pnpm tsx src/db/seeds/upload-product-images-r2.ts --limit 1000
 *   source .env && pnpm tsx src/db/seeds/upload-product-images-r2.ts --source carrefour
 *   source .env && pnpm tsx src/db/seeds/upload-product-images-r2.ts --dry-run
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../schema/products.js";
import { eq, isNull, isNotNull, sql, and, arrayContains } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ── Configuration ────────────────────────────────────────────

const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "5000");
const SOURCE = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? null;
const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 5;
const BATCH_SIZE = 50;
const DOWNLOAD_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

// ── R2 Client ────────────────────────────────────────────────

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("R2 credentials required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

const BUCKET = process.env.R2_BUCKET_NAME ?? "naqiy";

// ── Helpers ──────────────────────────────────────────────────

function extFromContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

async function downloadImage(
  url: string,
  retries = MAX_RETRIES,
): Promise<{ data: Buffer; contentType: string } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Naqiy-ImageSync/1.0" },
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        if (resp.status === 404) return null; // Image gone — skip permanently
        throw new Error(`HTTP ${resp.status}`);
      }

      const contentType = resp.headers.get("content-type") ?? "image/jpeg";
      const data = Buffer.from(await resp.arrayBuffer());

      // Sanity check: skip if response is too small (likely an error page)
      if (data.length < 200) return null;

      return { data, contentType };
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function uploadToR2(
  s3: S3Client,
  key: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
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
    }
  });
  await Promise.all(workers);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  console.log(`🖼️  Product Image → R2 Uploader`);
  console.log(`   Limit: ${LIMIT} | Concurrency: ${CONCURRENCY} | Source: ${SOURCE ?? "all"}`);
  if (DRY_RUN) console.log("   ⚠️  DRY RUN — no uploads will happen");

  const client = postgres(connectionString, { max: 8 });
  const db = drizzle(client);
  const s3 = DRY_RUN ? null : getS3Client();

  // Query products with images but no R2 key
  const conditions = [
    isNotNull(products.imageUrl),
    isNull(products.imageR2Key),
    sql`length(${products.imageUrl}) > 10`,
  ];

  if (SOURCE) {
    conditions.push(arrayContains(products.dataSources, [SOURCE]));
  }

  const rows = await db
    .select({
      id: products.id,
      barcode: products.barcode,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(and(...conditions))
    .limit(LIMIT);

  console.log(`\nFound ${rows.length} products to process\n`);

  if (rows.length === 0) {
    await client.end();
    return;
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  await processPool(rows, CONCURRENCY, async (row, idx) => {
    const imageUrl = row.imageUrl!;
    const ext = extFromContentType(imageUrl);
    const r2Key = `products/${row.barcode}/front.${ext}`;

    if (DRY_RUN) {
      uploaded++;
      if ((idx + 1) % 50 === 0) console.log(`  [DRY] ${idx + 1}/${rows.length}`);
      return;
    }

    // Download image
    const result = await downloadImage(imageUrl);
    if (!result) {
      skipped++;
      return;
    }

    // Determine proper extension from content-type
    const actualExt = extFromContentType(result.contentType);
    const actualKey = `products/${row.barcode}/front.${actualExt}`;

    try {
      // Upload to R2
      await uploadToR2(s3!, actualKey, result.data, result.contentType);

      // Update DB
      await db
        .update(products)
        .set({ imageR2Key: actualKey })
        .where(eq(products.id, row.id));

      uploaded++;
    } catch (err) {
      failed++;
      if (failed <= 10) {
        console.error(`  ✗ ${row.barcode}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if ((idx + 1) % 50 === 0 || idx + 1 === rows.length) {
      console.log(
        `  Progress: ${idx + 1}/${rows.length} | ✓ ${uploaded} uploaded | ⏩ ${skipped} skipped | ✗ ${failed} failed`,
      );
    }
  });

  console.log(`\n✅ Complete:`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Skipped (404/empty): ${skipped}`);
  console.log(`   Failed: ${failed}`);

  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
