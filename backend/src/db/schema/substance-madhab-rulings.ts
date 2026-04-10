import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceMadhabRulings = pgTable(
  "substance_madhab_rulings",
  {
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    madhab: t.varchar({ length: 10 }).notNull(),
    ruling: t.varchar({ length: 20 }).notNull(),
    contemporarySplit: t.boolean("contemporary_split").default(false).notNull(),
    classicalSources: t.text("classical_sources").array().default([]),
    contemporarySources: t.text("contemporary_sources").array().default([]),
  },
  (table) => [
    t.primaryKey({ columns: [table.substanceId, table.madhab] }),
  ]
);

export type SubstanceMadhabRuling = typeof substanceMadhabRulings.$inferSelect;
export type NewSubstanceMadhabRuling = typeof substanceMadhabRulings.$inferInsert;
