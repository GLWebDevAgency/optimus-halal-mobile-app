/**
 * Dossier Compiler — Pure functions for Phase 1 Task 7
 *
 * Reads Phase 0 JSON dossiers from disk and transforms them into
 * records ready for DB insertion. All functions are pure (no DB calls,
 * no env vars, no side effects beyond file reads).
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize freeform verdict strings from dossiers into the closed enum
 * expected by substance_scenarios.verdict VARCHAR(30).
 * Maps verbose French/English descriptions → canonical short form.
 */
function normalizeVerdict(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("haram") || lower.includes("interdit")) return "haram";
  if (lower.includes("avoid") || lower.includes("éviter") || lower.includes("eviter")) return "avoid";
  if (lower.includes("mashbooh") || lower.includes("douteux") || lower.includes("doubtful") || lower.includes("discutable")) return "mashbooh";
  if (lower.includes("acceptable") || lower.includes("caution") || lower.includes("prudence") || lower.includes("vigilance")) return "halal_with_caution";
  if (lower.includes("halal") || lower.includes("permis") || lower.includes("permissible") || lower.includes("conforme")) return "halal";
  if (raw.length > 25) return "mashbooh"; // fallback: long text = ambiguous = mashbooh
  return raw.slice(0, 30); // last resort: truncate
}

// ── Types ───────────────────────────────────────────────────────────

/** Substance record ready for DB insert */
export interface SubstanceRecord {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  nameAr: string | null;
  eNumbers: string[];
  tier: number;
  priorityScore: number;
  fiqhIssues: string[];
  issueType: string;
  isActive: boolean;
}

/** Substance dossier record ready for DB insert */
export interface SubstanceDossierRecord {
  substanceId: string;
  version: string;
  schemaVersion: string;
  dossierJson: unknown;
  contentHash: string;
  verifiedAt: Date | null;
  verificationPasses: number | null;
  fatwaCount: number | null;
  isActive: boolean;
}

/** Result of parsing a substance dossier file */
export interface ParsedSubstance {
  substance: SubstanceRecord;
  dossier: SubstanceDossierRecord;
  raw: Record<string, unknown>;
}

/** Match pattern record ready for DB insert */
export interface MatchPatternRecord {
  substanceId: string;
  patternType: string;
  patternValue: string;
  lang: string | null;
  priority: number;
  confidence: number;
  source: string;
}

/** Scenario record ready for DB insert */
export interface ScenarioRecord {
  substanceId: string;
  scenarioKey: string;
  matchConditions: Record<string, unknown>;
  specificity: number;
  score: number;
  verdict: string;
  rationaleFr: string;
  rationaleEn: string | null;
  rationaleAr: string | null;
  dossierSectionRef: string | null;
}

/** Madhab ruling record ready for DB insert */
export interface MadhabRulingRecord {
  substanceId: string;
  madhab: string;
  ruling: string;
  contemporarySplit: boolean;
  classicalSources: string[];
  contemporarySources: string[];
}

/** Practice tuple record ready for DB insert */
export interface PracticeTupleRecord {
  slug: string;
  familyId: string;
  dimensions: Record<string, unknown>;
  verdictHanafi: number;
  verdictMaliki: number;
  verdictShafii: number;
  verdictHanbali: number;
  requiredEvidence: string[];
  dossierSectionRef: string;
  fatwaRefs: string[];
  typicalMortalityPctMin: number | null;
  typicalMortalityPctMax: number | null;
  notesFr: string | null;
  notesEn: string | null;
  notesAr: string | null;
}

// ── Pipeline lookup ─────────────────────────────────────────────────

interface PipelineEntry {
  tier: number;
  priorityScore: number;
  fiqhIssue: string;
}

const PIPELINE_PATH = path.resolve(
  __dirname, "..", "..", "..", "..",
  "docs", "naqiy", "dossiers-recherches-naqiy", "naqiy_substance_pipeline.json",
);

let _pipelineCache: Map<string, PipelineEntry> | null = null;

function loadPipelineMap(): Map<string, PipelineEntry> {
  if (_pipelineCache) return _pipelineCache;

  const raw = JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf8"));
  const tiers = raw.priority_tiers as Record<string, { substances: Array<Record<string, unknown>> }>;
  const map = new Map<string, PipelineEntry>();

  for (const [tierName, tierData] of Object.entries(tiers)) {
    // Extract tier number from key name: TIER_1_CRITICAL → 1
    let tierNum = 4; // default
    const match = tierName.match(/TIER_(\d+)/);
    if (match) tierNum = parseInt(match[1], 10);

    for (const s of tierData.substances) {
      const id = s.id as string; // "SUBST-012"
      map.set(id, {
        tier: tierNum,
        priorityScore: (s.priority_score as number) ?? 0,
        fiqhIssue: (s.fiqh_issue as string) ?? "",
      });
    }
  }

  _pipelineCache = map;
  return map;
}

/** Reset pipeline cache (useful for testing) */
export function _resetPipelineCache(): void {
  _pipelineCache = null;
}

// ── Core functions ──────────────────────────────────────────────────

/**
 * Parse a substance dossier JSON file into substance + dossier records.
 */
export function parseSubstanceDossier(filePath: string): ParsedSubstance | null {
  const jsonStr = fs.readFileSync(filePath, "utf8");
  const raw = JSON.parse(jsonStr) as Record<string, unknown>;

  const substanceData = raw.substance as Record<string, unknown> | undefined;
  const meta = raw.meta as Record<string, unknown> | undefined;
  if (!substanceData || !meta) return null;

  const substanceId = substanceData.id as string;
  const dossierId = meta.dossier_id as string; // "SUBST-012" — used for pipeline lookup

  // Pipeline lookup by dossier_id (which matches pipeline's substance id)
  const pipelineMap = loadPipelineMap();
  const pipelineEntry = pipelineMap.get(dossierId);

  const tier = pipelineEntry?.tier ?? 4;
  const priorityScore = pipelineEntry?.priorityScore ?? 0;
  const fiqhIssue = pipelineEntry?.fiqhIssue ?? "";

  // E-numbers from match_vocabulary
  const matchVocab = substanceData.match_vocabulary as Record<string, unknown> | undefined;
  const eNumbers = (matchVocab?.e_numbers as string[]) ?? [];

  // Content hash
  const contentHash = createHash("sha256").update(jsonStr).digest("hex");

  const substance: SubstanceRecord = {
    id: substanceId,
    slug: substanceId.toLowerCase(),
    nameFr: (substanceData.primary_name_fr as string) ?? "",
    nameEn: (substanceData.primary_name_en as string) ?? "",
    nameAr: (substanceData.primary_name_ar as string) ?? null,
    eNumbers,
    tier,
    priorityScore,
    fiqhIssues: fiqhIssue ? [fiqhIssue] : [],
    issueType: (substanceData.issue_type as string) ?? "UNKNOWN",
    isActive: true,
  };

  const dossier: SubstanceDossierRecord = {
    substanceId,
    version: (meta.version as string) ?? "1.0.0",
    schemaVersion: "substance-dossier.v1",
    dossierJson: raw,
    contentHash,
    verifiedAt: meta.generated_at ? new Date(meta.generated_at as string) : null,
    verificationPasses: (meta.verification_passes as number) ?? null,
    fatwaCount: (meta.fatwas_verified_count as number) ?? null,
    isActive: true,
  };

  return { substance, dossier, raw };
}

/**
 * Extract match patterns from a parsed substance dossier.
 */
export function extractMatchPatterns(parsed: ParsedSubstance): MatchPatternRecord[] {
  const patterns: MatchPatternRecord[] = [];
  const substanceId = parsed.substance.id;
  const source = "dossier_compiler";
  const matchVocab = (parsed.raw.substance as Record<string, unknown>)
    .match_vocabulary as Record<string, unknown> | undefined;

  if (!matchVocab) return patterns;

  // Canonical names (priority 100)
  const canonicalFr = matchVocab.canonical_fr as string | undefined;
  if (canonicalFr) {
    patterns.push({
      substanceId, patternType: "keyword_fr", patternValue: canonicalFr,
      lang: "fr", priority: 100, confidence: 1.0, source,
    });
  }

  const canonicalEn = matchVocab.canonical_en as string | undefined;
  if (canonicalEn) {
    patterns.push({
      substanceId, patternType: "keyword_en", patternValue: canonicalEn,
      lang: "en", priority: 100, confidence: 1.0, source,
    });
  }

  const canonicalAr = matchVocab.canonical_ar as string | undefined;
  if (canonicalAr) {
    patterns.push({
      substanceId, patternType: "keyword_ar", patternValue: canonicalAr,
      lang: "ar", priority: 100, confidence: 1.0, source,
    });
  }

  // Synonyms (priority 80)
  const synonymsFr = matchVocab.synonyms_fr as string[] | undefined;
  if (synonymsFr) {
    for (const syn of synonymsFr) {
      patterns.push({
        substanceId, patternType: "keyword_fr", patternValue: syn,
        lang: "fr", priority: 80, confidence: 0.9, source,
      });
    }
  }

  const synonymsEn = matchVocab.synonyms_en as string[] | undefined;
  if (synonymsEn) {
    for (const syn of synonymsEn) {
      patterns.push({
        substanceId, patternType: "keyword_en", patternValue: syn,
        lang: "en", priority: 80, confidence: 0.9, source,
      });
    }
  }

  const synonymsAr = matchVocab.synonyms_ar as string[] | undefined;
  if (synonymsAr) {
    for (const syn of synonymsAr) {
      patterns.push({
        substanceId, patternType: "keyword_ar", patternValue: syn,
        lang: "ar", priority: 80, confidence: 0.9, source,
      });
    }
  }

  // Synonyms other languages (priority 60)
  const synonymsOther = matchVocab.synonyms_other as Record<string, string[]> | undefined;
  if (synonymsOther) {
    for (const [lang, syns] of Object.entries(synonymsOther)) {
      for (const syn of syns) {
        patterns.push({
          substanceId, patternType: "keyword_other", patternValue: syn,
          lang, priority: 60, confidence: 0.7, source,
        });
      }
    }
  }

  // E-numbers (priority 90)
  const eNumbers = matchVocab.e_numbers as string[] | undefined;
  if (eNumbers) {
    for (const eNum of eNumbers) {
      patterns.push({
        substanceId, patternType: "e_number", patternValue: eNum,
        lang: null, priority: 90, confidence: 1.0, source,
      });
    }
  }

  // OFF tags (priority 85)
  const offTags = matchVocab.off_tags as string[] | undefined;
  if (offTags) {
    for (const tag of offTags) {
      patterns.push({
        substanceId, patternType: "off_tag", patternValue: tag,
        lang: null, priority: 85, confidence: 0.95, source,
      });
    }
  }

  // Semantic descriptors (priority 40)
  const semanticDescriptors = matchVocab.semantic_descriptors as string[] | undefined;
  if (semanticDescriptors) {
    for (const desc of semanticDescriptors) {
      patterns.push({
        substanceId, patternType: "semantic_descriptor", patternValue: desc,
        lang: null, priority: 40, confidence: 0.6, source,
      });
    }
  }

  return patterns;
}

/**
 * Extract score_matrix scenarios from a parsed substance dossier.
 * Returns empty array if no score_matrix is present.
 */
export function extractScenarios(parsed: ParsedSubstance): ScenarioRecord[] {
  const scenarios: ScenarioRecord[] = [];
  const substanceId = parsed.substance.id;

  // score_matrix can be at top level or nested under naqiy_scoring_model.scenario_based_scoring
  let scoreMatrix = parsed.raw.score_matrix as Record<string, Record<string, unknown>> | undefined;

  // Also check naqiy_scoring_model.scenario_based_scoring (array form in some dossiers)
  if (!scoreMatrix || Object.keys(scoreMatrix).length === 0) {
    const scoringModel = parsed.raw.naqiy_scoring_model as Record<string, unknown> | undefined;
    const scenarioArray = scoringModel?.scenario_based_scoring as Array<Record<string, unknown>> | undefined;

    if (scenarioArray && Array.isArray(scenarioArray) && scenarioArray.length > 0) {
      // Convert array form to keyed form
      for (let i = 0; i < scenarioArray.length; i++) {
        const item = scenarioArray[i];
        const scenarioKey = `scenario_${i + 1}`;
        scenarios.push({
          substanceId,
          scenarioKey,
          matchConditions: {},
          specificity: 0,
          score: (item.score as number) ?? 0,
          verdict: normalizeVerdict((item.verdict as string) ?? "unknown"),
          rationaleFr: (item.reasoning_fr as string) ?? (item.rationale as string) ?? (item.verdict as string) ?? "",
          rationaleEn: (item.reasoning_en as string) ?? null,
          rationaleAr: (item.reasoning_ar as string) ?? null,
          dossierSectionRef: "score_matrix",
        });
      }
      return scenarios;
    }

    return scenarios; // no score_matrix at all
  }

  // Keyed form (e.g., SHELLAC)
  for (const [key, scenario] of Object.entries(scoreMatrix)) {
    scenarios.push({
      substanceId,
      scenarioKey: key,
      matchConditions: {},
      specificity: 0,
      score: (scenario.score as number) ?? 0,
      verdict: normalizeVerdict((scenario.verdict as string) ?? "unknown"),
      rationaleFr: (scenario.rationale as string) ?? (scenario.reasoning_fr as string) ?? "",
      rationaleEn: (scenario.rationale_en as string) ?? (scenario.reasoning_en as string) ?? null,
      rationaleAr: (scenario.rationale_ar as string) ?? (scenario.reasoning_ar as string) ?? null,
      dossierSectionRef: "score_matrix",
    });
  }

  return scenarios;
}

// ── Madhab ruling inference ─────────────────────────────────────────

/** Infer ruling from position text */
function inferRuling(positionText: string): string {
  const upper = positionText.toUpperCase();
  if (upper.includes("HARAM")) return "haram";
  if (upper.includes("HALAL")) return "halal";
  if (upper.includes("PERMISSIBLE")) return "halal";
  return "doubtful";
}

/** Check for contemporary split indicators */
function hasContemporarySplit(positionData: Record<string, unknown>): boolean {
  const text = JSON.stringify(positionData).toUpperCase();
  return text.includes("DIVIDED") || text.includes("SPLIT");
}

/** Extract classical_sources as string array */
function extractSourceStrings(sources: unknown): string[] {
  if (!sources) return [];
  if (!Array.isArray(sources)) return [];
  return sources.map((s: unknown) => {
    if (typeof s === "string") return s;
    if (typeof s === "object" && s !== null) {
      const obj = s as Record<string, unknown>;
      // Classical sources can be objects with work/author fields
      const work = obj.work as string | undefined;
      const author = obj.author as string | undefined;
      if (work && author) return `${author}: ${work}`;
      if (work) return work;
      return JSON.stringify(s);
    }
    return String(s);
  });
}

/**
 * Extract madhab rulings from a parsed substance dossier.
 * Handles both `shafi'i` (with apostrophe) and `shafii` keys.
 */
export function extractMadhabRulings(parsed: ParsedSubstance): MadhabRulingRecord[] {
  const rulings: MadhabRulingRecord[] = [];
  const substanceId = parsed.substance.id;

  const positions = parsed.raw.madhab_positions as Record<string, Record<string, unknown>> | undefined;
  if (!positions) return rulings;

  // Mapping from JSON keys (may have apostrophes) to DB madhab values
  const madhabMapping: Record<string, string> = {
    "hanafi": "hanafi",
    "maliki": "maliki",
    "shafi'i": "shafii",
    "shafii": "shafii",
    "hanbali": "hanbali",
  };

  for (const [key, posData] of Object.entries(positions)) {
    const madhab = madhabMapping[key];
    if (!madhab) continue;

    // Get the main position text for ruling inference
    const positionTexts = [
      posData.verdict as string,
      posData.position as string,
      posData.classical as string,
      posData.majority_position as string,
      posData.practical_verdict_industrial as string,
    ].filter(Boolean);

    const mainText = positionTexts.join(" ");
    if (!mainText) continue;

    const ruling = inferRuling(mainText);
    const contemporarySplit = hasContemporarySplit(posData);

    const classicalSources = extractSourceStrings(posData.classical_sources);
    const contemporarySources: string[] = [];
    if (posData.contemporary_position) {
      contemporarySources.push(posData.contemporary_position as string);
    }
    if (posData.contemporary) {
      contemporarySources.push(posData.contemporary as string);
    }

    rulings.push({
      substanceId,
      madhab,
      ruling,
      contemporarySplit,
      classicalSources,
      contemporarySources,
    });
  }

  return rulings;
}

/**
 * Parse practice tuples from a tuples JSON file.
 */
export function parsePracticeTuples(filePath: string): PracticeTupleRecord[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const familyId = raw.practice_family as string;
  const tuples = raw.tuples as Array<Record<string, unknown>>;

  return tuples.map((tuple) => {
    const verdicts = tuple.verdicts as Record<string, number>;
    return {
      slug: tuple.id as string,
      familyId,
      dimensions: tuple.dimensions as Record<string, unknown>,
      verdictHanafi: verdicts.hanafi,
      verdictMaliki: verdicts.maliki,
      verdictShafii: verdicts.shafii,
      verdictHanbali: verdicts.hanbali,
      requiredEvidence: (tuple.required_evidence as string[]) ?? [],
      dossierSectionRef: tuple.dossier_section_ref as string,
      fatwaRefs: (tuple.fatwa_refs as string[]) ?? [],
      typicalMortalityPctMin: (tuple.typical_mortality_pct_min as number) ?? null,
      typicalMortalityPctMax: (tuple.typical_mortality_pct_max as number) ?? null,
      notesFr: (tuple.notes_fr as string) ?? null,
      notesEn: (tuple.notes_en as string) ?? null,
      notesAr: (tuple.notes_ar as string) ?? null,
    };
  });
}
