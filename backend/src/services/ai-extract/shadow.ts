/**
 * Shadow Mode — runs V1 and V2 Gemini extractions in parallel.
 *
 * When feature flag `gemini_v2` is:
 *   "off"    → V1 only (current behavior)
 *   "shadow" → V1 primary + V2 logged (no impact on verdict)
 *   "on"     → V2 only
 *
 * In shadow mode, divergences are logged for Phase 2 convergence analysis.
 */

import { logger } from "../../lib/logger.js";
import type { ExtractionResult } from "./types.js";
import type { GeminiSemanticResult } from "./types.js";

export interface ShadowResult {
  primary: ExtractionResult | GeminiSemanticResult | null;
  source: "v1" | "v2";
  shadowDivergences?: {
    ingredientCountDiff: number;
    additiveCountDiff: number;
    v2SubstancesDetected: string[];
    v2CategoryClassified: string;
    convergent: boolean;
  };
}

export async function runShadowExtraction(
  ingredientsText: string,
  v1Extract: () => Promise<ExtractionResult | null>,
  v2Extract: () => Promise<GeminiSemanticResult | null>,
  mode: "off" | "shadow" | "on",
): Promise<ShadowResult> {
  if (mode === "off") {
    const result = await v1Extract();
    return { primary: result, source: "v1" };
  }

  if (mode === "on") {
    const result = await v2Extract();
    return { primary: result, source: "v2" };
  }

  // Shadow mode: run both, V1 is primary, V2 is logged
  const [v1Result, v2Result] = await Promise.allSettled([v1Extract(), v2Extract()]);

  const v1 = v1Result.status === "fulfilled" ? v1Result.value : null;
  const v2 = v2Result.status === "fulfilled" ? v2Result.value : null;

  if (v2) {
    const ingDiff = Math.abs((v1?.ingredients.length ?? 0) - v2.ingredients.length);
    const addDiff = Math.abs((v1?.additives.length ?? 0) - v2.additives.length);
    const convergent = ingDiff <= 2 && addDiff <= 1;

    const divergences = {
      ingredientCountDiff: ingDiff,
      additiveCountDiff: addDiff,
      v2SubstancesDetected: v2.detected_substances.map(s => s.substance_id),
      v2CategoryClassified: v2.product_category,
      convergent,
    };

    logger.info("Gemini shadow mode comparison", {
      convergent,
      v1Ingredients: v1?.ingredients.length ?? 0,
      v2Ingredients: v2.ingredients.length,
      v1Additives: v1?.additives.length ?? 0,
      v2Additives: v2.additives.length,
      v2Substances: divergences.v2SubstancesDetected.join(","),
    });

    return { primary: v1, source: "v1", shadowDivergences: divergences };
  }

  return { primary: v1, source: "v1" };
}
