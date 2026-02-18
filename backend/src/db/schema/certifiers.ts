/**
 * Halal Certifier Reference Table
 *
 * Source: certification-list.json — evaluation of halal certifiers in France
 * Trust score computed from 7 boolean practice indicators (0–100).
 *
 * Scoring algorithm:
 *   POSITIVE (higher = more rigorous):
 *     controllersAreEmployees     → +15  (independent, salaried controllers)
 *     controllersPresentEachProd  → +15  (present at every production run)
 *     hasSalariedSlaughterers     → +10  (slaughterers employed by certifier)
 *     halalAssessment             → +30  (passes overall halal assessment)
 *
 *   NEGATIVE (accepting these = less strict):
 *     acceptsMechanicalSlaughter  → −15  (mechanical poultry slaughter)
 *     acceptsElectronarcosis      → −15  (electronarcosis before slaughter)
 *     acceptsStunning             → −20  (stunning for cattle/calves/lambs)
 *
 *   Range: −50 to +70, normalized to 0–100
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
    trustScore: t.integer("trust_score").default(0).notNull(), // 0-100
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

/**
 * Compute trust score from practice indicators.
 * Returns 0-100 integer.
 */
export function computeTrustScore(practices: {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
  "halal-assessment": boolean | null;
}): number {
  let raw = 0;

  // Positive indicators
  if (practices.controllersAreEmployees === true) raw += 15;
  if (practices.controllersPresentEachProduction === true) raw += 15;
  if (practices.hasSalariedSlaughterers === true) raw += 10;
  if (practices["halal-assessment"] === true) raw += 30;

  // Negative indicators (accepting = penalty)
  if (practices.acceptsMechanicalPoultrySlaughter === true) raw -= 15;
  if (practices.acceptsPoultryElectronarcosis === true) raw -= 15;
  if (practices.acceptsStunningForCattleCalvesLambs === true) raw -= 20;

  // Normalize: raw range is [-50, +70] → map to [0, 100]
  const MIN_RAW = -50;
  const MAX_RAW = 70;
  const normalized = Math.round(((raw - MIN_RAW) / (MAX_RAW - MIN_RAW)) * 100);

  return Math.max(0, Math.min(100, normalized));
}
