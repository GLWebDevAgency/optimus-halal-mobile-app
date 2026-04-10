/**
 * Vocabulary Builder — generates the closed substance vocabulary
 * block injected into the Gemini V2 prompt.
 *
 * Source: substance_match_patterns + substance_dossiers (populated by Phase 1 compiler).
 * Output: formatted text block + SHA256 signature for cache key.
 *
 * Loaded once at boot, cached in memory, reloaded on SIGHUP or admin endpoint.
 */

import crypto from "node:crypto";
import { db } from "../../db/index.js";
import { substances } from "../../db/schema/substances.js";
import { substanceMatchPatterns } from "../../db/schema/substance-match-patterns.js";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger.js";

export interface VocabularyEntry {
  substanceId: string;
  canonicalFr: string;
  canonicalEn: string;
  canonicalAr: string;
  synonyms: string[];
  eNumbers: string[];
  offTags: string[];
  descriptors: string[];
  notConfuseWith: string[];
}

// ── Pure functions (testable without DB) ──

export function buildVocabularyBlock(entries: VocabularyEntry[]): string {
  const sorted = [...entries].sort((a, b) =>
    a.substanceId.localeCompare(b.substanceId)
  );
  return sorted
    .map((e) => {
      const lines = [
        `${e.substanceId}:`,
        `  canonical: ${e.canonicalFr} | ${e.canonicalEn} | ${e.canonicalAr}`,
        `  aliases: ${e.synonyms.join(", ")}`,
        `  e_numbers: ${e.eNumbers.join(", ") || "none"}`,
        `  off_tags: ${e.offTags.join(", ") || "none"}`,
        `  descriptors: ${e.descriptors.join("; ")}`,
        `  not_confuse_with: ${e.notConfuseWith.join(", ") || "none"}`,
        "─────",
      ];
      return lines.join("\n");
    })
    .join("\n");
}

export function buildVocabularySignature(entries: VocabularyEntry[]): string {
  const sorted = [...entries].sort((a, b) =>
    a.substanceId.localeCompare(b.substanceId)
  );
  const content = JSON.stringify(sorted);
  return crypto.createHash("sha256").update(content).digest("hex");
}

// ── DB-backed loader ──

let _cached: {
  block: string;
  signature: string;
  entries: VocabularyEntry[];
} | null = null;

export async function loadVocabularyFromDB(): Promise<{
  block: string;
  signature: string;
  entries: VocabularyEntry[];
}> {
  if (_cached) return _cached;

  // Load all active substances with their match patterns
  const activeSubstances = await db
    .select()
    .from(substances)
    .where(eq(substances.isActive, true));

  const allPatterns = await db.select().from(substanceMatchPatterns);

  const patternsBySubstance = new Map<
    string,
    (typeof allPatterns)[number][]
  >();
  for (const p of allPatterns) {
    const existing = patternsBySubstance.get(p.substanceId) ?? [];
    existing.push(p);
    patternsBySubstance.set(p.substanceId, existing);
  }

  const entries: VocabularyEntry[] = activeSubstances.map((s) => {
    const patterns = patternsBySubstance.get(s.id) ?? [];
    return {
      substanceId: s.id,
      canonicalFr:
        patterns.find(
          (p) => p.patternType === "keyword_fr" && p.priority >= 100
        )?.patternValue ?? s.nameFr,
      canonicalEn:
        patterns.find(
          (p) => p.patternType === "keyword_en" && p.priority >= 100
        )?.patternValue ?? s.nameEn,
      canonicalAr:
        patterns.find(
          (p) => p.patternType === "keyword_ar" && p.priority >= 100
        )?.patternValue ?? s.nameAr ?? "",
      synonyms: patterns
        .filter(
          (p) => p.patternType.startsWith("keyword") && p.priority < 100
        )
        .map((p) => p.patternValue),
      eNumbers: patterns
        .filter((p) => p.patternType === "e_number")
        .map((p) => p.patternValue),
      offTags: patterns
        .filter((p) => p.patternType === "off_tag")
        .map((p) => p.patternValue),
      descriptors: patterns
        .filter((p) => p.patternType === "semantic_descriptor")
        .map((p) => p.patternValue),
      notConfuseWith: [], // loaded from dossier_json.disambiguation_hints in a future pass
    };
  });

  const block = buildVocabularyBlock(entries);
  const signature = buildVocabularySignature(entries);

  _cached = { block, signature, entries };
  logger.info(
    `Vocabulary loaded: ${entries.length} substances, signature ${signature.slice(0, 12)}`
  );
  return _cached;
}

export function invalidateVocabularyCache(): void {
  _cached = null;
}
