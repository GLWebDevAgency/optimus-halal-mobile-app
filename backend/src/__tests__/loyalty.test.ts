import { describe, it, expect } from "vitest";
import {
  createTestCaller,
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";
import {
  pointTransactions,
  rewards,
  achievements,
  userAchievements,
  users,
} from "../db/schema/index.js";
import { eq } from "drizzle-orm";

describe("loyalty router", () => {
  describe("getBalance", () => {
    it("returns 0 for fresh user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const balance = await caller.loyalty.getBalance();

      expect(balance.points).toBe(0);
      expect(balance.level).toBe(1);
      expect(balance.experiencePoints).toBe(0);
    });

    it("returns sum of point transactions", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      await db.insert(pointTransactions).values([
        {
          userId: user.id,
          action: "scan",
          points: 10,
          description: "First scan",
        },
        {
          userId: user.id,
          action: "scan",
          points: 25,
          description: "Second scan",
        },
        {
          userId: user.id,
          action: "review",
          points: 15,
          description: "Review bonus",
        },
      ]);

      // Also update user XP to verify it's returned
      await db
        .update(users)
        .set({ experiencePoints: 100, level: 2 })
        .where(eq(users.id, user.id));

      const balance = await caller.loyalty.getBalance();

      expect(balance.points).toBe(50);
      expect(balance.level).toBe(2);
      expect(balance.experiencePoints).toBe(100);
    });
  });

  describe("getRewards", () => {
    it("returns active rewards", async () => {
      const caller = createTestCaller();

      // Seed active and inactive rewards
      await db.insert(rewards).values([
        {
          name: "Discount 10%",
          description: "10% off next purchase",
          pointsCost: 100,
          category: "discount",
          isActive: true,
          remainingQuantity: 5,
        },
        {
          name: "Free Delivery",
          description: "Free delivery on next order",
          pointsCost: 200,
          category: "delivery",
          isActive: true,
          remainingQuantity: 10,
        },
        {
          name: "Expired Reward",
          description: "Should not appear",
          pointsCost: 50,
          category: "discount",
          isActive: false,
          remainingQuantity: 0,
        },
      ]);

      const result = await caller.loyalty.getRewards({});

      // Only active rewards should be returned
      expect(result.length).toBe(2);
      expect(result.every((r) => r.isActive)).toBe(true);
      // Ordered by pointsCost ascending
      expect(result[0].pointsCost).toBeLessThanOrEqual(result[1].pointsCost);
    });
  });

  describe("getLeaderboard", () => {
    it("returns users ranked by XP with hashed IDs", async () => {
      const caller = createTestCaller();

      // Seed multiple users with different XP via seedTestUser won't work for
      // multiples (unique email), so insert directly
      const [user1] = await db
        .insert(users)
        .values({
          email: "leader1@test.fr",
          passwordHash: "hash1",
          displayName: "Leader One",
          experiencePoints: 500,
          level: 5,
          totalScans: 50,
          isActive: true,
        })
        .returning();

      const [user2] = await db
        .insert(users)
        .values({
          email: "leader2@test.fr",
          passwordHash: "hash2",
          displayName: "Leader Two",
          experiencePoints: 1000,
          level: 10,
          totalScans: 100,
          isActive: true,
        })
        .returning();

      const result = await caller.loyalty.getLeaderboard({ limit: 10 });

      expect(result.length).toBe(2);
      // Highest XP first
      expect(result[0].displayName).toBe("Leader Two");
      expect(result[0].experiencePoints).toBe(1000);
      expect(result[1].displayName).toBe("Leader One");
      expect(result[1].experiencePoints).toBe(500);

      // IDs should be hashed (16 hex chars), not the original UUIDs
      expect(result[0].id).not.toBe(user2.id);
      expect(result[0].id).toHaveLength(16);
      expect(result[0].id).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe("getAchievements", () => {
    it("returns all achievements with unlocked status", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      // Seed achievements (id is varchar PK, not UUID)
      await db.insert(achievements).values([
        {
          id: "first_scan",
          name: "Premier scan",
          description: "Votre premier scan",
          icon: "star",
          pointsReward: 50,
          requirement: { type: "scans", count: 1 },
          sortOrder: 1,
        },
        {
          id: "ten_scans",
          name: "Dix scans",
          description: "Scanner 10 produits",
          icon: "trophy",
          pointsReward: 100,
          requirement: { type: "scans", count: 10 },
          sortOrder: 2,
        },
      ]);

      // Unlock only the first achievement for this user
      await db.insert(userAchievements).values({
        userId: user.id,
        achievementId: "first_scan",
      });

      const result = await caller.loyalty.getAchievements();

      expect(result).toHaveLength(2);

      // Ordered by sortOrder
      expect(result[0].id).toBe("first_scan");
      expect(result[0].unlocked).toBe(true);
      expect(result[0].unlockedAt).toBeDefined();

      expect(result[1].id).toBe("ten_scans");
      expect(result[1].unlocked).toBe(false);
      expect(result[1].unlockedAt).toBeUndefined();
    });
  });
});
