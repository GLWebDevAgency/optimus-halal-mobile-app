import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceScenarios = pgTable(
  "substance_scenarios",
  {
    id: t.bigserial({ mode: "number" }).primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    scenarioKey: t.varchar("scenario_key", { length: 80 }).notNull(),
    matchConditions: t.jsonb("match_conditions").notNull(),
    specificity: t.smallint().notNull(),
    score: t.smallint().notNull(),
    verdict: t.varchar({ length: 30 }).notNull(),
    rationaleFr: t.text("rationale_fr").notNull(),
    rationaleEn: t.text("rationale_en"),
    rationaleAr: t.text("rationale_ar"),
    dossierSectionRef: t.varchar("dossier_section_ref", { length: 100 }),
  },
  (table) => [
    t.uniqueIndex("ss_substance_scenario_idx")
      .on(table.substanceId, table.scenarioKey),
    t.index("ss_substance_specificity_idx")
      .on(table.substanceId, table.specificity),
  ]
);

export type SubstanceScenario = typeof substanceScenarios.$inferSelect;
export type NewSubstanceScenario = typeof substanceScenarios.$inferInsert;
