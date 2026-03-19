import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const adminRoleEnum = pgEnum("admin_role", [
  "admin",
  "super_admin",
]);

export const admins = pgTable(
  "admins",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    role: adminRoleEnum().default("admin").notNull(),
    grantedBy: t.uuid("granted_by").references(() => users.id),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [t.index("admins_user_id_idx").on(table.userId)]
);

export type Admin = typeof admins.$inferSelect;
