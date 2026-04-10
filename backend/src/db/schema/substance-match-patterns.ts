import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceMatchPatterns = pgTable(
  "substance_match_patterns",
  {
    id: t.bigserial({ mode: "number" }).primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    patternType: t.varchar("pattern_type", { length: 30 }).notNull(),
    patternValue: t.text("pattern_value").notNull(),
    lang: t.varchar({ length: 5 }),
    priority: t.smallint().default(50).notNull(),
    confidence: t.real().default(1.0).notNull(),
    source: t.varchar({ length: 30 }).default("dossier_compiler").notNull(),
  },
  (table) => [
    t.index("smp_type_value_idx").on(table.patternType, table.patternValue),
    t.index("smp_substance_idx").on(table.substanceId),
  ]
);

export type SubstanceMatchPattern = typeof substanceMatchPatterns.$inferSelect;
export type NewSubstanceMatchPattern = typeof substanceMatchPatterns.$inferInsert;
