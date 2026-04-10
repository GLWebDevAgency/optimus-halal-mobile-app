import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { products } from "./products.js";
import { scans } from "./scans.js";
import { users } from "./users.js";

export const evaluationStatusEnum = pgEnum("evaluation_status", [
  "ok",
  "degraded",
  "failed",
]);

export const halalEvaluations = pgTable(
  "halal_evaluations",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    scanId: t.uuid("scan_id").references(() => scans.id, { onDelete: "set null" }),
    productId: t.uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    userId: t.uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    engineVersion: t.varchar("engine_version", { length: 30 }).notNull(),
    userMadhab: t.varchar("user_madhab", { length: 10 }),
    userStrictness: t.varchar("user_strictness", { length: 15 }),
    userTier: t.varchar("user_tier", { length: 10 }),
    track: t.varchar({ length: 15 }).notNull(),  // "certified" | "analyzed"
    modulesFired: t.text("modules_fired").array().default([]),
    finalScore: t.smallint("final_score"),
    finalVerdict: t.varchar("final_verdict", { length: 30 }),
    // H15: first-class status + degradation reason
    status: evaluationStatusEnum("status").default("ok").notNull(),
    degradationReason: t.varchar("degradation_reason", { length: 100 }),
    trace: t.jsonb().notNull(),
    durationMs: t.integer("duration_ms"),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("he_product_idx").on(table.productId),
    t.index("he_created_idx").on(table.createdAt),
    t.index("he_status_idx").on(table.status),
    t.index("he_user_idx").on(table.userId),
  ]
);

export type HalalEvaluation = typeof halalEvaluations.$inferSelect;
export type NewHalalEvaluation = typeof halalEvaluations.$inferInsert;
