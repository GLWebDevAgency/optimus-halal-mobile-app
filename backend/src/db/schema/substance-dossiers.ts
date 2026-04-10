import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceDossiers = pgTable(
  "substance_dossiers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    version: t.varchar({ length: 20 }).notNull(),
    schemaVersion: t.varchar("schema_version", { length: 30 }).notNull(),
    dossierJson: t.jsonb("dossier_json").notNull(),
    contentHash: t.varchar("content_hash", { length: 64 }).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),
    verificationPasses: t.smallint("verification_passes"),
    fatwaCount: t.smallint("fatwa_count"),
    isActive: t.boolean("is_active").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.uniqueIndex("substance_dossiers_substance_version_idx")
      .on(table.substanceId, table.version),
    t.index("substance_dossiers_json_gin_idx").using("gin", table.dossierJson),
  ]
);

export type SubstanceDossier = typeof substanceDossiers.$inferSelect;
export type NewSubstanceDossier = typeof substanceDossiers.$inferInsert;
