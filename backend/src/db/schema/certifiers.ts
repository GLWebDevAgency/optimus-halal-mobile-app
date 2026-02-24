/**
 * Halal Certifier Reference Table
 *
 * Source: certification-list.json — evaluation of halal certifiers in France
 * Trust score computed from 6 boolean practice indicators (0–100).
 *
 * Universal scoring algorithm:
 *   POSITIVE (higher = more rigorous):
 *     controllersAreEmployees     → +15  (independent, salaried controllers)
 *     controllersPresentEachProd  → +15  (present at every production run)
 *     hasSalariedSlaughterers     → +10  (slaughterers employed by certifier)
 *
 *   NEGATIVE (accepting these = less strict):
 *     acceptsMechanicalSlaughter  → −15  (mechanical poultry slaughter)
 *     acceptsElectronarcosis      → −15  (electronarcosis before slaughter)
 *     acceptsStunning             → −20  (stunning for cattle/calves/lambs)
 *
 *   Range: −59 to +40 (raw), sigmoid-normalized to 0–100
 *
 *   Per-madhab scores use different weights reflecting each school's fiqh.
 *   See MADHAB_WEIGHTS below and docs/naqiy/internal/trust-score-madhab-weights.md
 *
 *   Note: halalAssessment is the RESULT/verdict derived from these practices,
 *   not an input to the score. It is stored separately.
 */

import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const certifiers = pgTable(
  "certifiers",
  {
    id: t.varchar({ length: 100 }).primaryKey(), // matches certification-list.json id
    name: t.varchar({ length: 255 }).notNull(),
    website: t.text(),
    creationYear: t.integer("creation_year"),

    // Practice indicators (raw booleans from certification data)
    controllersAreEmployees: t.boolean("controllers_are_employees"),
    controllersPresentEachProduction: t.boolean("controllers_present_each_production"),
    hasSalariedSlaughterers: t.boolean("has_salaried_slaughterers"),
    acceptsMechanicalSlaughter: t.boolean("accepts_mechanical_slaughter"),
    acceptsElectronarcosis: t.boolean("accepts_electronarcosis"),
    acceptsPostSlaughterElectrocution: t.boolean("accepts_post_slaughter_electrocution"),
    acceptsStunning: t.boolean("accepts_stunning"),

    // Computed fields
    halalAssessment: t.boolean("halal_assessment").default(false).notNull(),
    trustScore: t.integer("trust_score").default(0).notNull(), // 0-100 (universal)
    trustScoreHanafi: t.integer("trust_score_hanafi").default(0).notNull(),
    trustScoreShafii: t.integer("trust_score_shafii").default(0).notNull(),
    trustScoreMaliki: t.integer("trust_score_maliki").default(0).notNull(),
    trustScoreHanbali: t.integer("trust_score_hanbali").default(0).notNull(),
    notes: t.text().array(),

    // Metadata
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("certifiers_trust_score_idx").on(table.trustScore),
    t.index("certifiers_halal_assessment_idx").on(table.halalAssessment),
  ]
);

export type Certifier = typeof certifiers.$inferSelect;
export type NewCertifier = typeof certifiers.$inferInsert;

// ══════════════════════════════════════════════════════════════
// MADHAB WEIGHT SYSTEM — Per-school trust score coefficients
// ══════════════════════════════════════════════════════════════
//
// Sources for each weight decision are documented inline.
// Full reference: docs/naqiy/internal/trust-score-madhab-weights.md
//
// Key:
//   controllersAreEmployees        → Organizational — same across all schools
//   controllersPresentEachProd     → Organizational — same across all schools
//   hasSalariedSlaughterers        → Varies: independence of dhābih valued differently
//   acceptsMechanicalSlaughter     → Varies: tasmiya requirement strictness differs
//   acceptsElectronarcosis         → Varies: lethality risk assessment differs
//   acceptsStunning                → Varies: biggest divergence between schools

export type MadhabKey = "hanafi" | "shafii" | "maliki" | "hanbali";

interface WeightSet {
  controllersAreEmployees: number;
  controllersPresentEachProduction: number;
  hasSalariedSlaughterers: number;
  acceptsMechanicalSlaughter: number;
  acceptsElectronarcosis: number;
  acceptsStunning: number;
}

/**
 * Per-madhab weight tables.
 *
 * ┌─────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
 * │ Indicator                   │ Universal│  Hanafi  │  Shafi'i │  Maliki  │  Hanbali │
 * ├─────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
 * │ controllersAreEmployees     │   +15    │   +15    │   +15    │   +15    │   +15    │
 * │ controllersPresentEachProd  │   +15    │   +15    │   +15    │   +15    │   +15    │
 * │ hasSalariedSlaughterers     │   +10    │   +15    │   +10    │   +5     │   +12    │
 * │ acceptsMechanicalSlaughter  │   −15    │   −20    │   −18    │   −8     │   −18    │
 * │ acceptsElectronarcosis      │   −15    │   −20    │   −15    │   −8     │   −18    │
 * │ acceptsStunning             │   −20    │   −25    │   −15    │   −10    │   −25    │
 * ├─────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
 * │ MAX_RAW (all positive)      │   +40    │   +45    │   +40    │   +35    │   +42    │
 * │ MIN_RAW (all negative)      │   −50    │   −65    │   −48    │   −26    │   −61    │
 * └─────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
 */
export const MADHAB_WEIGHTS: Record<MadhabKey, WeightSet> = {
  /**
   * HANAFI — Most strict on stunning & mechanical slaughter.
   *
   * - Stunning: Majority position = animal must be fully conscious. Imam al-Haskafi
   *   (Durr al-Mukhtar) and Ibn Abidin (Radd al-Muhtar): any doubt about the animal
   *   being alive invalidates the slaughter. Penalty heaviest (-25).
   *   Ref: Radd al-Muhtar 6/296; Mufti Taqi Usmani, "Legal Rulings on Slaughtered Animals"
   *
   * - Electronarcosis: Risk of death before saignée = invalidation.
   *   Stronger penalty than universal (-20 vs -15).
   *   Ref: Fatwa Darul Ifta, Jamia Darul Uloom Karachi
   *
   * - Mechanical slaughter: Tasmiya on each animal is wajib (obligatory).
   *   Intentional omission = haram. Machine cannot pronounce = haram.
   *   Heaviest penalty (-20).
   *   Ref: HFSAA (all 4 schools); Imam al-Haskafi, Durr al-Mukhtar
   *
   * - Salaried slaughterers: Independence of dhābih highly valued.
   *   The Hanafi school emphasizes the human agent's niyyah (intention) and
   *   competence. Bonus increased (+15).
   *   Ref: Al-Kasani, Bada'i al-Sana'i 5/41
   */
  hanafi: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 15,
    acceptsMechanicalSlaughter: -20,
    acceptsElectronarcosis: -20,
    acceptsStunning: -25,
  },

  /**
   * SHAFI'I — Moderate; strict on lethality, lenient on non-lethal.
   *
   * - Stunning: Prohibited if it kills before slaughter. If reversible and
   *   animal provably alive → makruh but tolerated.
   *   Moderate penalty (-15).
   *   Ref: Al-Nawawi, Al-Majmu' Sharh al-Muhadhdhab 9/75;
   *        SeekersGuidance Shafi'i ruling on stunning
   *
   * - Electronarcosis: Same principle — haram if lethal, makruh if not.
   *   Keeps universal weight (-15).
   *   Ref: Imam al-Shirazi, Al-Muhadhdhab
   *
   * - Mechanical slaughter: Tasmiya = condition. "Istikhfaf" (taking lightly)
   *   makes the slaughter invalid. Machine = systematic istikhfaf.
   *   Heavy penalty (-18).
   *   Ref: Imam al-Shafi'i per HFSAA analysis
   *
   * - Salaried slaughterers: Valued but not as critical as Hanafi.
   *   Keeps universal (+10).
   *   Ref: Al-Nawawi, Rawdat al-Talibin
   */
  shafii: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 10,
    acceptsMechanicalSlaughter: -18,
    acceptsElectronarcosis: -15,
    acceptsStunning: -15,
  },

  /**
   * MALIKI — Most permissive on stunning, more nuanced on mechanical.
   *
   * - Stunning: Tolerated if animal survives the shock (reversible).
   *   The Maliki school uses the principle of "al-asl al-ibaha" (default
   *   permissibility) for means not explicitly prohibited.
   *   Lightest penalty (-10).
   *   Ref: Khalil ibn Ishaq, Mukhtasar; Al-Dardir, Al-Sharh al-Kabir;
   *        ARGML's own justification cites Maliki authorities
   *
   * - Electronarcosis: Similarly tolerated under conditions.
   *   Lighter penalty (-8).
   *   Ref: Egyptian Fatwa Committee 1978 (Maliki-influenced);
   *        World Islamic League Decision No. 4, 10th Congress 1987
   *
   * - Mechanical slaughter: Some Maliki scholars debated recorded tasmiya.
   *   Sharh al-Kabir: tasmiya not required for one who forgets or is incapable,
   *   but systematic omission ≠ forgetfulness. Moderate penalty (-8).
   *   Ref: Al-Dardir, Al-Sharh al-Kabir 2/108
   *
   * - Salaried slaughterers: Less critical — the school focuses more on
   *   the act of slaughter itself than organizational structure.
   *   Reduced bonus (+5).
   *   Ref: Malik's Al-Muwatta, Kitab al-Dhaba'ih
   */
  maliki: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 5,
    acceptsMechanicalSlaughter: -8,
    acceptsElectronarcosis: -8,
    acceptsStunning: -10,
  },

  /**
   * HANBALI — Very strict by precaution (ihtiyat).
   *
   * - Stunning: Prohibited as a precaution. The Hanbali school applies
   *   the strictest reading: if there is doubt whether stunning kills,
   *   avoid it entirely. Close to Hanafi strictness.
   *   Heavy penalty (-25).
   *   Ref: Ibn Qudama, Al-Mughni 13/293; Ahmad's principle of ihtiyat
   *
   * - Electronarcosis: Prohibited by precaution — risk of killing before
   *   slaughter is a sufficient shubuha (doubt) to avoid it.
   *   Heavy penalty (-18).
   *   Ref: Ibn Qudama, Al-Mughni; "What you doubt, leave it for
   *        what you do not doubt" (Hadith, Tirmidhi)
   *
   * - Mechanical slaughter: Same reasoning as Hanafi — machine cannot
   *   have niyyah or pronounce tasmiya. Prohibited.
   *   Heavy penalty (-18).
   *   Ref: HFSAA analysis; Ibn Qudama, Al-Mughni 13/285
   *
   * - Salaried slaughterers: Valued — the school emphasizes the
   *   qualifications and taqwa of the slaughterer.
   *   Bonus (+12).
   *   Ref: Ibn Qudama, Al-Mughni 13/283
   */
  hanbali: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 12,
    acceptsMechanicalSlaughter: -18,
    acceptsElectronarcosis: -18,
    acceptsStunning: -25,
  },
};

/** Universal weights (school-agnostic average). */
export const UNIVERSAL_WEIGHTS: WeightSet = {
  controllersAreEmployees: 15,
  controllersPresentEachProduction: 15,
  hasSalariedSlaughterers: 10,
  acceptsMechanicalSlaughter: -15,
  acceptsElectronarcosis: -15,
  acceptsStunning: -20,
};

// ══════════════════════════════════════════════════════════════
// TRUST SCORE COMPUTATION
// ══════════════════════════════════════════════════════════════

interface PracticeInputs {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
}

/**
 * Penalty for `null` on positive indicators.
 *
 * null = "unknown or refuses to disclose" — different from false ("we don't").
 * A certifier who won't confirm a positive practice deserves a small penalty:
 * opacity reduces trust. -3 is proportional (vs +15 for the full indicator).
 *
 * Only applies to the 3 positive indicators. Negative indicators are boolean
 * choices (accepts X or not) where null is treated as "does not accept" (0).
 */
const NULL_POSITIVE_PENALTY = -3;

/**
 * Compute raw score from practice indicators using a given weight set.
 */
function computeRawScore(practices: PracticeInputs, weights: WeightSet): number {
  let raw = 0;

  // Positive indicators: true = bonus, null = small penalty, false = 0
  if (practices.controllersAreEmployees === true) raw += weights.controllersAreEmployees;
  else if (practices.controllersAreEmployees === null) raw += NULL_POSITIVE_PENALTY;

  if (practices.controllersPresentEachProduction === true) raw += weights.controllersPresentEachProduction;
  else if (practices.controllersPresentEachProduction === null) raw += NULL_POSITIVE_PENALTY;

  if (practices.hasSalariedSlaughterers === true) raw += weights.hasSalariedSlaughterers;
  else if (practices.hasSalariedSlaughterers === null) raw += NULL_POSITIVE_PENALTY;

  // Negative indicators: true = penalty, false/null = 0
  if (practices.acceptsMechanicalPoultrySlaughter === true) raw += weights.acceptsMechanicalSlaughter;
  if (practices.acceptsPoultryElectronarcosis === true) raw += weights.acceptsElectronarcosis;
  if (practices.acceptsStunningForCattleCalvesLambs === true) raw += weights.acceptsStunning;

  return raw;
}

/**
 * Steepness constant for the sigmoid normalization.
 *
 * Controls how sharply the curve separates good from bad certifiers.
 * - Lower k (0.04–0.06): gentler curve, more linear-like
 * - Higher k (0.10–0.15): steeper, extreme compression
 * - k=0.06: balanced — good separation without crushing the middle too hard
 *
 * The inflection point is at raw=0 (no practices = 50% before renormalization),
 * which intuitively means "neutral = halfway".
 */
const SIGMOID_K = 0.06;

/**
 * Normalize a raw score to 0-100 using a centered sigmoid curve.
 *
 * Why sigmoid instead of linear?
 * - The first positive indicators matter more (going from "no oversight" to
 *   "some oversight" is a huge jump for consumer trust).
 * - The last improvements matter less (diminishing returns near perfection).
 * - Sigmoid compresses extremes, stretches the middle → better separation
 *   between certifiers in the critical decision range.
 *
 * Implementation: sigmoid centered at raw=0, steepness SIGMOID_K.
 * Then renormalized so that maxRaw → 100 and minRaw → 0 exactly.
 * This ensures perfect certifiers score 100 and worst-case scores 0.
 */
function normalizeScore(raw: number, weights: WeightSet): number {
  const maxRaw =
    weights.controllersAreEmployees +
    weights.controllersPresentEachProduction +
    weights.hasSalariedSlaughterers;
  const minRaw =
    3 * NULL_POSITIVE_PENALTY +
    weights.acceptsMechanicalSlaughter +
    weights.acceptsElectronarcosis +
    weights.acceptsStunning;

  // Sigmoid centered at raw=0
  const sig = (r: number) => 1 / (1 + Math.exp(-r * SIGMOID_K));

  // Renormalize so sig(maxRaw) → 1.0 and sig(minRaw) → 0.0
  const sigMax = sig(maxRaw);
  const sigMin = sig(minRaw);
  const denom = sigMax - sigMin;
  if (denom === 0) return 50; // degenerate case

  const normalized = ((sig(raw) - sigMin) / denom) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Compute universal trust score from practice indicators.
 * Returns 0-100 integer.
 *
 * halalAssessment is NOT included — it is the derived verdict, not an input.
 */
export function computeTrustScore(practices: PracticeInputs): number {
  const raw = computeRawScore(practices, UNIVERSAL_WEIGHTS);
  return normalizeScore(raw, UNIVERSAL_WEIGHTS);
}

/**
 * Compute trust score for a specific madhab.
 * Uses the school-specific weight table.
 */
export function computeTrustScoreForMadhab(
  practices: PracticeInputs,
  madhab: MadhabKey
): number {
  const weights = MADHAB_WEIGHTS[madhab];
  const raw = computeRawScore(practices, weights);
  return normalizeScore(raw, weights);
}

/**
 * Compute all 5 trust scores (universal + 4 madhabs) at once.
 * Used by seed pipeline.
 */
export function computeAllTrustScores(practices: PracticeInputs): {
  trustScore: number;
  trustScoreHanafi: number;
  trustScoreShafii: number;
  trustScoreMaliki: number;
  trustScoreHanbali: number;
} {
  return {
    trustScore: computeTrustScore(practices),
    trustScoreHanafi: computeTrustScoreForMadhab(practices, "hanafi"),
    trustScoreShafii: computeTrustScoreForMadhab(practices, "shafii"),
    trustScoreMaliki: computeTrustScoreForMadhab(practices, "maliki"),
    trustScoreHanbali: computeTrustScoreForMadhab(practices, "hanbali"),
  };
}
