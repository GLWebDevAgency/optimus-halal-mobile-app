import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { certifiers } from "./certifiers.js";
import { practiceTuples } from "./practice-tuples.js";
import { users } from "./users.js";

export const certifierTupleAcceptance = pgTable(
  "certifier_tuple_acceptance",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    certifierId: t.varchar("certifier_id", { length: 100 }).notNull()
      .references(() => certifiers.id, { onDelete: "cascade" }),
    practiceTupleId: t.uuid("practice_tuple_id").notNull()
      .references(() => practiceTuples.id, { onDelete: "cascade" }),
    stance: t.varchar({ length: 20 }).notNull(),      // accepts|rejects|unknown|conditional
    evidenceLevel: t.varchar("evidence_level", { length: 30 }).notNull(),
    evidenceDetails: t.jsonb("evidence_details"),
    since: t.date(),
    lastVerifiedAt: t.timestamp("last_verified_at", { withTimezone: true }),
    verifiedByUserId: t.uuid("verified_by_user_id")
      .references(() => users.id, { onDelete: "set null" }),
    // C3: SCD type 2 for temporal dimension — enables audit replay
    validFrom: t.timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    validTo: t.timestamp("valid_to", { withTimezone: true }),  // null = current
    isCurrent: t.boolean("is_current").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Current acceptance lookup: certifier × tuple × is_current
    t.index("cta_certifier_current_idx")
      .on(table.certifierId, table.isCurrent)
      .where(sql`is_current = true`),
    t.index("cta_tuple_idx").on(table.practiceTupleId),
    // Unique: one current acceptance per certifier × tuple
    t.uniqueIndex("cta_certifier_tuple_current_idx")
      .on(table.certifierId, table.practiceTupleId)
      .where(sql`is_current = true`),
  ]
);

export type CertifierTupleAcceptance = typeof certifierTupleAcceptance.$inferSelect;
export type NewCertifierTupleAcceptance = typeof certifierTupleAcceptance.$inferInsert;
