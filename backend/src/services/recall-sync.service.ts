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
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";

// ── API Config ──────────────────────────────────────────────

const BASE_URL =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-trie/records";

const FETCH_TIMEOUT = 20_000;
const PAGE_SIZE = 100;

// ── Types ───────────────────────────────────────────────────

/** Raw record shape from the RappelConso API */
interface RappelConsoRecord {
  reference_fiche: string;
  gtin?: number | null;
  categorie_produit?: string;
  sous_categorie_produit?: string;
  marque_produit?: string;
  noms_des_modeles_ou_references?: string;
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
  const since = options?.since ?? getDefaultSinceDate();

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
          logger.error(`[recall-sync] Failed to upsert ${record.reference_fiche}`, {
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
    `categorie_produit='Alimentation'`,
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
  const ref = record.reference_fiche;
  if (!ref) return "skipped";

  const gtin = record.gtin ? String(record.gtin).padStart(13, "0") : null;

  const values = {
    sourceReference: ref,
    gtin,
    brandName: record.marque_produit ?? null,
    productName: record.noms_des_modeles_ou_references ?? null,
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

  return rows.length > 0 ? "inserted" : "skipped";
}

// ── Helpers ─────────────────────────────────────────────────

function extractFirstUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = raw.match(/https?:\/\/[^\s,;]+/);
  return match?.[0] ?? null;
}

/** Default: sync last 30 days on first run, then daily delta */
function getDefaultSinceDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}
