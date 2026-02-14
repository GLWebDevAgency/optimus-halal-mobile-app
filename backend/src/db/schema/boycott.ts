import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const boycottLevelEnum = pgEnum("boycott_level", [
  "official_bds",
  "grassroots",
  "pressure",
  "community",
]);

export const boycottTargets = pgTable(
  "boycott_targets",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    companyName: t.varchar("company_name", { length: 255 }).notNull(),
    brands: t.text().array().notNull(),
    parentCompany: t.varchar("parent_company", { length: 255 }),
    sector: t.varchar({ length: 100 }),
    logoUrl: t.text("logo_url"),

    boycottLevel: boycottLevelEnum("boycott_level").notNull(),
    severity: t.varchar({ length: 20 }).default("warning").notNull(),

    reason: t.text().notNull(),
    reasonSummary: t.varchar("reason_summary", { length: 500 }),
    sourceUrl: t.text("source_url"),
    sourceName: t.varchar("source_name", { length: 100 }),

    barcodePrefix: t.text("barcode_prefix").array(),
    offBrandTags: t.text("off_brand_tags").array(),

    isActive: t.boolean("is_active").default(true).notNull(),
    addedAt: t
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    verifiedBy: t.varchar("verified_by", { length: 100 }),
  },
  (table) => [
    t.index("boycott_targets_level_idx").on(table.boycottLevel),
    t.index("boycott_targets_active_idx").on(table.isActive),
  ]
);

export type BoycottTarget = typeof boycottTargets.$inferSelect;
export type NewBoycottTarget = typeof boycottTargets.$inferInsert;
