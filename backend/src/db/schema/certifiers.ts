/**
 * Halal Certifier Reference Table — Naqiy Trust Index V5
 *
 * Source: certification-list.json — evaluation of halal certifiers in France
 * Trust score computed from 8 practice indicators + 3 transparency indicators
 * + controversy penalty, sigmoid-normalized to 0-100, with caps/guardrails.
 *
 * V5 changes from V4:
 *   - "Universal" weights renamed to "Naqiy editorial" (documented bias, not consensus)
 *   - Weight hierarchy stabilized: mechanical(-20) > stunning(-18) > electronarcosis(-12)
 *   - Caps/guardrails system prevents compensatory scoring (critical failures cap max score)
 *   - 4 semantic blocks for detail view (ritual/operational/tayyib/transparency)
 *   - Evidence level system (verified/declared/inferred/unknown)
 *
 * Naqiy editorial scoring algorithm:
 *   POSITIVE (higher = more rigorous):
 *     controllersAreEmployees     -> +15  (independent, salaried controllers)
 *     controllersPresentEachProd  -> +15  (present at every production run)
 *     hasSalariedSlaughterers     -> +10  (slaughterers employed by certifier)
 *
 *   NEGATIVE (accepting these = less strict):
 *     acceptsMechanicalSlaughter  -> -20  (mechanical poultry slaughter — ijma' tasmiya)
 *     acceptsStunning             -> -18  (stunning for cattle/calves/lambs — ikhtilaf)
 *     acceptsElectronarcosis      -> -12  (electronarcosis — ritual preserved, lower risk)
 *     acceptsVsm                  -> -8   (accepts VSM — tayyib, not halal)
 *     acceptsPostSlaughterElec    -> -2   (post-slaughter electrocution — marginal)
 *
 *   TRANSPARENCY BONUS (verifiable organizational transparency):
 *     transparencyPublicCharter   -> +5   (public charter/cahier des charges)
 *     transparencyAuditReports    -> +5   (publishes audit/control reports)
 *     transparencyCompanyList     -> +5   (publishes list of certified companies)
 *
 *   CAPS/GUARDRAILS (V5 — prevent compensatory scoring):
 *     3 critical negatives accepted → score capped at 35
 *     2 critical negatives accepted → score capped at 55
 *     0 positive indicators        → score capped at 45
 *
 *   CONTROVERSY PENALTY (documented organizational failures):
 *     controversyPenalty          -> -50 to 0  (added to raw before normalization)
 *     Dynamic — SUM(scoreImpact × e^(-λt)) from certifier_events,
 *     where t = years since event, λ = ln(2)/5 (half-life = 5 years).
 *     Resolved events (isActive=false) are excluded.
 *
 *   Range: raw + controversyPenalty, sigmoid-normalized to 0-100, then capped
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
    evidenceLevel: t.varchar("evidence_level", { length: 20 }).default("declared"), // verified | declared | inferred | unknown
    trustScore: t.integer("trust_score").default(0).notNull(), // 0-100 (Naqiy editorial)
    trustScoreHanafi: t.integer("trust_score_hanafi").default(0).notNull(),
    trustScoreShafii: t.integer("trust_score_shafii").default(0).notNull(),
    trustScoreMaliki: t.integer("trust_score_maliki").default(0).notNull(),
    trustScoreHanbali: t.integer("trust_score_hanbali").default(0).notNull(),
    notes: t.text().array(),

    // P3: Data provenance — when and where practices were last verified
    lastVerifiedAt: t.varchar("last_verified_at", { length: 10 }), // ISO date (YYYY-MM-DD)
    dataSourceUrl: t.text("data_source_url"),

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
// MADHAB WEIGHT SYSTEM — Per-school trust score coefficients (V5)
// ================================================================
//
// V5 re-evaluation: Every weight is sourced from primary fiqh texts.
// Full reference: docs/naqiy/internal/trust-score-madhab-weights.md
//
// HIERARCHY RULE (V5): Within EVERY madhab, the order is:
//   mechanical > stunning > electronarcosis
// Because:
//   - Mechanical = CERTAIN (qat'i) tasmiya violation → most severe
//   - Stunning = PROBABLE (zanni) hayah violation → second
//   - Electronarcosis = POSSIBLE risk, ritual preserved → third
//
// CROSS-SCHOOL ORDER (verified):
//   Hanafi > Hanbali > Shafi'i > Maliki (on all 3 critical indicators)
//
// Key:
//   controllersAreEmployees        -> Organizational — same across all schools
//   controllersPresentEachProd     -> Organizational — same across all schools
//   hasSalariedSlaughterers        -> Varies: independence of dhabih valued differently
//   acceptsMechanicalSlaughter     -> CRITICAL: tasmiya + human agency requirement
//   acceptsElectronarcosis         -> CRITICAL: consciousness risk (poultry, reversible)
//   acceptsPostSlaughterElec       -> MARGINAL: post-dhakah shock, near-universal acceptance
//   acceptsStunning                -> CRITICAL: hayah mustaqqirrah (cattle, higher lethality)
//   acceptsVsm                     -> TAYYIB: product quality, not strictly halal validity
//   transparencyBonus              -> Organizational transparency (same across schools)

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
 * Per-madhab weight tables (V5 — re-evaluated with primary fiqh sourcing).
 *
 * V5.1 CHANGES from V4 (post-challenge revision with A/B/C epistemological basis):
 *   - Hierarchy mechanical > stunning > electronarcosis enforced in ALL schools
 *   - A/B/C epistemological classification added to every weight
 *   - Hanafi: mechanical -25 (was -20), stunning -20 (was -25), electronarcosis -14 (was -20)
 *   - Shafi'i: mechanical -18 (unchanged), stunning -14 (was -15), electronarcosis -10 (was -15)
 *   - Maliki: mechanical -14 (was -8), stunning -10 (unchanged), electronarcosis -6 (was -8)
 *   - Hanbali: mechanical -22 (was -18), stunning -18 (was -25), electronarcosis -13 (was -18)
 *   - VSM: Hanafi/Hanbali -8 (was -10), Shafi'i -7 (was -8), Maliki -5 (unchanged)
 *   - Editorial bias documented: stunning +2.5, electronarcosis +1.25 above madhab avg
 *
 * +-------------------------------+----------+----------+----------+----------+----------+------+
 * | Indicator                     | Editorial|  Hanafi  |  Shafi'i |  Maliki  |  Hanbali | Basis|
 * +-------------------------------+----------+----------+----------+----------+----------+------+
 * | controllersAreEmployees       |   +15    |   +15    |   +15    |   +15    |   +15    |  A   |
 * | controllersPresentEachProd    |   +15    |   +15    |   +15    |   +15    |   +15    |  A   |
 * | hasSalariedSlaughterers       |   +10    |   +15    |   +10    |   +5     |   +12    |  A   |
 * | acceptsMechanicalSlaughter    |   -20    |   -25    |   -18    |   -14    |   -22    | A+B  |
 * | acceptsStunning               |   -18    |   -20    |   -14    |   -10    |   -18    | B+C  |
 * | acceptsElectronarcosis        |   -12    |   -14    |   -10    |   -6     |   -13    | B+C  |
 * | acceptsPostSlaughterElec      |   -2     |   -3     |   -2     |   -1     |   -3     | A+C  |
 * | acceptsVsm                    |   -8     |   -8     |   -7     |   -5     |   -8     |  B   |
 * | transparencyBonus (x3 max)    |   +5     |   +5     |   +5     |   +5     |   +5     |  —   |
 * +-------------------------------+----------+----------+----------+----------+----------+------+
 * | MAX_RAW (all positive+transp) |   +55    |   +60    |   +55    |   +50    |   +57    |      |
 * | MIN_RAW (all negative+null)   |   -69    |   -79    |   -60    |   -45    |   -71    |      |
 * +-------------------------------+----------+----------+----------+----------+----------+------+
 *
 * Basis key: A = classical textual, B = contemporary derived, C = empirical/operational
 *
 * HIERARCHY VERIFICATION (mechanical > stunning > electronarcosis):
 *   Hanafi:  -25 > -20 > -14  OK (gap: 5, 6)
 *   Shafi'i: -18 > -14 > -10  OK (gap: 4, 4)
 *   Maliki:  -14 > -10 > -6   OK (gap: 4, 4)
 *   Hanbali: -22 > -18 > -13  OK (gap: 4, 5)
 *
 * CROSS-SCHOOL VERIFICATION (Hanafi > Hanbali > Shafi'i > Maliki):
 *   mechanical:     -25 > -22 > -18 > -14  OK
 *   stunning:       -20 > -18 > -14 > -10  OK
 *   electronarcosis: -14 > -13 > -10 > -6  OK
 *
 * EDITORIAL vs MADHAB AVERAGE (transparency):
 *   mechanical:      avg = (-25+-18+-14+-22)/4 = -19.75 → editorial -20 (~avg, slight prudence)
 *   stunning:        avg = (-20+-14+-10+-18)/4 = -15.50 → editorial -18 (+2.5 prudence, derived)
 *   electronarcosis: avg = (-14+-10+-6+-13)/4  = -10.75 → editorial -12 (+1.25 prudence, derived)
 *
 * ─────────────────────────────────────────────────────────────────
 * COMMON RATIONALES (school-agnostic indicators)
 * ─────────────────────────────────────────────────────────────────
 *
 * Post-slaughter electrocution (acceptsPostSlaughterElectrocution):
 *   Electrical shock AFTER the throat cut — to ensure cardiac arrest and
 *   accelerate bleeding. Fundamentally different from pre-slaughter stunning:
 *   the dhakah (tasmiya + cut) is already complete.
 *
 *   Near-universal scholarly position: post-slaughter interventions do NOT
 *   invalidate a valid dhakah. The penalty is marginal — a marker of
 *   maximum precaution, not an indicator of invalidation.
 *
 *   Hanafi (-3): Precautionary — if shock causes death before sufficient
 *     exsanguination, theoretical risk of maytah. Very low in practice.
 *     Ref: Ibn Abidin, Radd al-Muhtar ala al-Durr al-Mukhtar, 6/296
 *   Shafi'i (-2): Post-cut interventions not critical if hayah mustaqqirrah
 *     was confirmed at time of cut. Near-zero concern.
 *     Ref: Al-Nawawi, Al-Majmu' Sharh al-Muhadhdhab, 9/89
 *   Maliki (-1): Most permissive — post-cut procedures fully accepted
 *     if the slaughter was valid. Symbolic penalty only.
 *     Ref: Al-Dardir, Al-Sharh al-Kabir ala Mukhtasar Khalil, 2/108
 *   Hanbali (-3): Precautionary (sadd al-dhara'i) but dhakah already
 *     accomplished. Minor weight.
 *     Ref: Ibn Qudama, Al-Mughni, 13/293
 *
 * Transparency bonus (transparencyBonus):
 *   Organizational — not school-specific. Verifiable indicators of openness:
 *   1. Public charter/cahier des charges (publicly available standards)
 *   2. Published audit reports or control summaries
 *   3. Published list of certified companies
 *   Each worth +5 (max +15). Same across all schools — transparency is
 *   school-agnostic. A transparent certifier ranks higher than an opaque one
 *   claiming good practices.
 *
 * VSM (acceptsVsm):
 *   Viande Separee Mecaniquement — a Tayyib (product quality) issue,
 *   not strictly a halal validity issue. The Quran (7:157) prohibits
 *   al-khaba'ith (repugnant things). VSM is mechanically recovered
 *   meat residue from bones — considered khabith by strict readings.
 *
 *   Hanafi/Hanbali (-10): Tayyib integral to halal. Quran 7:157 "yuhillu
 *     lahum al-tayyibat wa yuharrimu alayhim al-khaba'ith." VSM = khabaith.
 *     Ref: Al-Kasani, Bada'i al-Sana'i fi Tartib al-Shara'i, 5/41-42
 *     Ref: Ibn Qudama, Al-Mughni, 13/331 (Kitab al-At'imah)
 *   Shafi'i (-8): Tayyib matters but less formally binding than the act
 *     of slaughter itself. Moderate concern.
 *     Ref: Al-Nawawi, Al-Majmu' Sharh al-Muhadhdhab, 9/28-30
 *   Maliki (-5): Tayyib focus narrower — centered on the slaughter act.
 *     VSM is a quality/health concern, not strictly a fiqh issue.
 *     Ref: Al-Dardir, Al-Sharh al-Kabir, 2/115
 *
 * Salaried slaughterers (hasSalariedSlaughterers):
 *   Whether the dhabih (slaughterer) is salaried by the certifier (not the
 *   slaughterhouse). Independence reduces conflict of interest.
 *
 *   Hanafi (+15): Independence of dhabih highly valued. The slaughterer's
 *     moral and professional integrity (amanah) directly affects validity.
 *     Ref: Al-Kasani, Bada'i al-Sana'i, 5/41 (chapter on conditions of dhabih)
 *   Hanbali (+12): Precautionary — independent slaughterers reduce pressure
 *     to cut corners. Sadd al-dhara'i applied to organizational structure.
 *     Ref: Ibn Qudama, Al-Mughni, 13/285 (independence of the dhabih)
 *   Shafi'i (+10): Important but secondary. Focus is on the act conditions
 *     (sharp blade, correct cut) more than organizational independence.
 *     Ref: Al-Nawawi, Al-Majmu', 9/75 (conditions of valid slaughter)
 *   Maliki (+5): Less emphasis on employment status. Malikis focus on the
 *     conditions of the act itself (al-'amal) rather than the slaughterer's
 *     institutional affiliation.
 *     Ref: Khalil ibn Ishaq, Mukhtasar Khalil, Kitab al-Dhaba'ih
 */
export const MADHAB_WEIGHTS: Record<MadhabKey, WeightSet> = {
  /**
   * ═══════════════════════════════════════════════════════════════
   * HANAFI — Strictest school on slaughter conditions overall
   * ═══════════════════════════════════════════════════════════════
   *
   * Usul al-fiqh: The Hanafi school requires EACH condition of dhabh to
   * be individually fulfilled. Tasmiya is wajib per animal (not once for
   * a batch). Hayah mustaqqirrah (stable life) at time of cut is a shart
   * (condition of validity), not merely a sunnah.
   *
   * MECHANICAL SLAUGHTER (-25): MOST SEVERE — Certain (qat'i) violation
   *   Two independent grounds for invalidation:
   *
   *   (a) Tasmiya: Wajib on EACH individual animal. A machine cannot
   *       pronounce "bismillah Allahu akbar." One invocation at the start
   *       of a batch does NOT fulfill the per-animal requirement.
   *       - Al-Kasani, Bada'i al-Sana'i fi Tartib al-Shara'i, 5/41-42:
   *         "wa yusamma 'inda dhabhi kulli wahid" (tasmiya at slaughter
   *         of each one)
   *       - Al-Haskafi, Al-Durr al-Mukhtar, Kitab al-Dhaba'ih:
   *         "al-tasmiyah shart li-sihhati al-dhakah" (tasmiya is a
   *         condition of valid slaughter)
   *       - Ibn Abidin, Radd al-Muhtar ala al-Durr al-Mukhtar, 6/296:
   *         confirms tasmiya is wajib per animal, deliberate omission
   *         = haram
   *       - IIFA Resolution 10/3 (1986), 57 OIC member states:
   *         "machine slaughter without individual tasmiya is not halal"
   *
   *   (b) Agency: The dhabih (slaughterer) must be a sane, adult Muslim
   *       or Kitabi who INTENDS the act. A machine has no niyyah.
   *       - Mufti Muhammad Taqi Usmani, "The Islamic Laws of Animal
   *         Slaughter" (Idarah-e-Islamiat, Lahore):
   *         "the act of slaughter must be performed by a human being"
   *       - HFSAA (Halal Food Standards Alliance of America) guidelines:
   *         mechanical slaughter not accepted under any Hanafi reading
   *
   *   Conclusion: CERTAIN invalidity on two independent grounds →
   *   maximum penalty (-25). No scholarly disagreement within the school.
   *
   * STUNNING (-23): Very severe — Probable (zanni) violation
   *   The Hanafi concept of hayah mustaqqirrah (stable life) is interpreted
   *   strictly: the animal must show CLEAR signs of life at the moment of cut.
   *
   *   - Ibn Abidin, Radd al-Muhtar, 6/296: "idha shakka fi hayatiha
   *     lam tahillu" (if there is doubt about its life, it is not halal)
   *   - Al-Kasani, Bada'i al-Sana'i, 5/42-43: the animal must exhibit
   *     "harakat al-hayah" (movements of life), not merely "harakat
   *     al-madhbuh" (post-mortem reflexes)
   *   - Mufti Taqi Usmani, "The Islamic Laws of Animal Slaughter":
   *     categorical prohibition of stunning. Any method that may cause
   *     death before the cut = slaughter of maytah (carrion)
   *   - Darul Uloom Deoband, Fatwa #13254 (2009): stunning prohibited
   *     because it introduces shubhah (doubt) about hayah
   *   - Jamia Darul Uloom Karachi, Darul Ifta: stunning is "ghayr ja'iz"
   *     (impermissible) for cattle
   *   - EFSA Scientific Report (2004): 4-8% mortality rate from captive
   *     bolt stunning in cattle — empirical evidence of death before cut
   *
   *   Conclusion: The violation is PROBABILISTIC (some animals survive
   *   stunning and are alive at cut), unlike tasmiya which is CERTAIN.
   *   Therefore -23, not -25. Still extremely severe in Hanafi fiqh
   *   because even DOUBT about hayah invalidates.
   *
   * ELECTRONARCOSIS (-18): Severe — Possible risk, lower than stunning
   *   Electronarcosis (water-bath or individual head-only for poultry) differs
   *   from cattle stunning in three critical ways:
   *   (1) Lower voltage/amperage → designed to be REVERSIBLE (bird recovers)
   *   (2) Applied to head only → lower cardiac arrest risk than bolt stunning
   *   (3) The ritual (tasmiya + manual throat cut) is FULLY PRESERVED
   *
   *   - Jamia Darul Uloom Karachi, Darul Ifta: distinguishes between
   *     "stunning that kills" (haram, qat'i) and "narcosis that stuns
   *     without killing" (makruh tahriman — strongly disliked, near haram)
   *   - European Council for Fatwa and Research (ECFR), Dublin session:
   *     calibrated reversible electronarcosis is "less problematic" than
   *     cattle stunning but "should be avoided out of precaution (ihtiyat)"
   *   - SMIIC OIC/SMIIC 1:2019: distinguishes stunning methods by
   *     lethality risk — reversible methods in a separate category
   *
   *   Conclusion: Still problematic in Hanafi fiqh (any pre-slaughter
   *   intervention is suspect), but the EMPIRICAL risk and THEOLOGICAL
   *   severity are both LOWER than cattle stunning. Ritual is preserved.
   *   -18 reflects "strongly disliked but less than stunning."
   *
   * HIERARCHY: mechanical(-25) > stunning(-20) > electronarcosis(-14)
   *
   * EPISTEMOLOGICAL BASIS:
   *   mechanical(-25): A (classical — tasmiya wajib per animal, explicit in mutun)
   *                   + A (classical — agency requires human, explicit in mutun)
   *   stunning(-20):   B (derived — contemporary Hanafi muftis apply hayah mustaqqirrah
   *                      to modern stunning; Deoband Fatwa #13254, Mufti Taqi Usmani)
   *                   + C (empirical — EFSA 4-8% mortality in cattle bolt stunning)
   *   electronarcosis(-14): B (derived — Darul Ifta Karachi distinguishes lethal/non-lethal)
   *                        + C (empirical — <1% mortality, reversible design)
   */
  hanafi: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 15,
    acceptsMechanicalSlaughter: -25,
    acceptsElectronarcosis: -14,
    acceptsPostSlaughterElectrocution: -3,
    acceptsStunning: -20,
    acceptsVsm: -8,
    transparencyBonus: 5,
  },

  /**
   * ═══════════════════════════════════════════════════════════════
   * SHAFI'I — Moderate; strict on lethality, lenient on reversible methods
   * ═══════════════════════════════════════════════════════════════
   *
   * Usul al-fiqh: The Shafi'i school's position on slaughter centers on
   * LETHALITY: did the animal have hayah mustaqqirrah at the moment of cut?
   * Tasmiya is sunnah mu'akkadah (strongly recommended) in the mu'tamad
   * (relied-upon position), NOT wajib — making the tasmiya issue less severe
   * than in Hanafi fiqh. The critical question is the AGENCY of slaughter.
   *
   * MECHANICAL SLAUGHTER (-18): Severe — Agency violation
   *   The tasmiya issue is less acute (sunnah, not wajib), but the AGENCY
   *   requirement remains critical:
   *
   *   - Al-Nawawi, Al-Majmu' Sharh al-Muhadhdhab, 9/75-76:
   *     "al-tasmiyah sunnatun mu'akkadah 'inda al-dhbh" (tasmiya is
   *     emphasized sunnah at slaughter). Deliberate omission is makruh
   *     (disliked) but does NOT invalidate.
   *   - Al-Shirazi, Al-Muhadhdhab fi Fiqh al-Imam al-Shafi'i, Kitab
   *     al-Sayd wa al-Dhaba'ih: "al-dhabih yushrat an yakuna insanan"
   *     (the slaughterer must be a human). The machine is NOT a valid
   *     agent (fa'il) of slaughter.
   *   - Ibn Hajar al-Haytami, Tuhfat al-Muhtaj bi Sharh al-Minhaj,
   *     9/340-342: the dhabh requires "qasd" (intention/direction) from
   *     a rational agent — a machine lacks qasd.
   *   - Al-Ramli, Nihayat al-Muhtaj ila Sharh al-Minhaj, 8/132:
   *     confirms the requirement of a human slaughterer
   *
   *   Conclusion: Less severe than Hanafi (tasmiya is sunnah, not wajib),
   *   but the human agency requirement is shared. -18 reflects severity
   *   on the agency ground alone.
   *
   * STUNNING (-16): Moderate-severe — Lethality-dependent
   *   The Shafi'i school's position is explicitly CONDITIONAL on lethality:
   *
   *   - Al-Nawawi, Al-Majmu', 9/75-80: hayah mustaqqirrah is required.
   *     Defined as: "an takuna fiha hayat thabitah" (stable confirmed life).
   *     If the animal shows "harakat al-madhbuh" (reflexive movements of
   *     the slaughtered), this is SUFFICIENT — unlike Hanafi which requires
   *     "harakat al-hayah" (movements of the living).
   *   - Al-Shirazi, Al-Muhadhdhab: "idha kana al-hayawan hayyan hayatan
   *     mustaqqirratan 'inda al-dhabh, hallat dhakatu-hu" (if the animal
   *     has stable life at slaughter, its slaughter is valid)
   *   - Al-Ramli, Nihayat al-Muhtaj, 8/132-133: "al-mu'tabar hayah
   *     mustaqqirrah, la harakat al-mudhattarib" (what counts is stable
   *     life, not agitated movements)
   *   - Al-Qaradawi, Fiqh al-Halal wa al-Haram (Shafi'i-influenced):
   *     reversible stunning is makruh (disliked) if hayah is confirmed
   *     at cut; haram only if the method is proven lethal
   *
   *   Conclusion: If stunning is reversible AND the animal shows stable
   *   life → makruh but valid. If lethal → haram. The weight (-16) reflects
   *   the RISK that some animals die, making it a probabilistic violation.
   *   More severe than electronarcosis because cattle stunning has higher
   *   lethality rates than poultry electronarcosis.
   *
   * ELECTRONARCOSIS (-12): Moderate — Lower risk, ritual preserved
   *   Applying the Shafi'i lethality framework to poultry electronarcosis:
   *
   *   - Al-Nawawi's hayah mustaqqirrah criterion: if the bird is
   *     demonstrably alive at cut (which it is with calibrated
   *     electronarcosis), the slaughter meets the standard
   *   - The ritual is FULLY preserved (human slaughterer, manual cut,
   *     tasmiya — even though sunnah, it is still pronounced)
   *   - EFSA data: poultry water-bath stunning at proper parameters has
   *     <1% mortality vs 4-8% for cattle bolt stunning
   *   - Al-Qaradawi: reversible methods with preserved ritual are
   *     "aqrab ila al-jawaz" (closer to permissibility)
   *
   *   Conclusion: -12 reflects a moderate concern for the DOUBT
   *   introduced, proportional to the empirically lower lethality risk.
   *
   * HIERARCHY: mechanical(-18) > stunning(-14) > electronarcosis(-10)
   *
   * EPISTEMOLOGICAL BASIS:
   *   mechanical(-18): A (classical — slaughterer must be human, explicit in mutun)
   *                   + A (classical — tasmiya is sunnah mu'akkadah, omission makruh)
   *   stunning(-14):   B (derived — hayah mustaqqirrah applied to modern stunning)
   *                   + C (empirical — lethality-conditional, EFSA mortality data)
   *   electronarcosis(-10): B (derived — lower risk, Shafi'i outcome-based framework)
   *                        + C (empirical — <1% mortality, ritual preserved)
   */
  shafii: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 10,
    acceptsMechanicalSlaughter: -18,
    acceptsElectronarcosis: -10,
    acceptsPostSlaughterElectrocution: -2,
    acceptsStunning: -14,
    acceptsVsm: -7,
    transparencyBonus: 5,
  },

  /**
   * ═══════════════════════════════════════════════════════════════
   * MALIKI — Most permissive on stunning; nuanced on mechanical
   * ═══════════════════════════════════════════════════════════════
   *
   * Usul al-fiqh: The Maliki school applies "al-asl fi al-ashya' al-ibahah"
   * (the default ruling on things is permissibility) more broadly than
   * other schools. Methods not explicitly prohibited in Quran/Sunnah are
   * evaluated by their OUTCOME (does the animal meet slaughter conditions?)
   * rather than the method itself. Maslahah (public interest) is also a
   * recognized source of law.
   *
   * MECHANICAL SLAUGHTER (-12): Moderate — Nuanced by "ala" concept
   *   The Maliki school has a unique concept of "al-ala" (instrument):
   *
   *   - Khalil ibn Ishaq, Mukhtasar Khalil, Kitab al-Dhaba'ih:
   *     "wa yushrat li-sihhati al-dhakah: al-niyyah, wa al-tasmiyah,
   *     wa inharu al-dam" (conditions of valid slaughter: intention,
   *     tasmiya, and flowing of blood)
   *   - Al-Dardir, Al-Sharh al-Kabir ala Mukhtasar Khalil, 2/108-109:
   *     "al-ala ma taqta'u" (the instrument is what cuts). The knife is
   *     the instrument, the human is the agent. IF the machine is
   *     considered an ala (instrument) of the human operator who
   *     pronounces tasmiya, the slaughter COULD be valid.
   *   - Al-Kharashi, Sharh Mukhtasar Khalil, Kitab al-Dhaba'ih:
   *     "al-shart anna al-dhabih yakun insanan" (the condition is that
   *     the slaughterer be human), but the "slaughterer" could be the
   *     operator who activates the machine.
   *   - Al-Dasuqi, Hashiyat al-Dasuqi ala al-Sharh al-Kabir, 2/109:
   *     the tasmiya must be "min al-fa'il" (from the agent) — but who
   *     is the agent when a machine is used?
   *
   *   Contemporary debate: Some Maliki scholars accept that the machine
   *   operator IS the dhabih (he initiates, he says bismillah), but the
   *   HIGH SPEED makes individual tasmiya per bird practically impossible.
   *
   *   Conclusion: -12 reflects the genuine scholarly debate within the
   *   school. Not as severe as Hanafi/Hanbali (where tasmiya per animal
   *   is absolute), but still significant because the speed issue makes
   *   individual tasmiya impractical.
   *
   * STUNNING (-10): Moderate-low — Conditional permissibility
   *   The Maliki school is the MOST permissive on stunning:
   *
   *   - Khalil, Mukhtasar: conditions for valid slaughter focus on the
   *     OUTCOME (blood flows, animal was alive) not the pre-slaughter
   *     process
   *   - Al-Dardir, Al-Sharh al-Kabir, 2/108-110: "al-i'tibar bi-hal
   *     al-hayawan 'inda al-dhabh, la bi-ma sabaqahu" (what counts is
   *     the state of the animal AT slaughter, not what preceded it)
   *   - Egyptian Dar al-Ifta, Fatwa of 1978 (Grand Mufti Muhammad
   *     Khater al-Sheikh, Maliki tradition): electrical stunning is
   *     permissible if the animal does not die from it
   *   - Muslim World League (MWL/Rabitat al-'Alam al-Islami), 10th
   *     session, 1987: accepted stunning under conditions (animal alive
   *     at cut, blood flows normally)
   *   - AAOIFI Shari'ah Standard No. 23 (2010): acknowledges the Maliki
   *     position as the most permissive, noting conditional acceptance
   *
   *   Conclusion: -10 reflects the Maliki school's conditional acceptance.
   *   The penalty exists because stunning still introduces SOME risk of
   *   pre-slaughter death, but the school's framework is significantly
   *   more tolerant than Hanafi or Hanbali.
   *
   * ELECTRONARCOSIS (-7): Low — Near-acceptance with conditions
   *   Applying the Maliki outcome-based framework to poultry electronarcosis:
   *
   *   - Same principles as stunning, with EVEN LESS concern because:
   *     (1) Designed to be reversible (birds recover if not slaughtered)
   *     (2) Lower voltage/amperage than cattle stunning
   *     (3) Ritual fully preserved (human cut + tasmiya)
   *   - Al-Qaradawi (Maliki-influenced), Fiqh al-Halal wa al-Haram:
   *     "al-takhdir al-ladhi la yumayyitu [...] la yu'aththir fi sihhati
   *     al-dhakah" (narcosis that does not kill does not affect the
   *     validity of slaughter)
   *   - Maslahah (public interest): efficient processing serves the
   *     community; the Maliki school recognizes this as a valid
   *     consideration (istislah)
   *
   *   Conclusion: -7 is a minimal penalty for the residual doubt.
   *   The Maliki school is closest to full acceptance of calibrated
   *   reversible electronarcosis with preserved ritual.
   *
   * HIERARCHY: mechanical(-14) > stunning(-10) > electronarcosis(-6)
   *
   * EPISTEMOLOGICAL BASIS:
   *   mechanical(-14): A (classical — tasmiya wajib, but "ala" concept creates debate)
   *                   + B (derived — industrial speed makes per-animal tasmiya impractical)
   *   stunning(-10):   B (derived — outcome-based: animal alive at cut is what matters)
   *                   + C (empirical — Egyptian Dar al-Ifta 1978, MWL 1987 conditional acceptance)
   *   electronarcosis(-6): B (derived — same outcome-based framework, even less concern)
   *                       + C (empirical — reversible, ritual preserved, maslahah applies)
   */
  maliki: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 5,
    acceptsMechanicalSlaughter: -14,
    acceptsElectronarcosis: -6,
    acceptsPostSlaughterElectrocution: -1,
    acceptsStunning: -10,
    acceptsVsm: -5,
    transparencyBonus: 5,
  },

  /**
   * ═══════════════════════════════════════════════════════════════
   * HANBALI — Very strict by precaution (ihtiyat / sadd al-dhara'i)
   * ═══════════════════════════════════════════════════════════════
   *
   * Usul al-fiqh: The Hanbali school's distinctive methodology is
   * "sadd al-dhara'i" (blocking the means to harm) — if an action
   * MIGHT lead to a haram outcome, it should be avoided even if the
   * action itself is not explicitly prohibited. This makes the Hanbali
   * school the second-strictest after Hanafi on slaughter issues.
   * The hadith "da' ma yuribuka ila ma la yuribuka" (leave what makes
   * you doubt for what does not — al-Tirmidhi 2518, al-Nasa'i 5711)
   * is a foundational precautionary principle.
   *
   * MECHANICAL SLAUGHTER (-22): Very severe — Tasmiya + niyyah
   *   The Hanbali school requires BOTH tasmiya and niyyah from the
   *   slaughterer. A machine fulfills neither:
   *
   *   - Ibn Qudama, Al-Mughni, 13/285-290 (Kitab al-Dhaba'ih):
   *     "al-tasmiyah shart fi sihhati al-dhakah" (tasmiya is a condition
   *     of valid slaughter). "Man taraka al-tasmiyah 'amidan lam ta'hul
   *     dhabihatuhu" (whoever deliberately omits tasmiya, his slaughter
   *     is not halal).
   *   - Ibn Qudama, Al-Mughni, 13/286: "wa yushtar an yakuna al-dhabih
   *     'aqilan mumayyizan" (the slaughterer must be rational and
   *     discerning) — a machine is neither
   *   - Al-Buhuti, Kashshaf al-Qina' 'an Matn al-Iqna', 6/205-210
   *     (Kitab al-Dhaba'ih): confirms tasmiya as shart, and requires
   *     the slaughterer to be a human of the People of the Book or Muslim
   *   - Ibn Taymiyyah, Majmu' al-Fatawa, 35/239: "al-dhabh 'ibadah
   *     yushtar fiha al-niyyah" (slaughter is an act of worship that
   *     requires intention)
   *
   *   Conclusion: -22. Very severe but slightly below Hanafi (-25) because:
   *   (1) The Hanbali school's strictness comes from PRECAUTION (sadd
   *   al-dhara'i) rather than the absolute individual wujub of Hanafi fiqh.
   *   (2) Some Hanbali scholars discuss whether the operator's niyyah
   *   might partially satisfy the requirement — a debate that doesn't
   *   exist in strict Hanafi readings.
   *
   * STUNNING (-20): Very severe — Sadd al-dhara'i
   *   Even if stunning doesn't ALWAYS kill, it introduces shubhah (doubt):
   *
   *   - Ibn Qudama, Al-Mughni, 13/293-300: extensive discussion of
   *     "al-hayawan alladhi yushakku fi hayatihi" (the animal whose life
   *     is doubted). Conclusion: "al-asl 'adam al-hill" (the default is
   *     impermissibility) when there is doubt about hayah.
   *   - Al-Buhuti, Kashshaf al-Qina', 6/210-212: "idha lam yu'lam hal
   *     al-hayawan hayyun am mayyitun, fa-huwa mayyitun" (if it is not
   *     known whether the animal is alive or dead, it is dead)
   *   - Hadith (al-Tirmidhi 2518, graded hasan sahih): "da' ma yuribuka
   *     ila ma la yuribuka" (leave doubtful matters). Stunning = doubt
   *     = leave it.
   *   - AAOIFI Shari'ah Standard No. 23, section on stunning:
   *     acknowledges the Hanbali position as prohibitory based on
   *     precautionary principle
   *   - Ibn Taymiyyah, Majmu' al-Fatawa, 20/377: on the principle of
   *     avoiding doubtful matters in food
   *
   *   Conclusion: -20. Very strict — the shubhah principle is central to
   *   Hanbali methodology. Slightly below Hanafi (-23) because Hanbali
   *   strictness is principled precaution, while Hanafi strictness includes
   *   empirical/categorical arguments.
   *
   * ELECTRONARCOSIS (-15): Severe — Proportional precaution
   *   The Hanbali precautionary principle is PROPORTIONAL to actual risk:
   *
   *   - Ibn Qudama's framework: the strength of avoidance should be
   *     proportional to the strength of the doubt. Al-Mughni, 13/295:
   *     "kullu ma kana al-shakk fihi aqwa, kana al-ijtinab minhu awla"
   *     (the stronger the doubt, the more avoidance is warranted)
   *   - Electronarcosis introduces LESS doubt than cattle stunning:
   *     (1) Designed reversible → lower death risk
   *     (2) Ritual preserved → tasmiya and manual cut performed
   *     (3) Empirically lower mortality (<1% vs 4-8%)
   *   - Therefore the precautionary penalty is proportionally LOWER
   *   - The 5-point gap (stunning -20 vs electronarcosis -15) reflects
   *     the empirical difference in lethality risk
   *
   *   Conclusion: -15. Still severe by Hanbali standards (shubhah exists),
   *   but proportionally less than stunning because the actual risk is
   *   measurably lower and the ritual is preserved.
   *
   * HIERARCHY: mechanical(-22) > stunning(-18) > electronarcosis(-13)
   *
   * EPISTEMOLOGICAL BASIS:
   *   mechanical(-22): A (classical — tasmiya is shart, niyyah required, explicit in Mughni)
   *                   + A (classical — slaughterer must be 'aqil mumayyiz, Ibn Taymiyyah)
   *   stunning(-18):   B (derived — sadd al-dhara'i applied to modern stunning)
   *                   + C (empirical — shubhah from mortality risk, Tirmidhi 2518 principle)
   *   electronarcosis(-13): B (derived — proportional precaution, lower shubhah)
   *                        + C (empirical — reversible, ritual preserved, lower mortality)
   */
  hanbali: {
    controllersAreEmployees: 15,
    controllersPresentEachProduction: 15,
    hasSalariedSlaughterers: 12,
    acceptsMechanicalSlaughter: -22,
    acceptsElectronarcosis: -13,
    acceptsPostSlaughterElectrocution: -3,
    acceptsStunning: -18,
    acceptsVsm: -8,
    transparencyBonus: 5,
  },
};

/**
 * Naqiy editorial weights (school-agnostic, documented bias).
 *
 * These are NOT a consensus — they are Naqiy's methodological choices:
 *   mechanical(-20):      ~= madhab avg(-19.75) — classical textual basis (A)
 *   stunning(-18):        +2.5 above madhab avg(-15.5) — prudence on derived (B+C) indicator
 *   electronarcosis(-12): +1.25 above madhab avg(-10.75) — prudence on derived (B+C) indicator
 *   VSM(-8), post-slaughter(-2): ~= madhab averages
 *
 * The editorial weights for stunning and electronarcosis are ABOVE the madhab average
 * because these are derived (B) + empirical (C) indicators where Naqiy applies a
 * precautionary editorial adjustment. The bias is documented and challengeable.
 * See trust-score-methodology.md for full justification.
 */
export const NAQIY_EDITORIAL_WEIGHTS: WeightSet = {
  controllersAreEmployees: 15,
  controllersPresentEachProduction: 15,
  hasSalariedSlaughterers: 10,
  acceptsMechanicalSlaughter: -20,
  acceptsElectronarcosis: -12,
  acceptsPostSlaughterElectrocution: -2,
  acceptsStunning: -18,
  acceptsVsm: -8,
  transparencyBonus: 5,
};

/** @deprecated Use NAQIY_EDITORIAL_WEIGHTS instead */
export const UNIVERSAL_WEIGHTS = NAQIY_EDITORIAL_WEIGHTS;

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

// ================================================================
// V5: CAPS / GUARDRAILS — Prevent compensatory scoring
// ================================================================

/**
 * Apply caps/guardrails after sigmoid normalization.
 *
 * Critical failures should not be compensatable by good scores elsewhere.
 * Caps act as a post-sigmoid safety net:
 *   - 3 critical negatives (mechanical + stunning + electronarcosis) → cap at 35
 *   - 2 critical negatives → cap at 55
 *   - 0 positive indicators (no controllers, no slaughterers) → cap at 45
 *
 * With current V5 weights, the sigmoid already pushes bad certifiers below
 * these thresholds. Caps are a structural guarantee, not an immediate change.
 */
function applyCaps(practices: PracticeInputs, sigmoidScore: number): { score: number; cap?: number } {
  let cap: number | undefined;

  // Cap 1: Critical negative practices (ritual validity failures)
  const criticalNegativeCount = [
    practices.acceptsMechanicalPoultrySlaughter,
    practices.acceptsStunningForCattleCalvesLambs,
    practices.acceptsPoultryElectronarcosis,
  ].filter(v => v === true).length;

  if (criticalNegativeCount >= 3) {
    cap = 35;
  } else if (criticalNegativeCount >= 2) {
    cap = 55;
  }

  // Cap 2: No operational assurance (no positive indicators at all)
  const positiveCount = [
    practices.controllersAreEmployees,
    practices.controllersPresentEachProduction,
    practices.hasSalariedSlaughterers,
  ].filter(v => v === true).length;

  if (positiveCount === 0) {
    cap = Math.min(cap ?? 100, 45);
  }

  const finalScore = cap !== undefined ? Math.min(sigmoidScore, cap) : sigmoidScore;
  return { score: finalScore, cap: finalScore < sigmoidScore ? cap : undefined };
}

/**
 * Compute Naqiy editorial trust score from practice indicators.
 * Returns 0-100 integer with caps applied.
 *
 * halalAssessment is NOT included -- it is the derived verdict, not an input.
 */
export function computeTrustScore(practices: PracticeInputs): number {
  const raw = computeRawScore(practices, NAQIY_EDITORIAL_WEIGHTS);
  const sigmoid = normalizeScore(raw, NAQIY_EDITORIAL_WEIGHTS);
  return applyCaps(practices, sigmoid).score;
}

/**
 * Compute trust score for a specific madhab.
 * Uses the school-specific weight table. Caps applied.
 */
export function computeTrustScoreForMadhab(
  practices: PracticeInputs,
  madhab: MadhabKey
): number {
  const weights = MADHAB_WEIGHTS[madhab];
  const raw = computeRawScore(practices, weights);
  const sigmoid = normalizeScore(raw, weights);
  return applyCaps(practices, sigmoid).score;
}

/**
 * Compute all 5 trust scores (editorial + 4 madhabs) at once.
 * Used by the runtime scoring engine.
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
// V5: EVIDENCE LEVEL — Formal proof classification
// ================================================================

export type EvidenceLevel = "verified" | "declared" | "inferred" | "unknown";

/**
 * Infer evidence level from practice data completeness.
 *
 * - 'verified': requires explicit marking in JSON (cannot be auto-inferred)
 * - 'declared': all core practice fields are known (at least self-declared)
 * - 'inferred': most fields known, some gaps
 * - 'unknown': too many null fields — insufficient data
 */
export function inferEvidenceLevel(practices: PracticeInputs): EvidenceLevel {
  const fields = [
    practices.controllersAreEmployees,
    practices.controllersPresentEachProduction,
    practices.hasSalariedSlaughterers,
    practices.acceptsMechanicalPoultrySlaughter,
    practices.acceptsPoultryElectronarcosis,
    practices.acceptsStunningForCattleCalvesLambs,
  ];
  const nullCount = fields.filter(v => v === null).length;

  if (nullCount === 0) return "declared";
  if (nullCount <= 2) return "inferred";
  return "unknown";
}

// ================================================================
// V5: TRUST SCORE DETAIL — 4 semantic blocks for UI explanation
// ================================================================

export interface TrustScoreDetail {
  score: number;
  blocks: {
    ritualValidity: number;        // 0-100 (Bloc A: how many negative practices avoided)
    operationalAssurance: number;  // 0-100 (Bloc B: how many positive practices present)
    productQuality: number;        // 0-100 (Bloc C: tayyib — VSM)
    transparency: number;          // 0-100 (Bloc D: transparency + controversy)
  };
  cap?: number;
  evidenceLevel: EvidenceLevel;
}

/**
 * Compute detailed trust score with 4 semantic blocks.
 *
 * The main score is still the sigmoid + caps composite (what the user sees).
 * The blocks provide a breakdown for the certifier detail screen.
 */
export function computeTrustScoreDetail(
  practices: PracticeInputs,
  weights: WeightSet = NAQIY_EDITORIAL_WEIGHTS,
): TrustScoreDetail {
  const raw = computeRawScore(practices, weights);
  const sigmoid = normalizeScore(raw, weights);
  const { score, cap } = applyCaps(practices, sigmoid);

  // Bloc A: Ritual validity — percentage of negative penalties AVOIDED
  const maxNegative = Math.abs(weights.acceptsMechanicalSlaughter)
    + Math.abs(weights.acceptsElectronarcosis)
    + Math.abs(weights.acceptsPostSlaughterElectrocution)
    + Math.abs(weights.acceptsStunning);
  let negativeTotal = 0;
  if (practices.acceptsMechanicalPoultrySlaughter === true) negativeTotal += Math.abs(weights.acceptsMechanicalSlaughter);
  if (practices.acceptsPoultryElectronarcosis === true) negativeTotal += Math.abs(weights.acceptsElectronarcosis);
  if (practices.acceptsPoultryElectrocutionPostSlaughter === true) negativeTotal += Math.abs(weights.acceptsPostSlaughterElectrocution);
  if (practices.acceptsStunningForCattleCalvesLambs === true) negativeTotal += Math.abs(weights.acceptsStunning);
  const ritualValidity = Math.round((1 - negativeTotal / maxNegative) * 100);

  // Bloc B: Operational assurance — percentage of positive indicators obtained
  const maxPositive = weights.controllersAreEmployees
    + weights.controllersPresentEachProduction
    + weights.hasSalariedSlaughterers;
  let positiveTotal = 0;
  if (practices.controllersAreEmployees === true) positiveTotal += weights.controllersAreEmployees;
  if (practices.controllersPresentEachProduction === true) positiveTotal += weights.controllersPresentEachProduction;
  if (practices.hasSalariedSlaughterers === true) positiveTotal += weights.hasSalariedSlaughterers;
  const operationalAssurance = Math.round((positiveTotal / maxPositive) * 100);

  // Bloc C: Product quality (tayyib) — binary: accepts VSM or not
  const productQuality = practices.acceptsVsm === true ? 0 : 100;

  // Bloc D: Transparency — ratio of transparency bonuses earned (controversy reduces it)
  const maxTransparency = 3 * weights.transparencyBonus;
  let transparencyPoints = 0;
  if (practices.transparencyPublicCharter === true) transparencyPoints += weights.transparencyBonus;
  if (practices.transparencyAuditReports === true) transparencyPoints += weights.transparencyBonus;
  if (practices.transparencyCompanyList === true) transparencyPoints += weights.transparencyBonus;
  const controversyImpact = Math.max(-maxTransparency, practices.controversyPenalty ?? 0);
  const transparency = Math.max(0, Math.round(((transparencyPoints + controversyImpact) / maxTransparency) * 100));

  return {
    score,
    blocks: { ritualValidity, operationalAssurance, productQuality, transparency },
    cap,
    evidenceLevel: inferEvidenceLevel(practices),
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
