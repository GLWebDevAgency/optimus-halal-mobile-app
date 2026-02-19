import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createTestCaller,
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";
import { alerts, alertCategories } from "../db/schema/index.js";

async function seedAlertCategory(slug = "food-safety") {
  const [category] = await db
    .insert(alertCategories)
    .values({
      id: slug,
      name: "Food Safety",
      nameFr: "Sécurité alimentaire",
      icon: "alert-triangle",
      color: "#ef4444",
    })
    .returning();
  return category;
}

async function seedAlert(
  categoryId: string,
  overrides: Partial<typeof alerts.$inferInsert> = {}
) {
  const [alert] = await db
    .insert(alerts)
    .values({
      title: "Test Alert",
      summary: "Summary of the alert",
      content: "Full content of the alert",
      severity: "warning",
      categoryId,
      isActive: true,
      publishedAt: new Date(),
      ...overrides,
    })
    .returning();
  return alert;
}

describe("alert router", () => {
  describe("list", () => {
    it("returns active non-expired alerts", async () => {
      const category = await seedAlertCategory();
      const caller = createTestCaller();

      // Active, no expiry
      await seedAlert(category.id, { title: "Active Alert" });

      // Inactive — should be excluded
      await seedAlert(category.id, {
        title: "Inactive Alert",
        isActive: false,
      });

      // Expired — should be excluded
      await seedAlert(category.id, {
        title: "Expired Alert",
        expiresAt: new Date("2020-01-01"),
      });

      const result = await caller.alert.list({ limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Active Alert");
    });

    it("filters by severity", async () => {
      const category = await seedAlertCategory();
      const caller = createTestCaller();

      await seedAlert(category.id, {
        title: "Info Alert",
        severity: "info",
      });
      await seedAlert(category.id, {
        title: "Critical Alert",
        severity: "critical",
      });

      const result = await caller.alert.list({
        limit: 20,
        severity: "critical",
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Critical Alert");
    });
  });

  describe("getById", () => {
    it("returns alert by ID", async () => {
      const category = await seedAlertCategory();
      const alert = await seedAlert(category.id, {
        title: "Specific Alert",
      });
      const caller = createTestCaller();

      const result = await caller.alert.getById({ id: alert.id });
      expect(result.id).toBe(alert.id);
      expect(result.title).toBe("Specific Alert");
    });

    it("throws NOT_FOUND for nonexistent ID", async () => {
      const caller = createTestCaller();

      await expect(
        caller.alert.getById({ id: "00000000-0000-0000-0000-000000000000" })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("markAsRead", () => {
    it("marks alert as read for user", async () => {
      const user = await seedTestUser();
      const category = await seedAlertCategory();
      const alert = await seedAlert(category.id);
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.alert.markAsRead({ alertId: alert.id });
      expect(result.success).toBe(true);

      // Verify unread count dropped
      const { count } = await caller.alert.getUnreadCount();
      expect(count).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("counts unread alerts for user", async () => {
      const user = await seedTestUser();
      const category = await seedAlertCategory();
      const caller = createAuthenticatedCaller(user.id);

      // Seed 3 active alerts
      const alert1 = await seedAlert(category.id, { title: "Alert 1" });
      await seedAlert(category.id, { title: "Alert 2" });
      await seedAlert(category.id, { title: "Alert 3" });

      // All 3 should be unread
      const before = await caller.alert.getUnreadCount();
      expect(before.count).toBe(3);

      // Mark one as read
      await caller.alert.markAsRead({ alertId: alert1.id });

      const after = await caller.alert.getUnreadCount();
      expect(after.count).toBe(2);
    });
  });
});
