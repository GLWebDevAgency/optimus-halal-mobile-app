import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practices } from "./practices.js";

export const practiceDossiers = pgTable(
  "practice_dossiers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    practiceId: t.varchar("practice_id", { length: 50 }).notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    version: t.varchar({ length: 20 }).notNull(),
    schemaVersion: t.varchar("schema_version", { length: 30 }).notNull(),
    dossierJson: t.jsonb("dossier_json").notNull(),
    contentHash: t.varchar("content_hash", { length: 64 }).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),
    isActive: t.boolean("is_active").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.uniqueIndex("practice_dossiers_practice_version_idx")
      .on(table.practiceId, table.version),
  ]
);

export type PracticeDossier = typeof practiceDossiers.$inferSelect;
export type NewPracticeDossier = typeof practiceDossiers.$inferInsert;
