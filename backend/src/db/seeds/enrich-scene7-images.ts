/**
 * Leclerc Scene7 → R2 — Product Image Enrichment Pipeline
 *
 * Downloads professional product photos from Leclerc's Adobe Scene7 CDN
 * and mirrors them to our Cloudflare R2 bucket, keyed by EAN.
 *
 * Scene7 URL pattern:
 *   - Front (default):  /is/image/gtinternet/{EAN}
 *   - Extra angles:     /is/image/gtinternet/{EAN}_2  …  {EAN}_N
 *   (Angles are rotations of the same packaging — only front is useful)
 *
 * R2 key format:       products/{EAN}/front.jpg
 * DB column updated:   products.imageR2Key
 *
 * Modes:
 *   PROBE   — HEAD-only pass to measure hit rate (no download, no R2)
 *   ENRICH  — Download front + upload to R2 + update DB (default)
 *   UPGRADE — Like ENRICH but also replaces existing imageR2Key
 *
 * Multi-image support (--all-angles):
 *   Scene7 stores multiple angles per EAN: {EAN}, {EAN}_2, {EAN}_3 … {EAN}_N
 *   Default: only front image (no suffix) → products/{EAN}/front.jpg
 *   With --all-angles: also downloads _2…_N → products/{EAN}/angle_{N}.jpg
 *   (Useful for marketplace product galleries)
 *
 * EAN scope filters:
 *   --fr-only   — Only French EANs (300-379, ~416K products)
 *   --eu        — France + Europe, excludes 0xx (US) & 2xx (in-store weight codes)
 *   --food-only — Exclude non-food categories (hygiene, pet-food, tobacco, etc.)
 *
 * The pipeline is resumable: products with an existing imageR2Key are
 * skipped in ENRICH mode. Re-run safely without duplicates.
 *
 * Usage:
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --probe --sample 5000
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --probe --full
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --limit 10000
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --upgrade
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --all-angles
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --fr-only
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --eu --food-only
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --hits-file scene7-hits.json
 *   source .env && pnpm tsx src/db/seeds/enrich-scene7-images.ts --dry-run
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../schema/products.js";
import { eq, sql, isNull, and, isNotNull } from "drizzle-orm";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// ── CLI Args ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const param = (name: string, fallback: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const MODE_PROBE = flag("probe");
const MODE_UPGRADE = flag("upgrade");
const ALL_ANGLES = flag("all-angles");
const DRY_RUN = flag("dry-run");
const FULL = flag("full");
const FR_ONLY = flag("fr-only"); // Only French EANs (300-379)
const EU_ONLY = flag("eu"); // France + Europe (exclude 0xx/2xx)
const EXCLUDE_NON_FOOD = flag("food-only"); // Exclude known non-food categories
const HITS_FILE = param("hits-file", "scene7-hits.json");
const LIMIT = FULL ? 999_999 : parseInt(param("limit", MODE_PROBE ? "2000" : "999999"));
const SAMPLE = parseInt(param("sample", "2000"));
const CONCURRENCY = parseInt(param("concurrency", MODE_PROBE ? "40" : "10"));

// ── Constants ────────────────────────────────────────────────

const SCENE7_CDN = "https://e-leclerc.scene7.com/is/image/gtinternet";
const SCENE7_PARAMS_PROBE = "wid=10&hei=10&fmt=jpg"; // Tiny for HEAD/probe
const SCENE7_PARAMS_DOWNLOAD = "wid=800&hei=800&fmt=jpg&qlt=85";
const TIMEOUT_MS = MODE_PROBE ? 4000 : 8000;
const MIN_IMAGE_SIZE = 5_000; // Scene7 placeholder images are < 5KB
const MAX_ANGLES = 5; // Max extra angles to probe (_2 through _6)
const BUCKET = process.env.R2_BUCKET_NAME ?? "naqiy";
const PROGRESS_INTERVAL = MODE_PROBE ? 500 : 200;

// ── R2 Client ────────────────────────────────────────────────

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
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

// ── Scene7 Fetch ─────────────────────────────────────────────

async function probeScene7(ean: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${SCENE7_CDN}/${ean}?${SCENE7_PARAMS_PROBE}`, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Naqiy-ImageProbe/1.0" },
    });
    clearTimeout(timer);
    return resp.ok;
  } catch {
    return false;
  }
}

async function downloadScene7(ean: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${SCENE7_CDN}/${ean}?${SCENE7_PARAMS_DOWNLOAD}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Naqiy-ImageSync/1.0" },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    return buf.length >= MIN_IMAGE_SIZE ? buf : null;
  } catch {
    return null;
  }
}

async function downloadScene7Angles(
  ean: string,
): Promise<{ suffix: number; data: Buffer }[]> {
  const results: { suffix: number; data: Buffer }[] = [];
  for (let n = 2; n <= MAX_ANGLES + 1; n++) {
    const data = await downloadScene7(`${ean}_${n}`);
    if (!data) break; // Consecutive numbering — stop at first miss
    results.push({ suffix: n, data });
  }
  return results;
}

// ── R2 Upload ────────────────────────────────────────────────

async function uploadToR2(
  s3: S3Client,
  key: string,
  data: Buffer,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: { source: "leclerc-scene7", ts: new Date().toISOString() },
    }),
  );
}

// ── Worker Pool ──────────────────────────────────────────────

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

// ── Progress Reporter ────────────────────────────────────────

function reporter(total: number) {
  const t0 = Date.now();
  let processed = 0;
  return {
    tick() { processed++; },
    get count() { return processed; },
    shouldLog() { return processed % PROGRESS_INTERVAL === 0 || processed === total; },
    line(extra: string) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const rate = (processed / (Date.now() - t0) * 1000).toFixed(0);
      return `  ${processed}/${total} (${rate}/s, ${elapsed}s) ${extra}`;
    },
    summary() {
      return `${((Date.now() - t0) / 1000).toFixed(1)}s`;
    },
  };
}

// ── Load EANs ────────────────────────────────────────────────

async function loadEans(db: ReturnType<typeof drizzle>): Promise<string[]> {
  // Option 1: from a pre-probed hits file
  if (!MODE_PROBE && existsSync(HITS_FILE)) {
    const eans: string[] = JSON.parse(readFileSync(HITS_FILE, "utf-8"));
    console.log(`Loaded ${eans.length} EANs from ${HITS_FILE}`);
    return eans.slice(0, LIMIT);
  }

  // Option 2: from DB
  const conditions = [isNotNull(products.barcode)];
  if (!MODE_PROBE && !MODE_UPGRADE) {
    conditions.push(isNull(products.imageR2Key));
  }

  // EAN origin filters — Scene7 Leclerc only carries French/European products
  if (FR_ONLY) {
    // French EANs: 300-379 (excludes in-store 2xx, US 0xx, non-EU)
    conditions.push(sql`LEFT(${products.barcode}, 2) BETWEEN '30' AND '37'`);
  } else if (EU_ONLY) {
    // Auto-exclude 2xx (in-store weight codes) and 0xx (US/Canada) — never on Scene7
    conditions.push(sql`LEFT(${products.barcode}, 1) NOT IN ('0', '2')`);
  }

  // Exclude known non-food categories (cosmetics, pet-food, cleaning, tobacco)
  if (EXCLUDE_NON_FOOD) {
    conditions.push(sql`(${products.category} IS NULL OR ${products.category} NOT ILIKE ANY(ARRAY[
      '%hygiène%','%hygiene%','%beauty%','%beauté%','%cosmét%','%cosmet%',
      '%pet%food%','%animal%','%nettoy%','%clean%','%détergent%','%detergent%',
      '%soin%','%shampo%','%savon%','%soap%','%denti%','%tooth%',
      '%lessive%','%laundry%','%tobacco%','%tabac%','%cigarette%'
    ]))`);
  }

  const limit = MODE_PROBE ? (FULL ? 999_999 : SAMPLE) : LIMIT;
  const order = MODE_PROBE ? sql`RANDOM()` : products.barcode;

  const rows = await db
    .select({ barcode: products.barcode })
    .from(products)
    .where(and(...conditions))
    .orderBy(order)
    .limit(limit);

  const scopeTag = FR_ONLY ? " [FR]" : EU_ONLY ? " [EU]" : "";
  const foodTag = EXCLUDE_NON_FOOD ? " [food-only]" : "";
  const label = MODE_PROBE
    ? `${rows.length} random EANs${scopeTag}${foodTag}`
    : MODE_UPGRADE
      ? `${rows.length} EANs (all, upgrade mode)${scopeTag}${foodTag}`
      : `${rows.length} EANs (no imageR2Key)${scopeTag}${foodTag}`;
  console.log(`Queried ${label} from DB`);

  return rows.map((r) => r.barcode);
}

// ── PROBE Mode ───────────────────────────────────────────────

async function runProbe(eans: string[]) {
  console.log(`\nProbing Scene7 (HEAD only, ${CONCURRENCY} concurrent)...\n`);
  const hits: string[] = [];
  let errors = 0;
  const progress = reporter(eans.length);

  await pool(eans, CONCURRENCY, async (ean, idx) => {
    const ok = await probeScene7(ean);
    if (ok) hits.push(ean);
    else if (!ok) errors++; // includes 403 + timeouts
    progress.tick();
    if (progress.shouldLog()) {
      console.log(progress.line(`| hits ${hits.length} (${((hits.length / progress.count) * 100).toFixed(1)}%)`));
    }
  });

  const hitPct = ((hits.length / eans.length) * 100).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Scene7 Probe — ${progress.summary()}`);
  console.log(`  Tested:   ${eans.length}`);
  console.log(`  Hits:     ${hits.length} (${hitPct}%)`);
  console.log(`  Misses:   ${eans.length - hits.length}`);
  console.log(`  Projected on 817K: ~${Math.round(817_000 * hits.length / eans.length).toLocaleString()} images`);
  console.log(`${"═".repeat(60)}`);

  if (hits.length > 0) {
    writeFileSync(HITS_FILE, JSON.stringify(hits, null, 2));
    console.log(`\nSaved ${hits.length} hit EANs → ${HITS_FILE}`);
    console.log(`Next: pnpm tsx src/db/seeds/enrich-scene7-images.ts --hits-file ${HITS_FILE}`);
  }
}

// ── ENRICH Mode ──────────────────────────────────────────────

async function runEnrich(eans: string[], db: ReturnType<typeof drizzle>) {
  const s3 = DRY_RUN ? null : getS3Client();
  const mode = DRY_RUN ? "DRY RUN" : MODE_UPGRADE ? "UPGRADE" : "ENRICH";
  console.log(`\nEnriching (${mode}, ${CONCURRENCY} concurrent)...\n`);

  let downloaded = 0;
  let uploaded = 0;
  let angleUploaded = 0;
  let skipped = 0;
  let failed = 0;
  const progress = reporter(eans.length);

  await pool(eans, CONCURRENCY, async (ean, idx) => {
    // Download front image from Scene7
    const data = DRY_RUN ? null : await downloadScene7(ean);

    if (!DRY_RUN && !data) {
      skipped++;
      progress.tick();
      return;
    }

    downloaded++;
    const r2Key = `products/${ean}/front.jpg`;

    if (DRY_RUN) {
      uploaded++;
    } else {
      try {
        await uploadToR2(s3!, r2Key, data!);
        await db
          .update(products)
          .set({ imageR2Key: r2Key })
          .where(eq(products.barcode, ean));
        uploaded++;

        // Download extra angles if requested (marketplace gallery)
        if (ALL_ANGLES) {
          const angles = await downloadScene7Angles(ean);
          for (const { suffix, data: angleData } of angles) {
            await uploadToR2(s3!, `products/${ean}/angle_${suffix}.jpg`, angleData);
            angleUploaded++;
          }
        }
      } catch (err) {
        failed++;
        if (failed <= 10) {
          console.error(`  ERR ${ean}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    progress.tick();
    if (progress.shouldLog()) {
      const extra = ALL_ANGLES ? ` | angles ${angleUploaded}` : "";
      console.log(progress.line(
        `| R2 ${uploaded} | skip ${skipped} | err ${failed}${extra}`,
      ));
    }
  });

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Scene7 Enrichment — ${progress.summary()}`);
  console.log(`  Processed:    ${eans.length}`);
  console.log(`  Downloaded:   ${downloaded}`);
  console.log(`  Uploaded R2:  ${uploaded} front`);
  if (ALL_ANGLES) {
    console.log(`  Angles R2:    ${angleUploaded}`);
  }
  console.log(`  No image:     ${skipped}`);
  console.log(`  Failed:       ${failed}`);
  if (uploaded > 0) {
    console.log(`  R2 key format: products/{EAN}/front.jpg`);
    if (ALL_ANGLES) console.log(`                 products/{EAN}/angle_{N}.jpg`);
    console.log(`  Served via:    withResolvedImage() → R2 CDN`);
  }
  console.log(`${"═".repeat(60)}`);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const modeLabel = MODE_PROBE ? "PROBE" : ALL_ANGLES ? "ENRICH + ANGLES" : "ENRICH";
  const scope = FR_ONLY ? "FR (300-379)" : EU_ONLY ? "EU (no 0xx/2xx)" : "ALL";
  console.log(`Scene7 Image Pipeline — ${modeLabel}`);
  console.log(`  CDN:         ${SCENE7_CDN}`);
  console.log(`  R2 bucket:   ${BUCKET}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  EAN scope:   ${scope}`);
  if (EXCLUDE_NON_FOOD) console.log(`  Filter:      food-only (exclude hygiene/pet/tobacco)`);
  if (ALL_ANGLES) console.log(`  Angles:      up to ${MAX_ANGLES} per EAN`);
  if (DRY_RUN) console.log(`  DRY RUN`);
  console.log();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 8 });
  const db = drizzle(client);

  const eans = await loadEans(db);
  if (eans.length === 0) {
    console.log("Nothing to process.");
    await client.end();
    return;
  }

  if (MODE_PROBE) {
    await runProbe(eans);
  } else {
    await runEnrich(eans, db);
  }

  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
