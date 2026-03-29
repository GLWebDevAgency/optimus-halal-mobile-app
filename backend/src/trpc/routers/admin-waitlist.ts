import { z } from "zod";
import { randomUUID } from "node:crypto";
import { eq, sql, ilike, desc, asc, gte, lte, and, inArray } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { waitlistLeads, emailSends, users } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";
import {
  sendWaitlistConfirmationEmail,
  sendWelcomeEmail,
  sendTrialReminderEmail,
  sendTrialExpiredEmail,
  sendLaunchNotificationEmail,
} from "../../services/email.service.js";

const EMAIL_TEMPLATES = [
  "waitlist_confirmation",
  "welcome",
  "trial_reminder",
  "trial_expired",
  "launch",
] as const;

type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

const templateSenders: Record<EmailTemplate, (email: string) => Promise<boolean>> = {
  waitlist_confirmation: sendWaitlistConfirmationEmail,
  welcome: sendWelcomeEmail,
  trial_reminder: sendTrialReminderEmail,
  trial_expired: sendTrialExpiredEmail,
  launch: sendLaunchNotificationEmail,
};

export const adminWaitlistRouter = router({
  /** List waitlist leads with pagination, search, source filter */
  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().optional(),
        source: z.string().max(100).optional(),
        sortBy: z.enum(["createdAt", "email", "source"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, source, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (search) {
        conditions.push(ilike(waitlistLeads.email, `%${search}%`));
      }
      if (source) {
        conditions.push(eq(waitlistLeads.source, source));
      }

      const where =
        conditions.length > 0
          ? conditions.length === 1
            ? conditions[0]
            : and(...conditions)
          : undefined;

      const sortColumn =
        sortBy === "email"
          ? waitlistLeads.email
          : sortBy === "source"
            ? waitlistLeads.source
            : waitlistLeads.createdAt;
      const orderFn = sortOrder === "asc" ? asc : desc;

      const [[countResult], items] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(waitlistLeads)
          .where(where),
        ctx.db
          .select()
          .from(waitlistLeads)
          .where(where)
          .orderBy(orderFn(sortColumn))
          .limit(limit)
          .offset(offset),
      ]);

      const total = countResult?.count ?? 0;
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /** Waitlist stats: total, by source, by day (30d), UTM breakdown */
  stats: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult, bySource, daily, topUtmCampaigns] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
      ctx.db
        .select({
          source: waitlistLeads.source,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .groupBy(waitlistLeads.source)
        .orderBy(sql`count(*) desc`),
      ctx.db
        .select({
          date: sql<string>`to_char(${waitlistLeads.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .where(gte(waitlistLeads.createdAt, thirtyDaysAgo))
        .groupBy(sql`${waitlistLeads.createdAt}::date`)
        .orderBy(sql`${waitlistLeads.createdAt}::date`),
      ctx.db
        .select({
          campaign: waitlistLeads.utmCampaign,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .where(sql`${waitlistLeads.utmCampaign} IS NOT NULL`)
        .groupBy(waitlistLeads.utmCampaign)
        .orderBy(sql`count(*) desc`)
        .limit(10),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      bySource,
      daily,
      topUtmCampaigns,
    };
  }),

  /** Delete a single waitlist lead */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(waitlistLeads)
        .where(eq(waitlistLeads.id, input.id))
        .returning({ email: waitlistLeads.email });

      if (!deleted) {
        return { success: false, message: "Lead introuvable" };
      }

      logger.info("Admin: waitlist lead deleted", { email: deleted.email, by: ctx.userId });
      return { success: true, message: `${deleted.email} supprimé` };
    }),

  /** Bulk delete waitlist leads */
  deleteBulk: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(waitlistLeads)
        .where(inArray(waitlistLeads.id, input.ids))
        .returning({ id: waitlistLeads.id });

      logger.info("Admin: waitlist bulk delete", { count: result.length, by: ctx.userId });
      return { success: true, deletedCount: result.length };
    }),

  /** Export waitlist leads as JSON (client converts to CSV). Capped at 50k rows. */
  export: adminProcedure.query(async ({ ctx }) => {
    logger.info("Admin: waitlist export", { by: ctx.userId });

    const rows = await ctx.db
      .select({
        email: waitlistLeads.email,
        source: waitlistLeads.source,
        locale: waitlistLeads.locale,
        utmSource: waitlistLeads.utmSource,
        utmMedium: waitlistLeads.utmMedium,
        utmCampaign: waitlistLeads.utmCampaign,
        createdAt: waitlistLeads.createdAt,
      })
      .from(waitlistLeads)
      .orderBy(desc(waitlistLeads.createdAt))
      .limit(50_000);

    return rows;
  }),

  /** Send bulk email to selected waitlist leads (with full audit trail) */
  sendBulkEmail: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        template: z.enum(EMAIL_TEMPLATES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const leads = await ctx.db
        .select({ email: waitlistLeads.email })
        .from(waitlistLeads)
        .where(inArray(waitlistLeads.id, input.ids));

      if (leads.length === 0) {
        return { sent: 0, failed: 0, total: 0, batchId: null };
      }

      const sender = templateSenders[input.template];
      const batchId = randomUUID();
      let sent = 0;
      let failed = 0;

      // Send in batches of 10 to avoid overwhelming Brevo
      const BATCH_SIZE = 10;
      for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((lead) => sender(lead.email))
        );

        // Log each send to email_sends table
        const rows = batch.map((lead, idx) => {
          const r = results[idx];
          const ok = r.status === "fulfilled" && r.value;
          if (ok) sent++;
          else failed++;
          return {
            recipientEmail: lead.email,
            template: input.template,
            status: ok ? ("sent" as const) : ("failed" as const),
            error: ok
              ? null
              : r.status === "rejected"
                ? String(r.reason)
                : "Brevo returned false",
            batchId,
            sentBy: ctx.userId,
          };
        });

        await ctx.db.insert(emailSends).values(rows);
      }

      logger.info("Admin: bulk email sent", {
        template: input.template,
        batchId,
        sent,
        failed,
        total: leads.length,
        by: ctx.userId,
      });

      return { sent, failed, total: leads.length, batchId };
    }),

  // ---------------------------------------------------------------------------
  // Email history & analytics
  // ---------------------------------------------------------------------------

  /** Paginated email send history with filters */
  emailHistory: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        template: z.string().max(50).optional(),
        status: z.enum(["sent", "failed"]).optional(),
        search: z.string().trim().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, template, status, search } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (template) conditions.push(eq(emailSends.template, template));
      if (status) conditions.push(eq(emailSends.status, status));
      if (search) conditions.push(ilike(emailSends.recipientEmail, `%${search}%`));

      const where =
        conditions.length > 0
          ? conditions.length === 1
            ? conditions[0]
            : and(...conditions)
          : undefined;

      const [[countResult], items] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(emailSends)
          .where(where),
        ctx.db
          .select({
            id: emailSends.id,
            recipientEmail: emailSends.recipientEmail,
            template: emailSends.template,
            status: emailSends.status,
            error: emailSends.error,
            batchId: emailSends.batchId,
            sentBy: emailSends.sentBy,
            senderName: users.displayName,
            createdAt: emailSends.createdAt,
          })
          .from(emailSends)
          .leftJoin(users, eq(emailSends.sentBy, users.id))
          .where(where)
          .orderBy(desc(emailSends.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      const total = countResult?.count ?? 0;
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }),

  /** Email send stats: totals, by template, by status, daily (30d) */
  emailStats: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult, byTemplate, byStatus, daily] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(emailSends),
      ctx.db
        .select({
          template: emailSends.template,
          count: sql<number>`count(*)::int`,
        })
        .from(emailSends)
        .groupBy(emailSends.template)
        .orderBy(sql`count(*) desc`),
      ctx.db
        .select({
          status: emailSends.status,
          count: sql<number>`count(*)::int`,
        })
        .from(emailSends)
        .groupBy(emailSends.status),
      ctx.db
        .select({
          date: sql<string>`to_char(${emailSends.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(emailSends)
        .where(gte(emailSends.createdAt, thirtyDaysAgo))
        .groupBy(sql`${emailSends.createdAt}::date`)
        .orderBy(sql`${emailSends.createdAt}::date`),
    ]);

    const sentCount = byStatus.find((s) => s.status === "sent")?.count ?? 0;
    const failedCount = byStatus.find((s) => s.status === "failed")?.count ?? 0;
    const total = totalResult[0]?.count ?? 0;

    return {
      total,
      sent: sentCount,
      failed: failedCount,
      successRate: total > 0 ? Math.round((sentCount / total) * 100) : 0,
      byTemplate,
      daily,
    };
  }),
});
