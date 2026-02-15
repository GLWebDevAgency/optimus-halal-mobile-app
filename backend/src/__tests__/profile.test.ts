import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createAuthenticatedCaller, createTestCaller } from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";

describe("profile router", () => {
  describe("getProfile", () => {
    it("returns profile without password hash", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const profile = await caller.profile.getProfile();
      expect(profile.email).toBe("test@optimus.fr");
      expect((profile as any).passwordHash).toBeUndefined();
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();
      await expect(caller.profile.getProfile()).rejects.toThrow(TRPCError);
    });
  });

  describe("updateProfile", () => {
    it("updates display name and returns updated profile", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const updated = await caller.profile.updateProfile({
        displayName: "New Name",
      });
      expect(updated.displayName).toBe("New Name");
    });

    it("updates halal strictness preference", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const updated = await caller.profile.updateProfile({
        halalStrictness: "strict",
      });
      expect(updated.halalStrictness).toBe("strict");
    });
  });
});
