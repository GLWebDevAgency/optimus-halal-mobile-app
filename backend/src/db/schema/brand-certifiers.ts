/**
 * Brand-Certifier Mapping Table
 *
 * Maps known halal brands to their certifying bodies.
 * Used as a fallback (Tier 1c) when OpenFoodFacts provides a generic
 * "en:halal" label but not the specific certifier tag.
 *
 * Example: Samia → SFCVH (Mosquée de Paris). OFF only has "en:halal"
 * but we know from the brand's website that SFCVH is the certifier.
 *
 * Design principles:
 *   - Many-to-many: a brand can have multiple certifiers (by product line, country)
 *   - Temporal validity: effectiveFrom/Until tracks certifier changes over time
 *   - Provenance: source + sourceUrl prove where the mapping came from
 *   - Verification: confirmed/probable/unverified status levels
 *   - Idempotent seeding via UNIQUE constraint + ON CONFLICT DO UPDATE
 */

import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { certifiers } from "./certifiers.js";

export const brandCertifiers = pgTable(
  "brand_certifiers",
  {
    id: t.uuid().primaryKey().defaultRandom(),

    // Brand pattern — lowercase normalized (e.g., "samia", "isla délice")
    // Matched against OFF brands field (comma-split, trimmed, lowercased)
    brandPattern: t.varchar("brand_pattern", { length: 255 }).notNull(),

    // FK to certifiers table — the certifier that certifies this brand
    certifierId: t
      .varchar("certifier_id", { length: 100 })
      .notNull()
      .references(() => certifiers.id, { onDelete: "cascade" }),

    // Geographic scope — ISO 3166-1 alpha-2 (FR, BE, DE...)
    // A brand may use different certifiers in different countries
    countryCode: t.varchar("country_code", { length: 5 }).default("FR").notNull(),

    // Product scope — "_all" = all products, "meat", "confectionery", etc.
    // Some brands certify only specific product lines.
    // Sentinel "_all" instead of NULL to allow clean unique index.
    productScope: t.varchar("product_scope", { length: 100 }).default("_all").notNull(),

    // ── Provenance ──────────────────────────────────────────
    // Where this mapping came from — traceable and auditable

    // Source type: manual_research | brand_website | packaging | community | api
    source: t.varchar({ length: 50 }).notNull(),

    // URL proof (e.g., brand website page showing certification)
    sourceUrl: t.text("source_url"),

    // Verification level: confirmed | probable | unverified
    verificationStatus: t
      .varchar("verification_status", { length: 20 })
      .default("confirmed")
      .notNull(),

    // Confidence score 0.0–1.0 (1.0 = verified from official source)
    confidence: t.real().default(1.0).notNull(),

    // ── Temporal validity ───────────────────────────────────
    // Tracks when this certification relationship is/was active

    effectiveFrom: t.date("effective_from"), // NULL = unknown start
    effectiveUntil: t.date("effective_until"), // NULL = still active

    // Free text notes
    notes: t.text(),

    // Active flag (soft delete)
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
    // Fast lookup by brand pattern
    t.index("brand_certifiers_pattern_idx").on(table.brandPattern),
    // FK index
    t.index("brand_certifiers_certifier_idx").on(table.certifierId),
    // Active filter
    t.index("brand_certifiers_active_idx").on(table.isActive),
    // Prevent duplicate mappings (same brand + certifier + country + scope)
    t.uniqueIndex("brand_certifiers_unique_idx").on(
      table.brandPattern,
      table.certifierId,
      table.countryCode,
      table.productScope,
    ),
  ],
);

export type BrandCertifier = typeof brandCertifiers.$inferSelect;
export type NewBrandCertifier = typeof brandCertifiers.$inferInsert;
