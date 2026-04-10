import type { ProductContext } from "../types/product-context.js";
import type { MatchPatternView } from "../ports/match-pattern-repo.js";

export interface SubstanceMatch {
  substanceId: string;
  source: "gemini" | "off_tag" | "e_number" | "keyword" | "regex";
  priority: number;
  confidence: number;
  matchedTerm: string;
}

/**
 * Multi-source substance matching with priority-based dedup.
 * Pure function — no async, no DB, no side effects.
 *
 * Sources (by priority):
 *  1. Gemini detected_substances (prio 100)
 *  2. additivesTags e_number match (prio 80)
 *  3. ingredientsList keyword match (prio 50)
 *
 * Dedup: same substanceId from multiple sources keeps highest priority.
 * Result sorted by priority DESC.
 */
export function matchModules(
  product: ProductContext,
  patterns: MatchPatternView[],
): SubstanceMatch[] {
  const matchMap = new Map<string, SubstanceMatch>();

  // Helper: insert or replace if higher priority
  function upsert(match: SubstanceMatch): void {
    const existing = matchMap.get(match.substanceId);
    if (!existing || match.priority > existing.priority) {
      matchMap.set(match.substanceId, match);
    }
  }

  // Source 1 (prio 100): Gemini substancesDetected — direct substance_id match
  for (const detected of product.substancesDetected) {
    upsert({
      substanceId: detected.substance_id,
      source: "gemini",
      priority: 100,
      confidence: detected.confidence,
      matchedTerm: detected.matched_term,
    });
  }

  // Build lookup indexes for patterns
  const eNumberPatterns = new Map<string, MatchPatternView>();
  const offTagPatterns = new Map<string, MatchPatternView>();
  const keywordPatterns: MatchPatternView[] = [];

  for (const p of patterns) {
    if (p.patternType === "e_number") {
      eNumberPatterns.set(p.patternValue.toUpperCase(), p);
    } else if (p.patternType === "off_tag") {
      offTagPatterns.set(p.patternValue.toLowerCase(), p);
    } else if (p.patternType.startsWith("keyword")) {
      keywordPatterns.push(p);
    }
  }

  // Source 2 (prio 80): additivesTags — normalize OFF tag to E-number
  for (const tag of product.additivesTags) {
    const normalizedTag = tag.toLowerCase();

    // Try direct OFF tag match first
    const offPattern = offTagPatterns.get(normalizedTag);
    if (offPattern) {
      upsert({
        substanceId: offPattern.substanceId,
        source: "off_tag",
        priority: 80,
        confidence: offPattern.confidence,
        matchedTerm: tag,
      });
      continue;
    }

    // Normalize OFF tag format: "en:e904" or "en:e322i" → "E904" or "E322"
    const eMatch = normalizedTag.match(/(?:en:)?e(\d+)/i);
    if (eMatch) {
      const eNumber = `E${eMatch[1]}`;
      const pattern = eNumberPatterns.get(eNumber);
      if (pattern) {
        upsert({
          substanceId: pattern.substanceId,
          source: "e_number",
          priority: 80,
          confidence: pattern.confidence,
          matchedTerm: tag,
        });
      }
    }
  }

  // Source 3 (prio 50): ingredientsList — keyword contains check
  for (const ingredient of product.ingredientsList) {
    const lower = ingredient.toLowerCase();
    for (const kp of keywordPatterns) {
      if (lower.includes(kp.patternValue.toLowerCase())) {
        upsert({
          substanceId: kp.substanceId,
          source: "keyword",
          priority: 50,
          confidence: kp.confidence,
          matchedTerm: ingredient,
        });
      }
    }
  }

  // Sort by priority DESC
  return Array.from(matchMap.values()).sort((a, b) => b.priority - a.priority);
}
