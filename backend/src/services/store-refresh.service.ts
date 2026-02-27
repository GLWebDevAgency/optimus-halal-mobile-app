/**
 * Store Refresh Service — Live API fetch + transform + upsert pipeline
 *
 * Called by POST /internal/refresh-stores (fire-and-forget).
 * Fetches fresh data from AVS + Achahada APIs, transforms via the
 * shared transformAndDedup() pipeline, uploads new logos to R2,
 * upserts stores + hours to PostgreSQL, and invalidates Redis cache.
 */

import { eq, inArray } from "drizzle-orm";
import { extname } from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../db/index.js";
import { stores, storeHours } from "../db/schema/stores.js";
import { redis } from "../lib/redis.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";
import { invalidateCache } from "../lib/cache.js";
import {
  transformAndDedup,
  type AVSSiteEntry,
  type AVSLegacyEntry,
  type AchahadaEntry,
  type AchahadaAllStoresData,
} from "../db/seeds/stores-halal.js";

// ── API Endpoints ──────────────────────────────────────────────

const AVS_BASE = "https://equinox.avs.fr/v1/website";
const ACHAHADA_API = "https://achahada.com/api/index.php";
const ACHAHADA_PARAMS = "lat=46.6034&lng=2.3522";
const ACHAHADA_FILTERS = [73, 75, 77, 80, 83, 89, 90, 91];
const FETCH_TIMEOUT = 15_000; // 15s per request

// ── Result type ────────────────────────────────────────────────

export interface RefreshResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  storesUpserted: number;
  hoursUpserted: number;
  logosUploaded: number;
  cacheKeysInvalidated: number;
  stats: {
    avsBoucheries: number;
    avsRestaurants: number;
    avsFournisseurs: number;
    avsAbattoirs: number;
    achahadaStores: number;
    finalCount: number;
    deduplicated: number;
  };
  errors: string[];
}

// ── Fetch helpers ──────────────────────────────────────────────

async function fetchJson<T>(url: string, label: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!res.ok) {
      logger.warn(`Refresh: ${label} HTTP ${res.status}`, { url });
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.warn(`Refresh: ${label} failed`, { url, error: (err as Error).message });
    return null;
  }
}

// ── Logo upload (delta only) ───────────────────────────────────

function extractImageUrl(html: string): string | null {
  if (!html?.trim()) return null;
  const match = html.match(/src="([^"]+)"/);
  if (!match?.[1]) return null;
  return match[1].replace(/-\d+x\d+(\.\w+)$/, "$1");
}

function getS3Client(): S3Client | null {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

async function r2ObjectExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadNewLogos(
  achahadaStores: AchahadaEntry[],
  existingSourceIds: Set<string>,
): Promise<Record<string, string>> {
  const logoMap: Record<string, string> = {};
  const s3 = getS3Client();
  if (!s3) {
    logger.warn("Refresh: R2 non configuré — logos ignorés");
    return logoMap;
  }

  const newStores = achahadaStores.filter((s) => !existingSourceIds.has(`achahada-${s.id}`));
  const withThumb = newStores.filter((s) => extractImageUrl(s.thumb));

  logger.info("Refresh: logos delta", {
    total: achahadaStores.length,
    existing: existingSourceIds.size,
    newWithThumb: withThumb.length,
  });

  // Process in batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < withThumb.length; i += BATCH_SIZE) {
    const batch = withThumb.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (store) => {
        const imageUrl = extractImageUrl(store.thumb)!;
        const ext = extname(new URL(imageUrl).pathname).toLowerCase() || ".png";
        const r2Key = `stores/logos/achahada-${store.id}${ext}`;

        // Skip if already exists in R2
        if (await r2ObjectExists(s3, r2Key)) {
          logoMap[store.id] = `https://${env.R2_PUBLIC_DOMAIN}/${r2Key}`;
          return;
        }

        try {
          const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
          if (!response.ok) return;
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.length < 100) return;

          const contentType = response.headers.get("content-type") ?? "image/png";
          await s3.send(
            new PutObjectCommand({
              Bucket: env.R2_BUCKET_NAME,
              Key: r2Key,
              Body: buffer,
              ContentType: contentType,
              CacheControl: "public, max-age=31536000, immutable",
            }),
          );
          logoMap[store.id] = `https://${env.R2_PUBLIC_DOMAIN}/${r2Key}`;
        } catch { /* skip failed logo */ }
      }),
    );
  }

  return logoMap;
}

// ── Existing logo map from DB ──────────────────────────────────

async function getExistingLogoMap(): Promise<Record<string, string>> {
  const rows = await db
    .select({ sourceId: stores.sourceId, logoUrl: stores.logoUrl })
    .from(stores)
    .where(eq(stores.certifier, "achahada"));

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.sourceId && row.logoUrl) {
      const achahadaId = row.sourceId.replace("achahada-", "");
      map[achahadaId] = row.logoUrl;
    }
  }
  return map;
}

// ── Main refresh pipeline ──────────────────────────────────────

export async function refreshStores(): Promise<RefreshResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const errors: string[] = [];

  // ── 1. Fetch from APIs in parallel ──────────────────────
  const [avsBoucheries, avsRestaurants, avsFournisseurs, achahadaBase] = await Promise.all([
    fetchJson<AVSSiteEntry[]>(`${AVS_BASE}/sites/br?type=1`, "AVS Boucheries"),
    fetchJson<AVSSiteEntry[]>(`${AVS_BASE}/sites/br?type=2`, "AVS Restaurants"),
    fetchJson<AVSSiteEntry[]>(`${AVS_BASE}/providers`, "AVS Fournisseurs"),
    fetchJson<AchahadaEntry[]>(
      `${ACHAHADA_API}?action=store_search&${ACHAHADA_PARAMS}&filter=74&lang=fr`,
      "Achahada base",
    ),
  ]);

  if (!avsBoucheries) errors.push("AVS Boucheries fetch failed");
  if (!avsRestaurants) errors.push("AVS Restaurants fetch failed");
  if (!avsFournisseurs) errors.push("AVS Fournisseurs fetch failed");

  // Abattoirs: no public API, keep existing DB data (imported from static JSON on deploy)
  const avsAbattoirs: AVSLegacyEntry[] = [];

  // ── 2. Fetch Achahada category mappings ─────────────────
  let achahadaData: AchahadaAllStoresData;
  if (achahadaBase) {
    const categoryMap: Record<string, number[]> = {};
    const filterResults = await Promise.allSettled(
      ACHAHADA_FILTERS.map(async (fid) => {
        const data = await fetchJson<AchahadaEntry[]>(
          `${ACHAHADA_API}?action=store_search&${ACHAHADA_PARAMS}&filter=${fid}&lang=fr`,
          `Achahada filter=${fid}`,
        );
        return { fid, data };
      }),
    );

    for (const result of filterResults) {
      if (result.status === "fulfilled" && result.value.data) {
        for (const s of result.value.data) {
          if (!categoryMap[s.id]) categoryMap[s.id] = [];
          categoryMap[s.id].push(result.value.fid);
        }
      }
    }

    achahadaData = {
      stores: achahadaBase,
      categoryMap,
      fetchedAt: new Date().toISOString(),
    };
  } else {
    errors.push("Achahada base fetch failed — skipping Achahada entirely");
    achahadaData = { stores: [], categoryMap: {}, fetchedAt: new Date().toISOString() };
  }

  // ── 3. Logo delta: get existing + upload new ────────────
  const existingLogoMap = await getExistingLogoMap();
  const existingSourceIds = new Set(
    (await db.select({ sourceId: stores.sourceId }).from(stores))
      .map((r) => r.sourceId)
      .filter((s): s is string => s !== null),
  );

  const newLogoMap = await uploadNewLogos(achahadaData.stores, existingSourceIds);
  const mergedLogoMap = { ...existingLogoMap, ...newLogoMap };

  // ── 4. Transform + dedup ────────────────────────────────
  const { stores: storeData, hours: hoursData, stats, droppedSourceIds } = transformAndDedup(
    avsBoucheries ?? [],
    avsRestaurants ?? [],
    avsFournisseurs ?? [],
    avsAbattoirs,
    achahadaData,
    mergedLogoMap,
  );

  // Bail early if no data at all (all APIs failed)
  if (storeData.length === 0) {
    const result: RefreshResult = {
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      storesUpserted: 0,
      hoursUpserted: 0,
      logosUploaded: Object.keys(newLogoMap).length,
      cacheKeysInvalidated: 0,
      stats: {
        avsBoucheries: 0,
        avsRestaurants: 0,
        avsFournisseurs: 0,
        avsAbattoirs: 0,
        achahadaStores: 0,
        finalCount: 0,
        deduplicated: 0,
      },
      errors: [...errors, "Aucune donnée à upserter — toutes les APIs ont échoué"],
    };
    await redis.setex("store-refresh:last-run", 7 * 86400, JSON.stringify(result));
    return result;
  }

  // ── 5. Upsert stores ───────────────────────────────────
  let storesUpserted = 0;
  for (const store of storeData) {
    await db
      .insert(stores)
      .values(store)
      .onConflictDoUpdate({
        target: stores.sourceId,
        set: {
          name: store.name,
          storeType: store.storeType,
          address: store.address,
          city: store.city,
          postalCode: store.postalCode,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          email: store.email,
          website: store.website,
          logoUrl: store.logoUrl,
          description: store.description,
          certifier: store.certifier,
          certifierName: store.certifierName,
          rawData: store.rawData,
          updatedAt: new Date(),
        },
      });
    storesUpserted++;
  }

  // ── 5b. Delete zombie duplicates (dedup losers from previous runs) ──
  let zombiesDeleted = 0;
  if (droppedSourceIds.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < droppedSourceIds.length; i += BATCH) {
      const batch = droppedSourceIds.slice(i, i + BATCH);
      const deleted = await db.delete(stores).where(inArray(stores.sourceId, batch)).returning({ id: stores.id });
      zombiesDeleted += deleted.length;
    }
  }

  // ── 6. Upsert hours ────────────────────────────────────
  let hoursUpserted = 0;
  if (hoursData.length > 0) {
    const sourceIdToStoreId = new Map<string, string>();
    const achahadaSourceIds = [...new Set(hoursData.map((h) => h.sourceId))];

    for (const sourceId of achahadaSourceIds) {
      const [row] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.sourceId, sourceId))
        .limit(1);
      if (row) sourceIdToStoreId.set(sourceId, row.id);
    }

    for (const [sourceId, storeId] of sourceIdToStoreId) {
      await db.delete(storeHours).where(eq(storeHours.storeId, storeId));

      const rows = hoursData
        .filter((h) => h.sourceId === sourceId)
        .map((h) => ({
          storeId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }));

      if (rows.length > 0) {
        await db.insert(storeHours).values(rows);
        hoursUpserted += rows.length;
      }
    }
  }

  // ── 7. Invalidate cache ─────────────────────────────────
  const cacheKeysInvalidated = await invalidateCache(redis, "stores:v8:*");

  // ── 8. Store result ─────────────────────────────────────
  const result: RefreshResult = {
    success: true,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    storesUpserted,
    hoursUpserted,
    logosUploaded: Object.keys(newLogoMap).length,
    cacheKeysInvalidated,
    stats: {
      avsBoucheries: avsBoucheries?.length ?? 0,
      avsRestaurants: avsRestaurants?.length ?? 0,
      avsFournisseurs: avsFournisseurs?.length ?? 0,
      avsAbattoirs: 0,
      achahadaStores: achahadaData.stores.length,
      finalCount: stats.finalCount,
      deduplicated: stats.deduplicated,
    },
    errors,
  };

  await redis.setex("store-refresh:last-run", 7 * 86400, JSON.stringify(result));

  logger.info("Refresh magasins terminé", {
    durationMs: result.durationMs,
    storesUpserted,
    hoursUpserted,
    zombiesDeleted,
    logosUploaded: result.logosUploaded,
    cacheKeysInvalidated,
    finalCount: stats.finalCount,
  });

  return result;
}
