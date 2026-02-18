import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { halalStatusEnum } from "./products.js";
import { madhabEnum } from "./users.js";

export const additiveCategoryEnum = pgEnum("additive_category", [
  "colorant",
  "preservative",
  "antioxidant",
  "emulsifier",
  "stabilizer",
  "thickener",
  "flavor_enhancer",
  "sweetener",
  "acid",
  "anti_caking",
  "glazing_agent",
  "humectant",
  "raising_agent",
  "sequestrant",
  "other",
]);

export const additiveOriginEnum = pgEnum("additive_origin", [
  "plant",
  "animal",
  "synthetic",
  "mineral",
  "insect",
  "mixed",
]);

export const toxicityLevelEnum = pgEnum("toxicity_level", [
  "safe",
  "low_concern",
  "moderate_concern",
  "high_concern",
]);

export const efsaStatusEnum = pgEnum("efsa_status", [
  "approved",
  "under_review",
  "restricted",
  "banned",
]);

export const additives = pgTable("additives", {
  code: t.varchar({ length: 10 }).primaryKey(),
  nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
  nameEn: t.varchar("name_en", { length: 255 }),
  nameAr: t.varchar("name_ar", { length: 255 }),
  category: additiveCategoryEnum().notNull(),
  halalStatusDefault: halalStatusEnum("halal_status_default").notNull(),
  halalExplanationFr: t.text("halal_explanation_fr"),
  halalExplanationEn: t.text("halal_explanation_en"),
  origin: additiveOriginEnum().notNull(),
  originDetails: t.text("origin_details"),
  toxicityLevel: toxicityLevelEnum("toxicity_level")
    .default("safe")
    .notNull(),
  adiMgPerKg: t.doublePrecision("adi_mg_per_kg"),
  riskPregnant: t.boolean("risk_pregnant").default(false).notNull(),
  riskChildren: t.boolean("risk_children").default(false).notNull(),
  riskAllergic: t.boolean("risk_allergic").default(false).notNull(),
  healthEffectsFr: t.text("health_effects_fr"),
  healthEffectsEn: t.text("health_effects_en"),
  efsaStatus: efsaStatusEnum("efsa_status").default("approved").notNull(),
  bannedCountries: t.text("banned_countries").array(),
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
});

export type Additive = typeof additives.$inferSelect;
export type NewAdditive = typeof additives.$inferInsert;

export const additiveMadhabRulings = pgTable(
  "additive_madhab_rulings",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    additiveCode: t
      .varchar("additive_code", { length: 10 })
      .references(() => additives.code, { onDelete: "cascade" })
      .notNull(),
    madhab: madhabEnum().notNull(),
    ruling: halalStatusEnum("ruling").notNull(),
    explanationFr: t.text("explanation_fr").notNull(),
    explanationEn: t.text("explanation_en"),
    scholarlyReference: t.text("scholarly_reference"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("madhab_ruling_unique_idx").on(
      table.additiveCode,
      table.madhab
    ),
  ]
);

export type AdditiveMadhabRuling = typeof additiveMadhabRulings.$inferSelect;
export type NewAdditiveMadhabRuling =
  typeof additiveMadhabRulings.$inferInsert;
