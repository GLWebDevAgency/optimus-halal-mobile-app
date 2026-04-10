import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { certifiers } from "./certifiers.js";
import { practiceTuples } from "./practice-tuples.js";
import { certifierEvents } from "./certifiers.js";

export const reportCategoryEnum = pgEnum("report_category", [
  "fraud_labeling",
  "protocol_violation",
  "hygiene_contamination",
  "slaughter_practice_abuse",
  "documentation_missing",
  "transparency_lack",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "insufficient_evidence",
  "duplicate",
]);

export const certifierReports = pgTable(
  "certifier_reports",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    reporterUserId: t.uuid("reporter_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // C4: pseudonymization — reporter_pseudonym_id for audit trail (survives Art.17)
    reporterPseudonymId: t.varchar("reporter_pseudonym_id", { length: 64 }).notNull(),
    certifierId: t.varchar("certifier_id", { length: 100 }).notNull()
      .references(() => certifiers.id),
    practiceTupleId: t.uuid("practice_tuple_id")
      .references(() => practiceTuples.id, { onDelete: "set null" }),
    productBarcode: t.varchar("product_barcode", { length: 50 }),
    category: reportCategoryEnum("category").notNull(),
    title: t.varchar({ length: 255 }).notNull(),
    descriptionFr: t.text("description_fr").notNull(),
    evidenceUrls: t.text("evidence_urls").array().notNull(),
    evidenceTypes: t.text("evidence_types").array().notNull(),
    location: t.text(),
    dateObserved: t.date("date_observed"),
    charterVersion: t.varchar("charter_version", { length: 30 }).notNull(),
    charterSignedAt: t.timestamp("charter_signed_at", { withTimezone: true }).notNull(),
    status: reportStatusEnum("status").default("submitted").notNull(),
    priority: t.smallint().default(3).notNull(),
    assignedAdminId: t.uuid("assigned_admin_id")
      .references(() => users.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: t.text("review_notes"),
    decisionRationale: t.text("decision_rationale"),
    resultingEventId: t.uuid("resulting_event_id")
      .references(() => certifierEvents.id, { onDelete: "set null" }),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("cr_certifier_status_idx").on(table.certifierId, table.status),
    t.index("cr_admin_status_idx").on(table.assignedAdminId, table.status),
    t.index("cr_reporter_idx").on(table.reporterUserId),
  ]
);

export const reportCorroborations = pgTable(
  "report_corroborations",
  {
    reportId: t.uuid("report_id").notNull()
      .references(() => certifierReports.id, { onDelete: "cascade" }),
    userId: t.uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceUrls: t.text("evidence_urls").array().notNull(),
    note: t.text(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.reportId, table.userId] }),
  ]
);

export type CertifierReport = typeof certifierReports.$inferSelect;
export type NewCertifierReport = typeof certifierReports.$inferInsert;
export type ReportCorroboration = typeof reportCorroborations.$inferSelect;
