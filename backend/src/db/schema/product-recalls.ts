import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { admins } from "./admins.js";

export const productRecalls = pgTable(
  "product_recalls",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    /** RappelConso reference number (dedup key) */
    sourceReference: t
      .varchar("source_reference", { length: 100 })
      .unique()
      .notNull(),
    /** GTIN / EAN barcode — nullable because ~1% of recalls lack a barcode */
    gtin: t.varchar({ length: 14 }),
    brandName: t.varchar("brand_name", { length: 255 }),
    productName: t.varchar("product_name", { length: 500 }),
    subCategory: t.varchar("sub_category", { length: 255 }),
    /** Why this product was recalled */
    recallReason: t.text("recall_reason").notNull(),
    /** Health risks for the consumer */
    healthRisks: t.text("health_risks"),
    /** What the consumer should do */
    consumerActions: t.text("consumer_actions"),
    /** Health precautions (e.g., "pregnant women should consult a doctor") */
    healthPrecautions: t.text("health_precautions"),
    /** Affected retailers */
    distributors: t.text(),
    /** Geographic scope of the recall */
    geoScope: t.varchar("geo_scope", { length: 500 }),
    /** Product image from RappelConso */
    imageUrl: t.text("image_url"),
    /** Official recall poster PDF */
    pdfUrl: t.text("pdf_url"),
    /** Source URL on rappel.conso.gouv.fr */
    sourceUrl: t.text("source_url"),
    /** Moderation status: pending → approved | rejected */
    status: t
      .varchar({ length: 20 })
      .default("pending")
      .notNull(),
    /** Admin who reviewed (null if auto-approved or pending) */
    reviewedBy: t.uuid("reviewed_by").references(() => admins.id),
    /** When the review happened */
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    /** True if approved by auto-approval rule (no manual review) */
    autoApproved: t.boolean("auto_approved").default(false).notNull(),
    /** When the recall was published by RappelConso */
    publishedAt: t
      .timestamp("published_at", { withTimezone: true })
      .notNull(),
    /** When the recall procedure ends (null = still active) */
    recallEndDate: t.timestamp("recall_end_date", { withTimezone: true }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("product_recalls_gtin_idx").on(table.gtin),
    t.index("product_recalls_published_at_idx").on(table.publishedAt),
    t.index("product_recalls_status_idx").on(table.status),
  ],
);

export type ProductRecall = typeof productRecalls.$inferSelect;
export type NewProductRecall = typeof productRecalls.$inferInsert;
