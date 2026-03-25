import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const waitlistLeads = pgTable(
  "waitlist_leads",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    email: t.varchar({ length: 320 }).notNull(),
    source: t.varchar({ length: 50 }).default("landing").notNull(),
    locale: t.varchar({ length: 5 }).default("fr"),
    utmSource: t.varchar("utm_source", { length: 100 }),
    utmMedium: t.varchar("utm_medium", { length: 100 }),
    utmCampaign: t.varchar("utm_campaign", { length: 100 }),
    consentAt: t
      .timestamp("consent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    t.uniqueIndex("waitlist_leads_email_idx").on(table.email),
    t.index("waitlist_leads_source_idx").on(table.source),
    t.index("waitlist_leads_created_at_idx").on(table.createdAt),
  ]
);

export type WaitlistLead = typeof waitlistLeads.$inferSelect;
export type NewWaitlistLead = typeof waitlistLeads.$inferInsert;
