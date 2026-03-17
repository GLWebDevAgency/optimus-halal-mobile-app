/**
 * Referrals Schema — Naqiy Referral Program
 *
 * Each user gets a unique 6-char referral code at registration.
 * When a new user signs up with a referral code, both parties benefit:
 * - Referrer: +30 days premium extension
 * - Referee: standard Naqiy+ benefits
 */

import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const referrals = pgTable(
  "referrals",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    referrerId: t
      .uuid("referrer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    refereeId: t
      .uuid("referee_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    rewardDays: t.integer("reward_days").default(30).notNull(),
    rewardApplied: t.boolean("reward_applied").default(false).notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("referrals_referee_idx").on(table.refereeId), // A user can only be referred once
    t.index("referrals_referrer_idx").on(table.referrerId),
  ]
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
