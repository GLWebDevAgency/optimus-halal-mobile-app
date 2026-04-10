import type { MadhabRulingView } from "../ports/madhab-ruling-repo.js";

export interface MadhabFilterResult {
  score: number;
  madhabNote: string | null;
}

/**
 * Adjusts a scenario score based on the user's madhab ruling.
 * Pure function — no async, no DB, no side effects.
 *
 * Delta rules:
 *  - ruling "haram"    → score -= 15 (clamp 0)
 *  - ruling "doubtful" → score -= 5
 *  - ruling "halal"    → score += 10 (clamp 100)
 *  - contemporarySplit → append divergence note
 *  - madhab "general"  → no change
 */
export function applyMadhabFilter(
  baseScore: number,
  madhab: string,
  ruling: MadhabRulingView | null,
): MadhabFilterResult {
  // No adjustment for general madhab or no ruling data
  if (madhab === "general" || !ruling) {
    return { score: baseScore, madhabNote: null };
  }

  let score = baseScore;
  const notes: string[] = [];

  // Apply delta based on ruling
  switch (ruling.ruling) {
    case "haram":
      score -= 15;
      notes.push(`Selon l'école ${madhab} : haram`);
      break;
    case "doubtful":
      score -= 5;
      notes.push(`Selon l'école ${madhab} : douteux`);
      break;
    case "halal":
      score += 10;
      notes.push(`Selon l'école ${madhab} : halal`);
      break;
    default:
      // Unknown ruling — no adjustment
      break;
  }

  // Flag contemporary divergence
  if (ruling.contemporarySplit) {
    notes.push(`divergence contemporaine dans votre école (${madhab})`);
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    madhabNote: notes.length > 0 ? notes.join(". ") : null,
  };
}
