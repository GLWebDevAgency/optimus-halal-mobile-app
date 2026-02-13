import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const pointActionEnum = pgEnum("point_action", [
  "scan",
  "review",
  "report",
  "referral",
  "streak_bonus",
  "daily_login",
  "achievement",
  "redemption",
]);

export const rewardStatusEnum = pgEnum("reward_status", [
  "available",
  "claimed",
  "expired",
  "used",
]);

export const pointTransactions = pgTable(
  "point_transactions",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    action: pointActionEnum().notNull(),
    points: t.integer().notNull(), // positive = earned, negative = spent
    description: t.text(),
    referenceId: t.uuid("reference_id"), // scanId, reviewId, etc.
    referenceType: t.varchar("reference_type", { length: 50 }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("points_user_id_idx").on(table.userId),
    t.index("points_action_idx").on(table.action),
    t.index("points_created_at_idx").on(table.createdAt),
  ]
);

export const rewards = pgTable("rewards", {
  id: t.uuid().defaultRandom().primaryKey(),
  name: t.varchar({ length: 255 }).notNull(),
  nameFr: t.varchar("name_fr", { length: 255 }),
  nameAr: t.varchar("name_ar", { length: 255 }),
  description: t.text(),
  descriptionFr: t.text("description_fr"),
  imageUrl: t.text("image_url"),
  pointsCost: t.integer("points_cost").notNull(),
  category: t.varchar({ length: 50 }),
  partnerId: t.uuid("partner_id"),
  partnerName: t.varchar("partner_name", { length: 255 }),
  totalQuantity: t.integer("total_quantity"),
  remainingQuantity: t.integer("remaining_quantity"),
  isActive: t.boolean("is_active").default(true).notNull(),
  expiresAt: t.timestamp("expires_at", { withTimezone: true }),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userRewards = pgTable(
  "user_rewards",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    rewardId: t
      .uuid("reward_id")
      .references(() => rewards.id, { onDelete: "cascade" })
      .notNull(),
    status: rewardStatusEnum().default("claimed").notNull(),
    claimedAt: t
      .timestamp("claimed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: t.timestamp("used_at", { withTimezone: true }),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    redemptionCode: t.varchar("redemption_code", { length: 50 }),
  },
  (table) => [
    t.index("user_rewards_user_id_idx").on(table.userId),
    t.index("user_rewards_status_idx").on(table.status),
  ]
);

export const achievements = pgTable("achievements", {
  id: t.varchar({ length: 50 }).primaryKey(),
  name: t.varchar({ length: 100 }).notNull(),
  nameFr: t.varchar("name_fr", { length: 100 }),
  nameAr: t.varchar("name_ar", { length: 100 }),
  description: t.text(),
  descriptionFr: t.text("description_fr"),
  icon: t.varchar({ length: 50 }),
  pointsReward: t.integer("points_reward").default(0).notNull(),
  requirement: t.jsonb(), // { type: "scans", count: 100 }
  sortOrder: t.integer("sort_order").default(0),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    achievementId: t
      .varchar("achievement_id", { length: 50 })
      .references(() => achievements.id)
      .notNull(),
    unlockedAt: t
      .timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("user_achievements_user_achievement_idx").on(
      table.userId,
      table.achievementId
    ),
  ]
);

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
