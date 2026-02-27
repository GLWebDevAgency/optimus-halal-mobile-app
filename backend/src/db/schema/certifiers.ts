/**
 * Halal Certifier Reference Table — Naqiy Trust Index V4
 *
 * Source: certification-list.json — evaluation of halal certifiers in France
 * Trust score computed from 9 practice indicators + 3 transparency indicators
 * + controversy penalty, sigmoid-normalized to 0-100.
 *
 * Universal scoring algorithm:
 *   POSITIVE (higher = more rigorous):
 *     controllersAreEmployees     -> +15  (independent, salaried controllers)
 *     controllersPresentEachProd  -> +15  (present at every production run)
 *     hasSalariedSlaughterers     -> +10  (slaughterers employed by certifier)
 *
 *   NEGATIVE (accepting these = less strict):
 *     acceptsMechanicalSlaughter  -> -15  (mechanical poultry slaughter)
 *     acceptsElectronarcosis      -> -15  (electronarcosis before slaughter)
 *     acceptsPostSlaughterElec    -> -2   (V4: post-slaughter electrocution — marginal)
 *     acceptsStunning             -> -20  (stunning for cattle/calves/lambs)
 *     acceptsVsm                  -> -8   (accepts VSM in certified products)
 *
 *   TRANSPARENCY BONUS (V4 — verifiable organizational transparency):
 *     transparencyPublicCharter   -> +5   (public charter/cahier des charges)
 *     transparencyAuditReports    -> +5   (publishes audit/control reports)
 *     transparencyCompanyList     -> +5   (publishes list of certified companies)
 *
 *   CONTROVERSY PENALTY (documented organizational failures):
 *     controversyPenalty          -> -50 to 0  (added to raw before normalization)
 *     V4: Dynamic — SUM(scoreImpact × e^(-λt)) from certifier_events,
 *     where t = years since event, λ = ln(2)/5 (half-life = 5 years).
 *     Resolved events (isActive=false) are excluded.
 *
 *   Range: raw + controversyPenalty, sigmoid-normalized to 0-100
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
    acceptsVsm: t.boolean("accepts_vsm"), // V3: Viande Separee Mecaniquement

    // V4: Transparency indicators (verifiable organizational transparency)
    transparencyPublicCharter: t.boolean("transparency_public_charter"), // public cahier des charges
    transparencyAuditReports: t.boolean("transparency_audit_reports"),   // publishes audit/control reports
    transparencyCompanyList: t.boolean("transparency_company_list"),     // publishes list of certified companies

    // Controversy penalty (documented organizational failures, -50 to 0)
    controversyPenalty: t.integer("controversy_penalty").default(0).notNull(),

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

// ================================================================
// CERTIFIER EVENTS — Controversy timeline for radical transparency
// ================================================================

export const certifierEvents = pgTable(
  "certifier_events",
  {
    id: t.uuid().primaryKey().defaultRandom(),
    certifierId: t.varchar("certifier_id", { length: 100 }).notNull()
      .references(() => certifiers.id, { onDelete: "cascade" }),

    eventType: t.varchar("event_type", { length: 30 }).notNull(), // controversy | separation | improvement | sanction
    severity: t.varchar("severity", { length: 20 }).notNull(),    // critical | major | minor | positive
    titleFr: t.varchar("title_fr", { length: 255 }).notNull(),
    descriptionFr: t.text("description_fr").notNull(),
    sourceName: t.varchar("source_name", { length: 100 }).notNull(),  // "Al-Kanz", "L'Opinion", "ASIDCOM", "L214"
    sourceUrl: t.text("source_url"),

    occurredAt: t.date("occurred_at").notNull(),        // when the event happened
    resolvedAt: t.date("resolved_at"),                   // when it was resolved (null = ongoing)
    resolutionStatus: t.varchar("resolution_status", { length: 30 }).notNull(), // resolved | partially_resolved | ongoing | improvement
    resolutionNoteFr: t.text("resolution_note_fr"),

    scoreImpact: t.integer("score_impact").default(0).notNull(), // -30 to +5 (added to raw before sigmoid)
    isActive: t.boolean("is_active").default(true).notNull(),    // if this event still weighs in the score

    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("certifier_events_certifier_id_idx").on(table.certifierId),
    t.index("certifier_events_type_idx").on(table.eventType),
    t.index("certifier_events_active_idx").on(table.isActive),
  ]
);

export type CertifierEvent = typeof certifierEvents.$inferSelect;
export type NewCertifierEvent = typeof certifierEvents.$inferInsert;

// ================================================================
// MADHAB WEIGHT SYSTEM — Per-school trust score coefficients (V4)
// ================================================================
//
// Sources for each weight decision are documented inline.
// Full reference: docs/naqiy/internal/trust-score-madhab-weights.md
//
// Key:
//   controllersAreEmployees        -> Organizational — same across all schools
//   controllersPresentEachProd     -> Organizational — same across all schools
//   hasSalariedSlaughterers        -> Varies: independence of dhabih valued differently
//   acceptsMechanicalSlaughter     -> Varies: tasmiya requirement strictness differs
//   acceptsElectronarcosis         -> Varies: lethality risk assessment differs
//   acceptsPostSlaughterElec       -> V4: post-saignée shock — varies by lethality concern
//   acceptsStunning                -> Varies: biggest divergence between schools
//   acceptsVsm                     -> V3: Tayyib quality — varies by school's Tayyib emphasis
//   transparencyBonus              -> V4: organizational transparency (same across schools)

export type MadhabKey = "hanafi" | "shafii" | "maliki" | "hanbali";

interface WeightSet {
  controllersAreEmployees: number;
  controllersPresentEachProduction: number;
  hasSalariedSlaughterers: number;
  acceptsMechanicalSlaughter: number;
  acceptsElectronarcosis: number;
  acceptsPostSlaughterElectrocution: number;
  acceptsStunning: number;
  acceptsVsm: number;
  transparencyBonus: number;  // per-indicator (applied 3x if all true)
}

/**
 * Per-madhab weight tables (V4 — includes post-slaughter electrocution + transparency).
 *
 * +-------------------------------+----------+----------+----------+----------+----------+
 * | Indicator                     | Universal|  Hanafi  |  Shafi'i |  Maliki  |  Hanbali |
 * +-------------------------------+----------+----------+----------+----------+----------+
 * | controllersAreEmployees       |   +15    |   +15    |   +15    |   +15    |   +15    |
 * | controllersPresentEachProd    |   +15    |   +15    |   +15    |   +15    |   +15    |
 * | hasSalariedSlaughterers       |   +10    |   +15    |   +10    |   +5     |   +12    |
 * | acceptsMechanicalSlaughter    |   -15    |   -20    |   -18    |   -8     |   -18    |
 * | acceptsElectronarcosis        |   -15    |   -20    |   -15    |   -8     |   -18    |
 * | acceptsPostSlaughterElec      |   -2     |   -3     |   -2     |   -1     |   -3     |
 * | acceptsStunning               |   -20    |   -25    |   -15    |   -10    |   -25    |
 * | acceptsVsm                    |   -8     |   -10    |   -8     |   -5     |   -10    |
 * | transparencyBonus (×3 max)    |   +5     |   +5     |   +5     |   +5     |   +5     |
 * +-------------------------------+----------+----------+----------+----------+----------+
 * | MAX_RAW (all positive+transp) |   +55    |   +60    |   +55    |   +50    |   +57    |
 * | MIN_RAW (all negative)        |   -69    |   -87    |   -67    |   -41    |   -83    |
 * +-------------------------------+----------+----------+----------+----------+----------+
 *
 * Post-slaughter electrocution rationale per-madhab:
 *   Electrical shock AFTER the throat cut — to ensure cardiac arrest and
 *   accelerate bleeding. This is fundamentally different from pre-slaughter
 *   stunning: the dhakāh (tasmiya + cut) is already complete.
 *
 *   Majority scholarly position: post-slaughter interventions do NOT
 *   invalidate a valid dhakāh. The penalty is marginal — a marker of
 *   maximum precaution, not an indicator of invalidation.
 *
 *   Hanafi (-3): Precautionary — if shock causes death before sufficient
 *     exsanguination, theoretical risk of maytah. Very low in practice.
 *     Ref: Ibn Abidin, Radd al-Muhtar 6/296
 *   Shafi'i (-2): Post-cut interventions are not critical if hayāh
 *     mustaqqirrah was confirmed at time of cut. Near-zero concern.
 *     Ref: Al-Nawawi, Al-Majmu' 9/89
 *   Maliki (-1): Most permissive — post-cut procedures fully accepted
 *     if the slaughter was valid. Symbolic penalty only.
 *     Ref: Al-Dardir, Al-Sharh al-Kabir 2/108
 *   Hanbali (-3): Precautionary (sadd al-dharā'i) but the dhakāh is
 *     already accomplished. Minor weight.
 *     Ref: Ibn Qudama, Al-Mughni 13/293
 *
 * Transparency bonus rationale:
 *   Organizational — not school-specific. Verifiable indicators of openness:
 *   1. Public charter/cahier des charges (publicly available standards document)
 *   2. Published audit reports or control summaries
 *   3. Published list of certified companies
 *   Each worth +5 (max +15 total). Weighted to ensure a verifiable certifier
 *   (published charter + company list) ranks at least as high as an opaque one
 *   claiming good practices. Same across all schools — transparency is universal.
 *
 * VSM rationale per-madhab:
 *   Hanafi/Hanbali (-10): Tayyib is integral to halal — Quran 7:157 "the good things
 *     are lawful, the bad things are forbidden". VSM = Khabaith (repugnant).
 *     Ref: Al-Kasani, Bada'i al-Sana'i; Ibn Qudama, Al-Mughni
 *   Shafi'i (-8): Tayyib matters but less formally binding than the act of slaughter.
 *     Ref: Al-Nawawi, Al-Majmu'
 *   Maliki (-5): Tayyib focus is narrower — centered on the slaughter act itself.
 *     VSM is a quality concern, not strictly a fiqh issue.
 *     Ref: Al-Dardir, Al-Sharh al-Kabir
 */
export const MADHAB_WEIGHTS: Record<MadhabKey, WeightSet> = {
  /**
   * HANAFI — Most strict on stunning, mechanical slaughter & Tayyib.
   *
   * - Stunning: Animal must be fully conscious. Imam al-Haskafi
   *   (Durr al-Mukhtar) and Ibn Abidin (Radd al-Muhtar): any doubt about
   *   the animal being alive invalidates the slaughter. Penalty heaviest (-25).
   *   Ref: Radd al-Muhtar 6/296; Mufti Taqi Usmani
   *
   * - Electronarcosis: Risk of death before saignee = invalidation (-20).
   *   Ref: Fatwa Darul Ifta, Jamia Darul Uloom Karachi
   *
   * - Post-slaughter electrocution: Marginal precautionary penalty (-3).
   *   Dhakāh already accomplished; post-cut shock is near-irrelevant.
   *   Ref: Ibn Abidin, Radd al-Muhtar 6/296
   *
   * - Mechanical slaughter: Tasmiya on each animal is wajib. Machine
   *   cannot pronounce = haram (-20).
   *   Ref: HFSAA; Imam al-Haskafi, Durr al-Mukhtar
   *
   * - VSM: Khabaith — violates Tayyib principle (-10).
   *   Ref: Al-Kasani, Bada'i al-Sana'i 5/41
   *
   * - Salaried slaughterers: Independence of dhabih highly valued (+15).
   *   Ref: Al-Kasani, Bada'i al-Sana'i 5/41
   */
  hanafi: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 15,
    acceptsMechanicalSlaughter: -20,
    acceptsElectronarcosis: -20,
    acceptsPostSlaughterElectrocution: -3,
    acceptsStunning: -25,
    acceptsVsm: -10,
    transparencyBonus: 5,
  },

  /**
   * SHAFI'I — Moderate; strict on lethality, lenient on non-lethal.
   *
   * - Stunning: Haram if lethal, makruh if reversible (-15).
   *   Ref: Al-Nawawi, Al-Majmu' Sharh al-Muhadhdhab 9/75
   *
   * - Electronarcosis: Same principle (-15).
   *   Ref: Imam al-Shirazi, Al-Muhadhdhab
   *
   * - Post-slaughter electrocution: Near-irrelevant (-2). Hayāh mustaqqirrah
   *   confirmed at cut = post-cut shock doesn't invalidate.
   *   Ref: Al-Nawawi, Al-Majmu' 9/89
   *
   * - Mechanical slaughter: Istikhfaf invalidates slaughter (-18).
   *   Ref: Imam al-Shafi'i per HFSAA analysis
   *
   * - VSM: Quality concern, moderate weight (-8).
   *   Ref: Al-Nawawi, Al-Majmu'
   */
  shafii: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 10,
    acceptsMechanicalSlaughter: -18,
    acceptsElectronarcosis: -15,
    acceptsPostSlaughterElectrocution: -2,
    acceptsStunning: -15,
    acceptsVsm: -8,
    transparencyBonus: 5,
  },

  /**
   * MALIKI — Most permissive on stunning, more nuanced on mechanical.
   *
   * - Stunning: Tolerated if reversible. al-asl al-ibaha (-10).
   *   Ref: Khalil ibn Ishaq, Mukhtasar; Al-Dardir, Al-Sharh al-Kabir
   *
   * - Electronarcosis: Similarly tolerated under conditions (-8).
   *   Ref: Egyptian Fatwa Committee 1978; World Islamic League 1987
   *
   * - Post-slaughter electrocution: Symbolic (-1). Fully accepted post-dhakāh.
   *   Ref: Al-Dardir, Al-Sharh al-Kabir 2/108
   *
   * - Mechanical slaughter: Moderate penalty (-8).
   *   Ref: Al-Dardir, Al-Sharh al-Kabir 2/108
   *
   * - VSM: Quality concern only, not fiqh issue (-5).
   *   Ref: Al-Dardir, Al-Sharh al-Kabir
   */
  maliki: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 5,
    acceptsMechanicalSlaughter: -8,
    acceptsElectronarcosis: -8,
    acceptsPostSlaughterElectrocution: -1,
    acceptsStunning: -10,
    acceptsVsm: -5,
    transparencyBonus: 5,
  },

  /**
   * HANBALI — Very strict by precaution (ihtiyat).
   *
   * - Stunning: Prohibited by precaution (-25).
   *   Ref: Ibn Qudama, Al-Mughni 13/293
   *
   * - Electronarcosis: Shubuha (doubt) = avoid it (-18).
   *   Ref: Ibn Qudama, Al-Mughni; Hadith, Tirmidhi
   *
   * - Post-slaughter electrocution: Marginal precautionary penalty (-3).
   *   Dhakāh already complete — sadd al-dharā'i applies weakly here.
   *   Ref: Ibn Qudama, Al-Mughni 13/293
   *
   * - Mechanical slaughter: Machine cannot have niyyah (-18).
   *   Ref: HFSAA analysis; Ibn Qudama, Al-Mughni 13/285
   *
   * - VSM: Khabaith — precautionary prohibition (-10).
   *   Ref: Ibn Qudama, Al-Mughni
   */
  hanbali: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 12,
    acceptsMechanicalSlaughter: -18,
    acceptsElectronarcosis: -18,
    acceptsPostSlaughterElectrocution: -3,
    acceptsStunning: -25,
    acceptsVsm: -10,
    transparencyBonus: 5,
  },
};

/** Universal weights (school-agnostic average). */
export const UNIVERSAL_WEIGHTS: WeightSet = {
  controllersAreEmployees: 15,
  controllersPresentEachProduction: 15,
  hasSalariedSlaughterers: 10,
  acceptsMechanicalSlaughter: -15,
  acceptsElectronarcosis: -15,
  acceptsPostSlaughterElectrocution: -2,
  acceptsStunning: -20,
  acceptsVsm: -8,
  transparencyBonus: 5,
};

// ================================================================
// TRUST SCORE COMPUTATION (V4)
// ================================================================

interface PracticeInputs {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
  acceptsVsm: boolean | null;
  // V4: Transparency indicators
  transparencyPublicCharter?: boolean | null;
  transparencyAuditReports?: boolean | null;
  transparencyCompanyList?: boolean | null;
  controversyPenalty?: number;
}

/**
 * Penalty for `null` on positive indicators.
 *
 * null = "unknown or refuses to disclose" -- different from false ("we don't").
 * A certifier who won't confirm a positive practice deserves a small penalty:
 * opacity reduces trust. -3 is proportional (vs +15 for the full indicator).
 *
 * Only applies to the 3 positive indicators. Negative indicators are boolean
 * choices (accepts X or not) where null is treated as "does not accept" (0).
 */
const NULL_POSITIVE_PENALTY = -3;

/**
 * Compute raw score from practice indicators using a given weight set.
 * V4: includes post-slaughter electrocution, transparency bonus, VSM + controversyPenalty.
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
  if (practices.acceptsPoultryElectrocutionPostSlaughter === true) raw += weights.acceptsPostSlaughterElectrocution;
  if (practices.acceptsStunningForCattleCalvesLambs === true) raw += weights.acceptsStunning;
  if (practices.acceptsVsm === true) raw += weights.acceptsVsm;

  // V4: Transparency bonus — each true indicator adds the bonus weight
  if (practices.transparencyPublicCharter === true) raw += weights.transparencyBonus;
  if (practices.transparencyAuditReports === true) raw += weights.transparencyBonus;
  if (practices.transparencyCompanyList === true) raw += weights.transparencyBonus;

  // Controversy penalty: documented organizational failures (negative or 0)
  if (practices.controversyPenalty) raw += practices.controversyPenalty;

  return raw;
}

/**
 * Steepness constant for the sigmoid normalization.
 *
 * Controls how sharply the curve separates good from bad certifiers.
 * - Lower k (0.04-0.06): gentler curve, more linear-like
 * - Higher k (0.10-0.15): steeper, extreme compression
 * - k=0.06: balanced -- good separation without crushing the middle too hard
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
 * - Sigmoid compresses extremes, stretches the middle -> better separation
 *   between certifiers in the critical decision range.
 *
 * Implementation: sigmoid centered at raw=0, steepness SIGMOID_K.
 * Then renormalized so that maxRaw -> 100 and minRaw -> 0 exactly.
 * This ensures perfect certifiers score 100 and worst-case scores 0.
 *
 * V4: maxRaw now includes 3x transparency bonus. minRaw includes
 * post-slaughter electrocution + VSM. controversyPenalty can push raw
 * below minRaw (from booleans alone), which the sigmoid still maps
 * gracefully toward 0 -- controversies make the score asymptotically
 * approach 0 rather than going negative.
 */
function normalizeScore(raw: number, weights: WeightSet): number {
  // V4: maxRaw = 3 positive indicators + 3 transparency bonuses
  const maxRaw =
    weights.controllersAreEmployees +
    weights.controllersPresentEachProduction +
    weights.hasSalariedSlaughterers +
    3 * weights.transparencyBonus;
  // V4: minRaw = 3 null penalties + 6 negative indicators
  const minRaw =
    3 * NULL_POSITIVE_PENALTY +
    weights.acceptsMechanicalSlaughter +
    weights.acceptsElectronarcosis +
    weights.acceptsPostSlaughterElectrocution +
    weights.acceptsStunning +
    weights.acceptsVsm;

  // Sigmoid centered at raw=0
  const sig = (r: number) => 1 / (1 + Math.exp(-r * SIGMOID_K));

  // Renormalize so sig(maxRaw) -> 1.0 and sig(minRaw) -> 0.0
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
 * halalAssessment is NOT included -- it is the derived verdict, not an input.
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

// ================================================================
// V4: DYNAMIC CONTROVERSY PENALTY — Time-decayed from events
// ================================================================

/**
 * Half-life for controversy time decay (in years).
 *
 * After 5 years, a penalty is halved. After 10, quartered.
 * This reflects how organizational trust naturally recovers over time
 * without completely erasing history.
 *
 * λ = ln(2) / halfLife ≈ 0.1386 for 5-year half-life.
 */
const CONTROVERSY_HALF_LIFE_YEARS = 5;
const CONTROVERSY_LAMBDA = Math.LN2 / CONTROVERSY_HALF_LIFE_YEARS;

interface EventForDecay {
  scoreImpact: number;
  occurredAt: string | Date; // ISO date or Date object
  isActive: boolean;
}

/**
 * Compute dynamic controversy penalty from a list of events.
 *
 * For each active event with non-zero scoreImpact:
 *   decayed = scoreImpact × e^(-λ × yearsAgo)
 *
 * Returns a negative number (or 0). Clamped to [-50, 0].
 *
 * Resolved/inactive events (isActive=false) are skipped entirely —
 * they remain in the timeline for transparency but no longer
 * affect the score.
 */
export function computeControversyPenalty(
  events: EventForDecay[],
  referenceDate: Date = new Date(),
): number {
  let total = 0;

  for (const event of events) {
    if (!event.isActive || event.scoreImpact === 0) continue;

    const occurredAt = typeof event.occurredAt === "string"
      ? new Date(event.occurredAt)
      : event.occurredAt;

    const yearsAgo = (referenceDate.getTime() - occurredAt.getTime())
      / (365.25 * 24 * 60 * 60 * 1000);

    // Only decay negative impacts forward in time
    if (yearsAgo < 0) {
      // Future event — use full impact (edge case)
      total += event.scoreImpact;
    } else {
      total += event.scoreImpact * Math.exp(-CONTROVERSY_LAMBDA * yearsAgo);
    }
  }

  // Clamp to [-50, 0] — positive events don't contribute to penalty
  return Math.max(-50, Math.min(0, Math.round(total)));
}
