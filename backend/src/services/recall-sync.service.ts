/**
 * Recall Sync Service — RappelConso government data pipeline
 *
 * Fetches food safety recalls from the French government open data API
 * (data.economie.gouv.fr), transforms them, and upserts into product_recalls.
 *
 * Called by POST /internal/sync-recalls (cron, daily 6h CET).
 *
 * Moderation flow:
 *   auto_approve=true  → status='approved' immediately (default in cron)
 *   auto_approve=false → status='pending', admin reviews in dashboard
 *
 * Data source: RappelConso V2 (Licence Ouverte v2.0, free commercial use)
 * API docs: https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-trie/api/
 */

import { db } from "../db/index.js";
import { productRecalls } from "../db/schema/product-recalls.js";
import { alerts } from "../db/schema/alerts.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";
import { redis } from "../lib/redis.js";

// ── API Config ──────────────────────────────────────────────

const BASE_URL =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-trie/records";

const FETCH_TIMEOUT = 20_000;
const PAGE_SIZE = 100;

// ── Types ───────────────────────────────────────────────────

/** Raw record shape from the RappelConso API */
/** Raw record from RappelConso V2 API (gtin-trie dataset) */
interface RappelConsoRecord {
  id?: number;
  numero_fiche: string;
  gtin?: number | null;
  categorie_produit?: string;
  sous_categorie_produit?: string;
  marque_produit?: string;
  modeles_ou_references?: string;
  libelle?: string;
  motif_rappel?: string;
  risques_encourus?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  preconisations_sanitaires?: string;
  distributeurs?: string;
  zone_geographique_de_vente?: string;
  liens_vers_les_images?: string;
  lien_vers_affichette_pdf?: string;
  lien_vers_la_fiche_rappel?: string;
  date_publication?: string;
  date_de_fin_de_la_procedure_de_rappel?: string;
  date_debut_commercialisation?: string;
  date_date_fin_commercialisation?: string;
  identification_produits?: string;
  modalites_de_compensation?: string;
  nature_juridique_rappel?: string;
  numero_contact?: string;
  temperature_conservation?: string;
}

export interface RecallSyncResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  fetched: number;
  inserted: number;
  skippedDuplicates: number;
  errors: number;
}

// ── Core Sync Function ──────────────────────────────────────

export async function syncRecalls(options?: {
  /** Only fetch recalls published after this date (ISO string) */
  since?: string;
  /** Auto-approve fetched recalls (default: true for cron) */
  autoApprove?: boolean;
  /** Max pages to fetch (safety valve, default: 10 = 1000 records) */
  maxPages?: number;
}): Promise<RecallSyncResult> {
  const startedAt = new Date().toISOString();
  const autoApprove = options?.autoApprove ?? true;
  const maxPages = options?.maxPages ?? 10;
  const since = options?.since ?? await getSmartSinceDate();

  let fetched = 0;
  let inserted = 0;
  let skippedDuplicates = 0;
  let errors = 0;

  try {
    logger.info(`[recall-sync] Starting sync since=${since} autoApprove=${autoApprove}`);

    let offset = 0;
    let hasMore = true;
    let page = 0;

    while (hasMore && page < maxPages) {
      const records = await fetchPage(since, offset);
      fetched += records.length;

      if (records.length < PAGE_SIZE) {
        hasMore = false;
      }

      for (const record of records) {
        try {
          const result = await upsertRecall(record, autoApprove);
          if (result === "inserted") inserted++;
          else skippedDuplicates++;
        } catch (err: unknown) {
          errors++;
          logger.error(`[recall-sync] Failed to upsert ${record.numero_fiche}`, {
            error: err instanceof Error ? err.message : String(err),
          });
          Sentry?.captureException(err);
        }
      }

      offset += PAGE_SIZE;
      page++;
    }

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    const result: RecallSyncResult = {
      success: true,
      startedAt,
      completedAt,
      durationMs,
      fetched,
      inserted,
      skippedDuplicates,
      errors,
    };

    logger.info(`[recall-sync] Complete: ${inserted} inserted, ${skippedDuplicates} dupes, ${errors} errors (${durationMs}ms)`);

    // Persist sync date so next run only fetches the delta
    await persistSyncDate(startedAt.split("T")[0]);

    return result;
  } catch (err: unknown) {
    logger.error("[recall-sync] Fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry?.captureException(err);

    return {
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
      fetched,
      inserted,
      skippedDuplicates,
      errors: errors + 1,
    };
  }
}

// ── API Fetcher ─────────────────────────────────────────────

async function fetchPage(since: string, offset: number): Promise<RappelConsoRecord[]> {
  const where = [
    `categorie_produit='alimentation'`,
    `date_publication>='${since}'`,
  ].join(" AND ");

  const params = new URLSearchParams({
    where,
    order_by: "date_publication DESC",
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });

  const url = `${BASE_URL}?${params}`;
  logger.info(`[recall-sync] Fetching offset=${offset}: ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`RappelConso API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { results: RappelConsoRecord[] };
  return data.results ?? [];
}

// ── Transform + Upsert ──────────────────────────────────────

async function upsertRecall(
  record: RappelConsoRecord,
  autoApprove: boolean,
): Promise<"inserted" | "skipped"> {
  const ref = record.numero_fiche;
  if (!ref) return "skipped";

  const gtin = record.gtin ? String(record.gtin).padStart(13, "0") : null;

  const values = {
    sourceReference: ref,
    gtin,
    brandName: record.marque_produit ?? null,
    productName: record.modeles_ou_references ?? null,
    subCategory: record.sous_categorie_produit ?? null,
    recallReason: record.motif_rappel ?? "Motif non précisé",
    healthRisks: record.risques_encourus ?? null,
    consumerActions: record.conduites_a_tenir_par_le_consommateur ?? null,
    healthPrecautions: record.preconisations_sanitaires ?? null,
    distributors: record.distributeurs ?? null,
    geoScope: record.zone_geographique_de_vente ?? null,
    imageUrl: extractFirstUrl(record.liens_vers_les_images),
    pdfUrl: record.lien_vers_affichette_pdf ?? null,
    sourceUrl: record.lien_vers_la_fiche_rappel ?? null,
    lotIdentification: record.identification_produits ?? null,
    saleStartDate: record.date_debut_commercialisation ?? null,
    saleEndDate: record.date_date_fin_commercialisation ?? null,
    temperatureStorage: record.temperature_conservation ?? null,
    compensation: record.modalites_de_compensation ?? null,
    legalNature: record.nature_juridique_rappel ?? null,
    contactNumber: record.numero_contact ?? null,
    status: autoApprove ? "approved" : "pending",
    autoApproved: autoApprove,
    publishedAt: record.date_publication
      ? new Date(record.date_publication)
      : new Date(),
    recallEndDate: record.date_de_fin_de_la_procedure_de_rappel
      ? new Date(record.date_de_fin_de_la_procedure_de_rappel)
      : null,
  };

  const rows = await db
    .insert(productRecalls)
    .values(values)
    .onConflictDoNothing({ target: productRecalls.sourceReference })
    .returning({ id: productRecalls.id });

  // Auto-create a critical alert for each new recall
  if (rows.length > 0) {
    const recallId = rows[0].id;
    const brand = (values.brandName ?? "").trim();
    const product = (record.libelle ?? values.productName ?? "").trim();
    const title = brand && product
      ? `Rappel : ${brand} — ${product}`.slice(0, 255)
      : `Rappel produit : ${values.recallReason}`.slice(0, 255);

    // Build structured summary
    const summary = [
      values.recallReason,
      values.healthRisks ? ` — ${values.healthRisks}` : "",
    ].join("").slice(0, 500);

    // Build rich content with all available data
    const contentParts: string[] = [
      `**Motif du rappel** : ${values.recallReason}`,
    ];
    if (values.healthRisks) contentParts.push(`\n\n**Risques encourus** : ${values.healthRisks}`);
    if (record.conduites_a_tenir_par_le_consommateur) {
      const actions = record.conduites_a_tenir_par_le_consommateur.replace(/\|/g, ", ");
      contentParts.push(`\n\n**Que faire** : ${actions}`);
    }
    if (values.healthPrecautions) contentParts.push(`\n\n**Precautions sanitaires** : ${values.healthPrecautions}`);
    if (record.modalites_de_compensation) contentParts.push(`\n\n**Compensation** : ${record.modalites_de_compensation}`);
    if (values.distributors) contentParts.push(`\n\n**Distributeurs concernes** : ${values.distributors}`);
    if (values.geoScope) contentParts.push(`\n\n**Zone geographique** : ${values.geoScope}`);
    if (record.identification_produits) {
      const lots = record.identification_produits.replace(/\$/g, " | ").trim();
      contentParts.push(`\n\n**Identification** : ${lots}`);
    }
    if (record.date_debut_commercialisation) contentParts.push(`\n\n**Commercialisation** : du ${record.date_debut_commercialisation}${record.date_date_fin_commercialisation ? ` au ${record.date_date_fin_commercialisation}` : ""}`);
    if (record.temperature_conservation) contentParts.push(`\n\n**Conservation** : ${record.temperature_conservation}`);
    if (record.nature_juridique_rappel) contentParts.push(`\n\n**Nature du rappel** : ${record.nature_juridique_rappel}`);
    if (record.numero_contact) contentParts.push(`\n\n**Contact** : ${record.numero_contact}`);
    if (values.pdfUrl) contentParts.push(`\n\n**Affichette PDF** : ${values.pdfUrl}`);

    try {
      await db
        .insert(alerts)
        .values({
          title,
          summary,
          content: contentParts.join(""),
          severity: "critical",
          priority: "critical",
          categoryId: "recall",
          imageUrl: values.imageUrl,
          sourceUrl: values.sourceUrl,
          productRecallId: recallId,
          isActive: autoApprove,
          publishedAt: values.publishedAt,
        })
        .onConflictDoNothing();
    } catch (err: unknown) {
      // Non-blocking: log but don't fail the recall sync
      logger.error(`[recall-sync] Failed to create alert for ${ref}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return rows.length > 0 ? "inserted" : "skipped";
}

// ── Helpers ─────────────────────────────────────────────────

function extractFirstUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = raw.match(/https?:\/\/[^\s,;]+/);
  return match?.[0] ?? null;
}

const REDIS_LAST_SYNC_KEY = "recall-sync:last-since";

/**
 * Smart since date:
 *   - First run (no Redis key): fetch last 30 days (bootstrap)
 *   - Subsequent runs: fetch since last successful sync date (delta only)
 *
 * This avoids re-fetching the same 1000 records every day.
 * The ON CONFLICT DO NOTHING is still a safety net for edge cases.
 */
async function getSmartSinceDate(): Promise<string> {
  const lastSince = await redis.get(REDIS_LAST_SYNC_KEY);
  if (lastSince) return lastSince;

  // First run: bootstrap with last 30 days
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

/** Persist the sync date after a successful run */
async function persistSyncDate(date: string): Promise<void> {
  // Keep forever (no TTL) — overwritten on each successful sync
  await redis.set(REDIS_LAST_SYNC_KEY, date);
}
