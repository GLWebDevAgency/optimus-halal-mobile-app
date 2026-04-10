import type { HalalVerdict, ModuleVerdict } from "../types/module-verdict.js";

export interface AggregateResult {
  score: number;
  verdict: HalalVerdict;
}

const STRICTNESS_PENALTY: Record<string, number> = {
  relaxed: 0,
  moderate: 0,
  strict: -5,
  very_strict: -10,
};

/**
 * Combines multiple module verdicts into a final score + verdict.
 * Pure function — no async, no DB, no side effects.
 *
 * Rules (spec section 8.1):
 *  - Any HARAM module -> final HARAM (score = min of haram modules)
 *  - Else: weighted minimum (lower scores pull harder)
 *  - Strictness overlay: strict -5/module, very_strict -10/module
 *  - Score -> verdict: >=90 HALAL, 70-89 HALAL_WITH_CAUTION, 40-69 MASHBOOH, 20-39 AVOID, <20 HARAM
 */
export function aggregate(
  verdicts: ModuleVerdict[],
  strictness: string,
): AggregateResult {
  // Empty verdicts = analyzed clean product
  if (verdicts.length === 0) {
    return { score: 90, verdict: "halal" };
  }

  // Check for any haram module
  const haramModules = verdicts.filter((v) => v.verdict === "haram");
  if (haramModules.length > 0) {
    const minScore = Math.min(...haramModules.map((v) => v.score));
    return { score: clamp(minScore), verdict: scoreToVerdict(clamp(minScore)) };
  }

  // Weighted minimum: lower scores pull harder
  // Formula: 70% minimum score + 30% average, so worst-case dominates
  const minScore = Math.min(...verdicts.map((v) => v.score));
  const avgScore =
    verdicts.reduce((sum, v) => sum + v.score, 0) / verdicts.length;

  let score = minScore * 0.7 + avgScore * 0.3;

  // Apply strictness penalty per module
  const penalty = STRICTNESS_PENALTY[strictness] ?? 0;
  score += penalty * verdicts.length;

  score = clamp(Math.round(score));

  return { score, verdict: scoreToVerdict(score) };
}

function scoreToVerdict(score: number): HalalVerdict {
  if (score >= 90) return "halal";
  if (score >= 70) return "halal_with_caution";
  if (score >= 40) return "mashbooh";
  if (score >= 20) return "avoid";
  return "haram";
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}
