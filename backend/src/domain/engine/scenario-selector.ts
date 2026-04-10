import type { SubstanceScenarioView } from "../ports/scenario-repo.js";

export interface SelectedScenario {
  scenarioKey: string;
  score: number;
  verdict: string;
  rationaleFr: string;
  rationaleEn: string | null;
  rationaleAr: string | null;
  specificity: number;
  dossierSectionRef: string | null;
}

export interface DefaultPosition {
  globalScore: number;
  verdict: string;
}

/**
 * Selects the most specific matching scenario for a substance given product context.
 * Pure function — no async, no DB, no side effects.
 *
 * Match logic: each condition key in matchConditions must be satisfied:
 *   - Array value: product context value must be in the array
 *   - Scalar value: product context value must equal
 *
 * Highest specificity wins among matched scenarios.
 * Fallback: __default__ scenario from naqiy_position.
 */
export function selectScenario(
  scenarios: SubstanceScenarioView[],
  productConditions: Record<string, unknown>,
  defaultPosition: DefaultPosition,
): SelectedScenario {
  let bestMatch: SubstanceScenarioView | null = null;

  for (const scenario of scenarios) {
    if (matchesConditions(scenario.matchConditions, productConditions)) {
      if (!bestMatch || scenario.specificity > bestMatch.specificity) {
        bestMatch = scenario;
      }
    }
  }

  if (bestMatch) {
    return {
      scenarioKey: bestMatch.scenarioKey,
      score: bestMatch.score,
      verdict: bestMatch.verdict,
      rationaleFr: bestMatch.rationaleFr,
      rationaleEn: bestMatch.rationaleEn,
      rationaleAr: bestMatch.rationaleAr,
      specificity: bestMatch.specificity,
      dossierSectionRef: bestMatch.dossierSectionRef,
    };
  }

  // Fallback to naqiy_position default
  return {
    scenarioKey: "__default__",
    score: defaultPosition.globalScore,
    verdict: defaultPosition.verdict,
    rationaleFr: "Position Naqiy par défaut",
    rationaleEn: null,
    rationaleAr: null,
    specificity: 0,
    dossierSectionRef: null,
  };
}

function matchesConditions(
  matchConditions: Record<string, unknown>,
  productConditions: Record<string, unknown>,
): boolean {
  for (const [key, expected] of Object.entries(matchConditions)) {
    const actual = productConditions[key];

    if (Array.isArray(expected)) {
      // Array condition: actual value must be in the array
      if (!expected.includes(actual)) {
        return false;
      }
    } else {
      // Scalar condition: must equal
      if (actual !== expected) {
        return false;
      }
    }
  }
  return true;
}
