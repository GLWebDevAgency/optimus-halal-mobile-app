import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practiceFamilies } from "./practice-families.js";
import { practiceDossiers } from "./practice-dossiers.js";

export const practiceTuples = pgTable(
  "practice_tuples",
  {
    id: t.uuid().defaultRandom().primaryKey(),       // H11: UUID PK for history stability
    slug: t.varchar({ length: 80 }).unique().notNull(), // human-readable ("CATTLE_NOSTUN_MANUAL")
    familyId: t.varchar("family_id", { length: 50 }).notNull()
      .references(() => practiceFamilies.id),
    dimensions: t.jsonb().notNull(),
    verdictHanafi: t.smallint("verdict_hanafi").notNull(),
    verdictMaliki: t.smallint("verdict_maliki").notNull(),
    verdictShafii: t.smallint("verdict_shafii").notNull(),
    verdictHanbali: t.smallint("verdict_hanbali").notNull(),
    requiredEvidence: t.text("required_evidence").array().default([]),
    dossierId: t.uuid("dossier_id")
      .references(() => practiceDossiers.id),
    dossierSectionRef: t.varchar("dossier_section_ref", { length: 200 }).notNull(),
    fatwaRefs: t.text("fatwa_refs").array().default([]),
    typicalMortalityPctMin: t.real("typical_mortality_pct_min"),
    typicalMortalityPctMax: t.real("typical_mortality_pct_max"),
    notesFr: t.text("notes_fr"),
    notesEn: t.text("notes_en"),
    notesAr: t.text("notes_ar"),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("pt_family_idx").on(table.familyId),
    t.index("pt_dims_gin_idx").using("gin", table.dimensions),
  ]
);

export type PracticeTuple = typeof practiceTuples.$inferSelect;
export type NewPracticeTuple = typeof practiceTuples.$inferInsert;
