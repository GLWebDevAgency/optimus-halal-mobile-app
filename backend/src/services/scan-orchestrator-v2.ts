/**
 * ScanOrchestratorV2 — 9-stage pipeline integration (Phase 5).
 *
 * Implements the scan pipeline from spec §6:
 *   Stage 0 — Context Builder (C1: HalalEvaluationContext + RequestContext split)
 *   Stage 1 — Product Resolution (reuses resolveProduct)
 *   Stage 2 — Gemini V2 Extraction (aiExtractIngredientsV2)
 *   Stage 3 — ProductContext Assembly
 *   Stage 4 — Track Routing (certified vs analyzed)
 *   Stage 5 — Parallel secondary engines (health, personal, boycott)
 *   Stage 6 — Alternatives (stub, Phase 7)
 *   Stage 7 — Persist evaluation (C5: single INSERT)
 *   Stage 8 — Response assembly
 *
 * Critical invariants:
 *   C1 — Engines ONLY receive HalalEvaluationContext (no tier/entitlement)
 *   C5 — Evaluation persisted in a single INSERT
 *   ViewOnly — Skip persist entirely
 *   Boycott — null if boycottOptIn is false
 *   PersonalAlerts — empty + upsellHint if canAllergenProfile is false
 */

import type { HalalEngineV2 } from "../domain/engine/halal-engine-v2.js";
import type { CertifierTrustEngine } from "../domain/engine/certifier-trust-engine.js";
import type { IEvaluationStore } from "../domain/ports/evaluation-store.js";
import type { HalalEvaluationContext } from "../domain/types/halal-evaluation-context.js";
import type { ProductContext } from "../domain/types/product-context.js";
import type { HalalReport } from "../domain/types/halal-report.js";
import type { GeminiSemanticResult, ProductCategory, MeatClassification } from "./ai-extract/types.js";
import { evaluatePersonalAlerts, type PersonalReport, type AllergenMatch, type RiskyAdditive } from "./personal-engine.js";
import { evaluateBoycott, type BoycottReport } from "./boycott-engine.js";
import { buildEvaluationTrace, type TraceContext } from "../domain/engine/trace-builder.js";
import { logger } from "../lib/logger.js";

// ── Engine version ───────────────────────────────────────────

const ENGINE_VERSION = "halal-engine-v2.0.0";

// ── Input / Output types ─────────────────────────────────────

export interface ScanOrchestratorInput {
  barcode: string;
  latitude?: number;
  longitude?: number;
  viewOnly?: boolean;
  nutritionProfile?: string;
  scanRequestId?: string; // C5: client-generated UUIDv7 idempotency key
}

export interface UserProfile {
  id: string;
  madhab: string | null;
  halalStrictness: string | null;
  allergens: string[] | null;
  isPregnant: boolean;
  hasChildren: boolean;
  subscriptionTier: "free" | "premium";
  boycottOptIn: boolean;
}

/**
 * RequestContext — carries tier/entitlement info.
 * NEVER passed to halal engines (C1 invariant).
 */
export interface RequestContext {
  tier: "free" | "premium";
  canAllergenProfile: boolean;
  boycottOptIn: boolean;
  allergens: string[] | null;
  isPregnant: boolean;
  hasChildren: boolean;
}

export interface ScanResultDTO {
  product: Record<string, unknown> | null;
  halal: HalalReport;
  health: Record<string, unknown> | null;
  personal: PersonalReport;
  boycott: BoycottReport | null;
  alternatives: null; // Phase 7
  context: {
    engineVersion: string;
    madhab: string;
    tier: string;
    track: string;
  };
  gamification: Record<string, unknown> | null;
}

// ── Dependencies (injected) ──────────────────────────────────

export interface OrchestratorDeps {
  db: any;
  halalEngine: HalalEngineV2;
  certifierTrustEngine: CertifierTrustEngine;
  evaluationStore: IEvaluationStore;
  resolveProduct: (db: any, barcode: string) => Promise<any>;
  aiExtractIngredientsV2: (text: string, hint?: any) => Promise<{ result: any; source: string }>;
  matchAllergens: (userAllergens: string[], allergenTags: string[], tracesTags: string[]) => AllergenMatch[];
  lookupBrandCertifier: (db: any, brand: string) => Promise<{ certifierId: string; certifierName: string } | null>;
  fetchRiskyAdditives: (db: any, codes: string[]) => Promise<RiskyAdditive[]>;
}

// ── Orchestrator ─────────────────────────────────────────────

export class ScanOrchestratorV2 {
  constructor(private deps: OrchestratorDeps) {}

  async execute(
    input: ScanOrchestratorInput,
    user: UserProfile | null,
  ): Promise<ScanResultDTO> {
    const startMs = performance.now();

    // ── STAGE 0 — Context Builder (C1 split) ──────────────
    const evalCtx: HalalEvaluationContext = {
      madhab: (user?.madhab as HalalEvaluationContext["madhab"]) ?? "general",
      strictness: (user?.halalStrictness as HalalEvaluationContext["strictness"]) ?? "moderate",
      lang: "fr",
    };

    const requestCtx: RequestContext = {
      tier: user?.subscriptionTier ?? "free",
      canAllergenProfile: user?.subscriptionTier === "premium",
      boycottOptIn: user?.boycottOptIn ?? false,
      allergens: user?.allergens ?? null,
      isPregnant: user?.isPregnant ?? false,
      hasChildren: user?.hasChildren ?? false,
    };

    // ── STAGE 1 — Product Resolution ──────────────────────
    const resolveStart = performance.now();
    const lookupResult = await this.deps.resolveProduct(this.deps.db, input.barcode);
    const product = lookupResult?.product ?? null;
    const offData = lookupResult?.offData ?? null;
    const resolveMs = performance.now() - resolveStart;
    const resolveSource = lookupResult?.source ?? "unknown";

    // ── STAGE 2 — Gemini V2 Extraction ────────────────────
    const storedOff = offData ?? (product?.offData as Record<string, unknown> | null);
    const ingredientsText =
      (storedOff?.ingredients_text_fr as string) ||
      (storedOff?.ingredients_text as string) ||
      "";

    const extractStart = performance.now();
    let extraction: GeminiSemanticResult | null = null;
    let extractionSource: ProductContext["extractionSource"] = "regex";

    if (ingredientsText) {
      try {
        const result = await this.deps.aiExtractIngredientsV2(ingredientsText, {
          name: product?.name,
          brand: product?.brand,
          categories: storedOff?.categories_tags,
        });
        if (result.result && result.source === "v2") {
          extraction = result.result as GeminiSemanticResult;
          extractionSource = "gemini";
        } else if (result.result) {
          extractionSource = "gemini"; // V1 result from V2 endpoint
        }
      } catch (err) {
        logger.warn("Gemini V2 extraction failed — fallback to OFF data", {
          barcode: input.barcode,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    const extractMs = performance.now() - extractStart;

    // ── STAGE 3 — ProductContext Assembly ──────────────────
    const productContext = this.assembleProductContext(
      input.barcode,
      product,
      storedOff,
      extraction,
      extractionSource,
    );

    // ── STAGE 4 — Track Routing ───────────────────────────
    let halalReport: HalalReport;
    let track: "certified" | "analyzed";

    // Check for certification: labels_tags or brand-certifier lookup
    const certifier = await this.resolveCertification(productContext, storedOff, product);

    const engineStart = performance.now();
    if (certifier) {
      track = "certified";
      halalReport = await this.deps.certifierTrustEngine.evaluate(
        certifier.certifierId,
        { name: product?.name ?? input.barcode, species: productContext.meatClassification?.species },
        evalCtx,
      );
    } else {
      track = "analyzed";
      halalReport = await this.deps.halalEngine.evaluate(productContext, evalCtx);
    }
    const engineMs = performance.now() - engineStart;

    // ── STAGE 5 — Parallel secondary engines ──────────────
    const allergensTags = (storedOff?.allergens_tags as string[]) ?? [];
    const tracesTags = (storedOff?.traces_tags as string[]) ?? [];
    const additivesTags = (storedOff?.additives_tags as string[]) ?? [];

    // Pre-compute allergen matches
    const allergenMatches: AllergenMatch[] =
      requestCtx.allergens?.length
        ? this.deps.matchAllergens(requestCtx.allergens, allergensTags, tracesTags)
        : [];

    // Fetch risky additives for personal alerts
    const additiveCodes = [...new Set(additivesTags.map(this.normalizeAdditiveTag))];

    const [riskyAdditives, boycottReport] = await Promise.all([
      additiveCodes.length > 0
        ? this.deps.fetchRiskyAdditives(this.deps.db, additiveCodes)
        : Promise.resolve([] as RiskyAdditive[]),
      evaluateBoycott(this.deps.db, product?.brand, requestCtx.boycottOptIn),
    ]);

    const personalReport = evaluatePersonalAlerts(
      allergenMatches,
      requestCtx.allergens,
      requestCtx.isPregnant,
      requestCtx.hasChildren,
      riskyAdditives,
      requestCtx.canAllergenProfile,
    );

    // Health engine — TODO: wire from existing health-score.service.ts (Phase 6)
    const healthReport: Record<string, unknown> | null = null;

    // ── STAGE 6 — Alternatives (stub, Phase 7) ───────────
    const alternatives = null;

    // ── STAGE 7 — Persist evaluation (C5) ─────────────────
    const totalMs = performance.now() - startMs;

    if (!input.viewOnly && user) {
      const traceContext: TraceContext = {
        productName: product?.name ?? null,
        barcode: input.barcode,
        resolveSource: resolveSource as TraceContext["resolveSource"],
        resolveMs,
        geminiSource: extraction ? "live" : ingredientsText ? "fallback_regex" : "unavailable",
        extractMs,
        ingredientCount: productContext.ingredientsList.length,
        additiveCount: productContext.additivesTags.length,
        category: productContext.category,
        substancesDetectedCount: productContext.substancesDetected.length,
        track,
        certifierName: certifier?.certifierName,
        matches: productContext.substancesDetected.map((s) => ({
          substanceId: s.substance_id,
          source: s.match_source,
          matchedTerm: s.matched_term,
          confidence: s.confidence,
          priority: 100,
        })),
        scenarioSelections: halalReport.signals.map((s) => ({
          substanceId: s.substanceId,
          scenarioKey: s.scenarioKey,
          specificity: 1,
          baseScore: s.score,
        })),
        madhabResults: halalReport.signals.map((s) => ({
          substanceId: s.substanceId,
          madhab: evalCtx.madhab,
          ruling: s.madhabNote,
          contemporarySplit: !!s.madhabNote,
          scoreBefore: s.score,
          scoreAfter: s.score,
        })),
        madhab: evalCtx.madhab,
        strictness: evalCtx.strictness,
        aggregatedScore: halalReport.score,
        aggregatedVerdict: halalReport.verdict,
        strictnessAdjustment: 0,
        finalScore: halalReport.score,
        finalVerdict: halalReport.verdict,
        confidence: halalReport.confidence,
        engineMs,
        totalMs,
      };

      try {
        await this.deps.evaluationStore.persist({
          scanId: null, // TODO: wire scan ID from existing scan insert
          productId: product?.id ?? null,
          userId: user.id,
          engineVersion: ENGINE_VERSION,
          userMadhab: evalCtx.madhab,
          userStrictness: evalCtx.strictness,
          userTier: requestCtx.tier,
          track,
          modulesFired: halalReport.signals.map((s) => s.substanceId),
          finalScore: halalReport.score,
          finalVerdict: halalReport.verdict,
          status: "ok",
          degradationReason: null,
          trace: buildEvaluationTrace(traceContext),
          durationMs: Math.round(totalMs),
        });
      } catch (err) {
        logger.error("Failed to persist halal evaluation", {
          barcode: input.barcode,
          error: err instanceof Error ? err.message : String(err),
        });
        // Non-fatal: evaluation persist failure should not break the scan
      }
    }

    // ── STAGE 8 — Response assembly ───────────────────────
    return {
      product: product
        ? {
            id: product.id,
            name: product.name,
            brand: product.brand,
            barcode: product.barcode,
            imageUrl: product.imageUrl,
            category: product.category,
          }
        : null,
      halal: halalReport,
      health: healthReport,
      personal: personalReport,
      boycott: boycottReport,
      alternatives,
      context: {
        engineVersion: ENGINE_VERSION,
        madhab: evalCtx.madhab,
        tier: requestCtx.tier,
        track,
      },
      gamification: null, // TODO: wire gamification from existing scan logic
    };
  }

  // ── Private helpers ────────────────────────────────────────

  /**
   * Assemble ProductContext from resolved product, OFF data, and Gemini extraction.
   */
  private assembleProductContext(
    barcode: string,
    product: any | null,
    storedOff: Record<string, unknown> | null,
    extraction: GeminiSemanticResult | null,
    extractionSource: ProductContext["extractionSource"],
  ): ProductContext {
    // Prefer Gemini V2 structured data when available
    if (extraction) {
      return {
        barcode,
        brand: product?.brand ?? null,
        brandOwner: (storedOff?.brand_owner as string) ?? null,
        productName: product?.name ?? null,
        category: extraction.product_category,
        usage: extraction.product_usage,
        meatClassification: extraction.meat_classification,
        substancesDetected: extraction.detected_substances,
        animalSourceHints: extraction.animal_source_hints,
        alcoholContext: extraction.alcohol_context,
        additivesTags: (storedOff?.additives_tags as string[]) ?? [],
        ingredientsList: extraction.ingredients,
        ingredientsText: (storedOff?.ingredients_text as string) ?? null,
        labelsTags: (storedOff?.labels_tags as string[]) ?? [],
        ingredientsAnalysisTags: (storedOff?.ingredients_analysis_tags as string[]) ?? [],
        completeness: (storedOff?.completeness as number) ?? null,
        extractionSource,
      };
    }

    // Fallback: build from OFF data only
    return {
      barcode,
      brand: product?.brand ?? null,
      brandOwner: (storedOff?.brand_owner as string) ?? null,
      productName: product?.name ?? null,
      category: this.inferCategory(storedOff) as ProductCategory,
      usage: "ingestion",
      meatClassification: null,
      substancesDetected: [],
      animalSourceHints: [],
      alcoholContext: { present: false, role: "none" },
      additivesTags: (storedOff?.additives_tags as string[]) ?? [],
      ingredientsList: (product?.ingredients as string[]) ?? [],
      ingredientsText: (storedOff?.ingredients_text as string) ?? null,
      labelsTags: (storedOff?.labels_tags as string[]) ?? [],
      ingredientsAnalysisTags: (storedOff?.ingredients_analysis_tags as string[]) ?? [],
      completeness: (storedOff?.completeness as number) ?? null,
      extractionSource,
    };
  }

  /**
   * Resolve certification: check labels_tags first, then brand-certifier lookup.
   */
  private async resolveCertification(
    productContext: ProductContext,
    storedOff: Record<string, unknown> | null,
    product: any | null,
  ): Promise<{ certifierId: string; certifierName: string } | null> {
    // Check labels_tags for known halal certification labels
    const labelsTags = (storedOff?.labels_tags as string[]) ?? [];
    const HALAL_LABEL_PATTERNS = [
      "en:halal",
      "fr:halal",
      "en:halal-certified",
    ];
    const hasHalalLabel = labelsTags.some((tag) =>
      HALAL_LABEL_PATTERNS.some((p) => tag.toLowerCase().includes(p)),
    );

    // Brand-certifier lookup
    const brandString = (storedOff?.brands as string) ?? product?.brand;
    if (brandString) {
      const brandMatch = await this.deps.lookupBrandCertifier(this.deps.db, brandString);
      if (brandMatch) return brandMatch;
    }

    // If halal label detected but no specific certifier found
    // TODO: map labels_tags to specific certifier IDs (Phase 8)
    if (hasHalalLabel) {
      return null; // For now, fall through to analyzed track
    }

    return null;
  }

  /**
   * Infer product category from OFF categories string.
   */
  private inferCategory(storedOff: Record<string, unknown> | null): string {
    const categories = (storedOff?.categories as string)?.toLowerCase() ?? "";
    if (categories.includes("viande") || categories.includes("meat")) return "meat";
    if (categories.includes("volaille") || categories.includes("poultry")) return "poultry";
    if (categories.includes("poisson") || categories.includes("fish")) return "fish";
    if (categories.includes("bonbon") || categories.includes("candy")) return "candy";
    if (categories.includes("chocolat") || categories.includes("chocolate")) return "chocolate";
    if (categories.includes("fromage") || categories.includes("cheese")) return "cheese";
    if (categories.includes("yaourt") || categories.includes("yogurt")) return "yogurt";
    if (categories.includes("boisson") || categories.includes("beverage")) return "beverage_soft";
    return "other";
  }

  /** Normalize OFF additive tag to canonical DB code: "en:e322i" -> "E322" */
  private normalizeAdditiveTag(tag: string): string {
    return tag.replace(/^en:/, "").toUpperCase().replace(/[a-z]$/i, "");
  }
}
