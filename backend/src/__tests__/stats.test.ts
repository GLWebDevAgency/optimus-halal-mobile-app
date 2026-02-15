import { describe, it, expect } from "vitest";
import { createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, seedProductAndScan } from "./helpers/seed.js";

describe("stats router", () => {
  describe("userDashboard", () => {
    it("returns scan count and recent scans", async () => {
      const user = await seedTestUser();
      await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const dashboard = await caller.stats.userDashboard();
      expect(dashboard.totalScans).toBe(1);
      expect(dashboard.recentScans).toHaveLength(1);
    });

    it("returns zeroes for fresh user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const dashboard = await caller.stats.userDashboard();
      expect(dashboard.totalScans).toBe(0);
      expect(dashboard.recentScans).toHaveLength(0);
    });
  });
});
