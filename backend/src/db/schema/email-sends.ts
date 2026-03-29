import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const emailSendStatusEnum = pgEnum("email_send_status", [
  "sent",
  "failed",
]);

export const emailSends = pgTable(
  "email_sends",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    recipientEmail: t.varchar("recipient_email", { length: 320 }).notNull(),
    template: t.varchar({ length: 50 }).notNull(),
    status: emailSendStatusEnum().notNull(),
    error: t.text(),
    /** UUID grouping emails from the same bulk send action */
    batchId: t.uuid("batch_id").notNull(),
    /** Admin who triggered the send */
    sentBy: t.uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("email_sends_batch_id_idx").on(table.batchId),
    t.index("email_sends_template_idx").on(table.template),
    t.index("email_sends_created_at_idx").on(table.createdAt),
    t.index("email_sends_recipient_idx").on(table.recipientEmail),
  ]
);

export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
