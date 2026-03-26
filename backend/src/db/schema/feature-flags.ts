import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    key: t.varchar({ length: 100 }).notNull().unique(),
    label: t.varchar({ length: 200 }).notNull(),
    description: t.text(),
    flagType: t.varchar("flag_type", { length: 20 }).notNull().default("boolean"),
    enabled: t.boolean().notNull().default(false),
    defaultValue: t.jsonb("default_value").notNull().default(false),
    rolloutPercentage: t.integer("rollout_percentage").notNull().default(100),
    variants: t.jsonb(),
    rules: t.jsonb().notNull().default([]),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("idx_feature_flags_enabled").on(table.enabled),
  ]
);

export const flagUserOverrides = pgTable(
  "flag_user_overrides",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    flagId: t
      .uuid("flag_id")
      .references(() => featureFlags.id, { onDelete: "cascade" })
      .notNull(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    value: t.jsonb().notNull(),
    reason: t.varchar({ length: 200 }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("flag_overrides_flag_user_idx").on(table.flagId, table.userId),
    t.index("idx_flag_overrides_user").on(table.userId),
    t.index("idx_flag_overrides_flag").on(table.flagId),
  ]
);

export const flagAuditHistory = pgTable(
  "flag_audit_history",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    flagId: t
      .uuid("flag_id")
      .references(() => featureFlags.id, { onDelete: "cascade" })
      .notNull(),
    action: t.varchar({ length: 32 }).notNull(),
    actorId: t.uuid("actor_id").notNull(),
    actorType: t.varchar("actor_type", { length: 16 }).notNull().default("admin"),
    changes: t.jsonb(),
    metadata: t.jsonb(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("idx_flag_audit_flag_id").on(table.flagId),
    t.index("idx_flag_audit_created_at").on(table.createdAt),
    t.index("idx_flag_audit_actor").on(table.actorId),
  ]
);

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type FlagUserOverride = typeof flagUserOverrides.$inferSelect;
export type NewFlagUserOverride = typeof flagUserOverrides.$inferInsert;
export type FlagAuditEntry = typeof flagAuditHistory.$inferSelect;
export type NewFlagAuditEntry = typeof flagAuditHistory.$inferInsert;
