import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { products } from "./products.js";

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "in_review",
  "completed",
  "rejected",
]);

export const scans = pgTable(
  "scans",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: t.uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    barcode: t.varchar({ length: 50 }).notNull(),
    halalStatus: t.varchar("halal_status", { length: 20 }),
    confidenceScore: t.doublePrecision("confidence_score"),
    latitude: t.doublePrecision(),
    longitude: t.doublePrecision(),
    scannedAt: t
      .timestamp("scanned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("scans_user_id_idx").on(table.userId),
    t.index("scans_barcode_idx").on(table.barcode),
    t.index("scans_scanned_at_idx").on(table.scannedAt),
  ]
);

export const analysisRequests = pgTable("analysis_requests", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  barcode: t.varchar({ length: 50 }).notNull(),
  productName: t.varchar("product_name", { length: 255 }),
  brandName: t.varchar("brand_name", { length: 255 }),
  photoUrls: t.text("photo_urls").array(),
  notes: t.text(),
  status: analysisStatusEnum().default("pending").notNull(),
  adminNotes: t.text("admin_notes"),
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

export type Scan = typeof scans.$inferSelect;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
