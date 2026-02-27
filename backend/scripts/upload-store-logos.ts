/**
 * upload-store-logos.ts — Downloads Achahada store logos and uploads to R2.
 *
 * Usage: pnpm upload:logos
 * Requires: .env with R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *
 * Outputs: backend/asset/achahada-logo-map.json
 * Idempotent: re-uploads overwrite existing objects.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = join(__dirname, "../asset");

// ── R2 Config ──────────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "naqiy";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? "pub-f871593571bd4d04a86a25015aac1057.r2.dev";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// ── Helpers ────────────────────────────────────────────────────────

function extractImageUrl(html: string): string | null {
  if (!html?.trim()) return null;
  const match = html.match(/src="([^"]+)"/);
  if (!match?.[1]) return null;
  // Strip -150x150 suffix for full-res image
  return match[1].replace(/-\d+x\d+(\.\w+)$/, "$1");
}

function contentTypeFromUrl(url: string): string {
  const ext = extname(new URL(url).pathname).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "image/png";
}

async function downloadAndUpload(
  imageUrl: string,
  r2Key: string,
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) return null; // Skip tiny/broken images

    const contentType = response.headers.get("content-type") ?? contentTypeFromUrl(imageUrl);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return `https://${R2_PUBLIC_DOMAIN}/${r2Key}`;
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Uploading Achahada store logos to R2    ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Load Achahada data
  const raw = readFileSync(join(ASSET_DIR, "achahada-all-stores.json"), "utf-8");
  const data = JSON.parse(raw) as {
    stores: Array<{ id: string; store: string; thumb: string }>;
  };

  const logoMap: Record<string, string> = {};
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches of 10 (concurrent)
  const BATCH_SIZE = 10;
  const stores = data.stores.filter((s) => {
    const url = extractImageUrl(s.thumb);
    return url !== null;
  });

  console.log(`  ${stores.length} stores with logos to process\n`);

  for (let i = 0; i < stores.length; i += BATCH_SIZE) {
    const batch = stores.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (store) => {
        const imageUrl = extractImageUrl(store.thumb)!;
        const ext = extname(new URL(imageUrl).pathname).toLowerCase() || ".png";
        const r2Key = `stores/logos/achahada-${store.id}${ext}`;

        const cdnUrl = await downloadAndUpload(imageUrl, r2Key);
        if (cdnUrl) {
          logoMap[store.id] = cdnUrl;
          uploaded++;
        } else {
          failed++;
        }
      }),
    );

    const progress = Math.min(i + BATCH_SIZE, stores.length);
    process.stdout.write(`\r  Progress: ${progress}/${stores.length} (${uploaded} uploaded, ${failed} failed)`);
  }

  console.log(`\n\n  ✓ Uploaded: ${uploaded}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  ○ Skipped (no thumb): ${data.stores.length - stores.length}`);

  // Save mapping file
  const outputPath = join(ASSET_DIR, "achahada-logo-map.json");
  writeFileSync(outputPath, JSON.stringify(logoMap, null, 2), "utf-8");
  console.log(`\n  → Saved logo map: ${outputPath} (${Object.keys(logoMap).length} entries)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
