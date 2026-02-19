import { describe, it, expect } from "vitest";
import {
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";
import { notifications } from "../db/schema/index.js";

describe("notification router", () => {
  // ── List ─────────────────────────────────────────────────

  describe("list", () => {
    it("returns notifications for authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      // Seed 3 notifications
      await db.insert(notifications).values([
        { userId: user.id, type: "alert", title: "Alert 1", body: "Body 1", isRead: false },
        { userId: user.id, type: "promotion", title: "Promo 1", body: "Body 2", isRead: true },
        { userId: user.id, type: "system", title: "System 1", body: "Body 3", isRead: false },
      ]);

      const items = await caller.notification.list({
        limit: 20,
        offset: 0,
      });

      expect(items).toHaveLength(3);
      expect(items.every((n) => n.userId === user.id)).toBe(true);
    });

    it("filters unread only", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      await db.insert(notifications).values([
        { userId: user.id, type: "alert", title: "Unread 1", body: "Body", isRead: false },
        { userId: user.id, type: "alert", title: "Read 1", body: "Body", isRead: true },
        { userId: user.id, type: "alert", title: "Unread 2", body: "Body", isRead: false },
      ]);

      const unread = await caller.notification.list({
        unreadOnly: true,
        limit: 20,
        offset: 0,
      });

      expect(unread).toHaveLength(2);
      expect(unread.every((n) => n.isRead === false)).toBe(true);
    });
  });

  // ── Unread Count ─────────────────────────────────────────

  describe("getUnreadCount", () => {
    it("returns count of unread notifications", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      await db.insert(notifications).values([
        { userId: user.id, type: "alert", title: "N1", body: "B1", isRead: false },
        { userId: user.id, type: "alert", title: "N2", body: "B2", isRead: false },
        { userId: user.id, type: "alert", title: "N3", body: "B3", isRead: true },
      ]);

      const result = await caller.notification.getUnreadCount();
      expect(result.count).toBe(2);
    });
  });

  // ── Mark As Read ─────────────────────────────────────────

  describe("markAsRead", () => {
    it("marks a notification as read", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const [notif] = await db
        .insert(notifications)
        .values({
          userId: user.id,
          type: "alert",
          title: "Test Notification",
          body: "Test body",
          isRead: false,
        })
        .returning();

      const result = await caller.notification.markAsRead({ id: notif.id });
      expect(result.success).toBe(true);

      // Verify it's now read
      const unreadResult = await caller.notification.getUnreadCount();
      expect(unreadResult.count).toBe(0);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      await db.insert(notifications).values([
        { userId: user.id, type: "alert", title: "N1", body: "B1", isRead: false },
        { userId: user.id, type: "promotion", title: "N2", body: "B2", isRead: false },
        { userId: user.id, type: "system", title: "N3", body: "B3", isRead: false },
      ]);

      // Verify 3 unread
      const before = await caller.notification.getUnreadCount();
      expect(before.count).toBe(3);

      const result = await caller.notification.markAllAsRead();
      expect(result.success).toBe(true);

      // Verify 0 unread
      const after = await caller.notification.getUnreadCount();
      expect(after.count).toBe(0);
    });
  });

  // ── Push Tokens ──────────────────────────────────────────

  describe("registerPushToken", () => {
    it("registers a push token", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const token = await caller.notification.registerPushToken({
        token: "ExponentPushToken[xxxxxx]",
        platform: "ios",
        deviceId: "device-123",
      });

      expect(token.id).toBeDefined();
      expect(token.userId).toBe(user.id);
      expect(token.token).toBe("ExponentPushToken[xxxxxx]");
      expect(token.platform).toBe("ios");
      expect(token.deviceId).toBe("device-123");
      expect(token.isActive).toBe(true);
    });
  });

  // ── Settings ─────────────────────────────────────────────

  describe("getSettings", () => {
    it("returns default settings and auto-creates if missing", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const settings = await caller.notification.getSettings();

      expect(settings.userId).toBe(user.id);
      expect(settings.alertsEnabled).toBe(true);
      expect(settings.promotionsEnabled).toBe(true);
      expect(settings.scanResultsEnabled).toBe(true);
      expect(settings.rewardsEnabled).toBe(true);
      expect(settings.communityEnabled).toBe(true);
      expect(settings.quietHoursStart).toBeNull();
      expect(settings.quietHoursEnd).toBeNull();
    });
  });

  describe("updateSettings", () => {
    it("updates notification preferences", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      // First call auto-creates default settings
      await caller.notification.getSettings();

      // Update preferences
      const updated = await caller.notification.updateSettings({
        alertsEnabled: true,
        promotionsEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
      });

      expect(updated.promotionsEnabled).toBe(false);
      expect(updated.alertsEnabled).toBe(true);
      expect(updated.quietHoursStart).toBe("22:00");
      expect(updated.quietHoursEnd).toBe("08:00");

      // Verify persistence via getSettings
      const persisted = await caller.notification.getSettings();
      expect(persisted.promotionsEnabled).toBe(false);
      expect(persisted.quietHoursStart).toBe("22:00");
    });
  });
});
