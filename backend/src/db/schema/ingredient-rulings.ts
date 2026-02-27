/**
 * Ingredient Rulings Table
 *
 * Context-aware halal rulings for individual ingredients and compounds.
 * Replaces naive HARAM_INGREDIENTS / DOUBTFUL_INGREDIENTS string matching
 * with scholarly-sourced, per-madhab rulings.
 *
 * Match priority system (higher = checked first):
 *   - Safe compounds (vinaigre de vin) at priority 100+ override keywords
 *   - Haram compounds (gélatine porcine) at priority 50-99
 *   - Individual keywords (vin, porc) at priority 1-49
 *
 * Match types:
 *   - "exact": full ingredient string match
 *   - "contains": substring match (like current behavior)
 *   - "word_boundary": \b regex match (prevents "vin" in "vinaigre")
 *   - "regex": full regex pattern
 */

import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { halalStatusEnum } from "./products.js";

export const matchTypeEnum = pgEnum("match_type", [
  "exact",
  "contains",
  "word_boundary",
  "regex",
]);

export const ingredientRulings = pgTable(
  "ingredient_rulings",
  {
    id: t.uuid().defaultRandom().primaryKey(),

    // Pattern matching
    compoundPattern: t.text("compound_pattern").notNull(),
    matchType: matchTypeEnum("match_type").notNull(),
    priority: t.integer().default(0).notNull(),

    // Default ruling (worst-case across madhabs)
    rulingDefault: halalStatusEnum("ruling_default").notNull(),

    // Per-madhab rulings (null = follows default)
    rulingHanafi: halalStatusEnum("ruling_hanafi"),
    rulingShafii: halalStatusEnum("ruling_shafii"),
    rulingMaliki: halalStatusEnum("ruling_maliki"),
    rulingHanbali: halalStatusEnum("ruling_hanbali"),

    // Confidence (0.0 - 1.0)
    confidence: t.doublePrecision().notNull(),

    // Explanations (trilingual)
    explanationFr: t.text("explanation_fr").notNull(),
    explanationEn: t.text("explanation_en"),
    explanationAr: t.text("explanation_ar"),

    // Scholarly references
    scholarlyReference: t.text("scholarly_reference"),
    fatwaSourceUrl: t.text("fatwa_source_url"),
    fatwaSourceName: t.text("fatwa_source_name"),

    // Override system: this pattern overrides another keyword
    // e.g., "vinaigre de vin" overrides "vin"
    overridesKeyword: t.text("overrides_keyword"),

    // Category for UI grouping
    category: t.varchar({ length: 50 }),

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
    t.index("ingredient_rulings_priority_idx").on(table.priority),
    t.index("ingredient_rulings_category_idx").on(table.category),
    t.index("ingredient_rulings_active_idx").on(table.isActive),
  ]
);

export type IngredientRuling = typeof ingredientRulings.$inferSelect;
export type NewIngredientRuling = typeof ingredientRulings.$inferInsert;
