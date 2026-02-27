/**
 * Scholarly References System — Generic Citation Infrastructure
 *
 * Two-table architecture for sourcing ANY fiqh-based decision in the app:
 *   - scholarly_sources: Master catalog of Islamic scholarly works
 *   - scholarly_citations: Contextual links from specific decisions to source passages
 *
 * The domain + contextKey pattern makes this a GENERIC citation system:
 *   domain = "trust_score"       → contextKey = "weight.hanafi.stunning"
 *   domain = "ingredient_ruling" → contextKey = "ruling.gélatine_porcine.hanafi"
 *   domain = "additive_ruling"   → contextKey = "ruling.E120.shafii"
 *   domain = "general_fiqh"      → contextKey = "principle.tayyib"
 *   domain = "blog"              → contextKey = "article.abattage-mecanique"
 *
 * This avoids N junction tables and scales to any future domain
 * (blog articles, UI info screens, etc.) without schema changes.
 */

import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

// ================================================================
// ENUMS
// ================================================================

export const sourceTypeEnum = pgEnum("scholarly_source_type", [
  "fiqh_manual",     // Classical fiqh treatise (Al-Mughni, Al-Majmu', etc.)
  "hadith_collection", // Hadith compilation (Bukhari, Muslim, Tirmidhi)
  "quran",           // Quranic reference
  "fatwa",           // Historical fatwa from recognized body
  "modern_fatwa",    // Contemporary fatwa (MWL, EFSA, national bodies)
  "academic_paper",  // Peer-reviewed research paper
  "certifier_doc",   // Official certifier documentation (cahier des charges, etc.)
  "institutional",   // Institutional report (MWL, OIC, EFSA, etc.)
]);

export const citationDomainEnum = pgEnum("citation_domain", [
  "trust_score",       // Trust Index weight justifications
  "ingredient_ruling", // Ingredient halal rulings
  "additive_ruling",   // E-number additive rulings
  "general_fiqh",      // General Islamic principles (tayyib, maytah, etc.)
  "blog",              // Blog/article references
  "certifier_event",   // Sources for certifier controversy events
]);

export const scholarlyMadhabEnum = pgEnum("scholarly_madhab", [
  "hanafi",
  "shafii",
  "maliki",
  "hanbali",
  "cross_school",  // Applies across schools (consensus or organizational)
]);

// ================================================================
// SCHOLARLY SOURCES — Master catalog of Islamic scholarly works
// ================================================================

export const scholarlySources = pgTable(
  "scholarly_sources",
  {
    // Slug-based PK for human-readable seeds and queries
    // e.g., "al-mughni", "radd-al-muhtar", "al-majmu", "sahih-bukhari"
    id: t.varchar({ length: 100 }).primaryKey(),

    // Trilingual titles
    titleAr: t.varchar("title_ar", { length: 500 }).notNull(), // الموسوعة الفقهية
    titleFr: t.varchar("title_fr", { length: 500 }).notNull(), // transliteration + french
    titleEn: t.varchar("title_en", { length: 500 }),           // English (optional)

    // Author info
    authorAr: t.varchar("author_ar", { length: 255 }),  // ابن قدامة المقدسي
    authorFr: t.varchar("author_fr", { length: 255 }).notNull(), // Ibn Qudama al-Maqdisi

    // Classification
    sourceType: sourceTypeEnum("source_type").notNull(),
    primaryMadhab: scholarlyMadhabEnum("primary_madhab"),  // null = cross-school
    centuryHijri: t.integer("century_hijri"),     // null for modern sources
    yearPublished: t.integer("year_published"),    // Gregorian year (for modern sources)

    // Optional external links
    externalUrl: t.text("external_url"),  // shamela.ws, kalamullah.com, etc.
    isbn: t.varchar({ length: 20 }),

    // Short description of the work
    descriptionFr: t.text("description_fr"),
    descriptionAr: t.text("description_ar"),

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
    t.index("scholarly_sources_type_idx").on(table.sourceType),
    t.index("scholarly_sources_madhab_idx").on(table.primaryMadhab),
  ]
);

export type ScholarlySource = typeof scholarlySources.$inferSelect;
export type NewScholarlySource = typeof scholarlySources.$inferInsert;

// ================================================================
// SCHOLARLY CITATIONS — Contextual references to source passages
// ================================================================

export const scholarlyCitations = pgTable(
  "scholarly_citations",
  {
    id: t.uuid().defaultRandom().primaryKey(),

    // FK to the source work
    sourceId: t.varchar("source_id", { length: 100 }).notNull()
      .references(() => scholarlySources.id, { onDelete: "cascade" }),

    // Generic polymorphic context — domain + contextKey
    // Examples:
    //   domain = "trust_score",       contextKey = "weight.hanafi.stunning"
    //   domain = "trust_score",       contextKey = "weight.universal.mechanical_slaughter"
    //   domain = "ingredient_ruling", contextKey = "ruling.gélatine_porcine.default"
    //   domain = "general_fiqh",      contextKey = "principle.hayah_mustaqqirrah"
    domain: citationDomainEnum("domain").notNull(),
    contextKey: t.varchar("context_key", { length: 255 }).notNull(),

    // Which school this citation applies to (null = universal/organizational)
    madhab: scholarlyMadhabEnum("madhab"),

    // Passage location within the source
    volume: t.varchar({ length: 20 }),     // "6", "XIII", "3/2"
    page: t.varchar({ length: 50 }),       // "296", "89-91", "§1254"
    chapter: t.varchar({ length: 255 }),   // Chapter/bab name

    // The actual passage content (trilingual)
    passageAr: t.text("passage_ar"),       // Original Arabic text
    passageFr: t.text("passage_fr"),       // French translation/summary
    passageEn: t.text("passage_en"),       // English translation (optional)

    // Why this source is relevant to this context
    relevanceFr: t.text("relevance_fr").notNull(), // "Ce passage justifie le poids de -25 pour..."
    relevanceAr: t.text("relevance_ar"),

    // Ordering — multiple citations per context are displayed in this order
    displayOrder: t.integer("display_order").default(0).notNull(),

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
    // Primary lookup: "give me all citations for this context"
    t.index("scholarly_citations_domain_key_idx").on(table.domain, table.contextKey),
    // FK lookup
    t.index("scholarly_citations_source_idx").on(table.sourceId),
    // Per-madhab queries
    t.index("scholarly_citations_madhab_idx").on(table.madhab),
    // Unique: one source per context+madhab combination (prevents duplicate entries)
    t.uniqueIndex("scholarly_citations_unique_ctx_idx").on(
      table.sourceId,
      table.domain,
      table.contextKey,
      table.madhab,
    ),
  ]
);

export type ScholarlyCitation = typeof scholarlyCitations.$inferSelect;
export type NewScholarlyCitation = typeof scholarlyCitations.$inferInsert;
