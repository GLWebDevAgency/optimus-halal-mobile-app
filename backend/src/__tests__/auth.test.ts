import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller, createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, TEST_USER } from "./helpers/seed.js";

describe("auth router", () => {
  describe("register", () => {
    it("creates a new user and returns tokens", async () => {
      const caller = createTestCaller();
      const result = await caller.auth.register({
        email: "new@naqiy.fr",
        password: "SecurePass123!",
        displayName: "New User",
      });

      expect(result.user.email).toBe("new@naqiy.fr");
      expect(result.user.displayName).toBe("New User");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("rejects duplicate email", async () => {
      await seedTestUser();
      const caller = createTestCaller();

      await expect(
        caller.auth.register({
          email: TEST_USER.email,
          password: "AnotherPass123!",
          displayName: "Duplicate",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("rejects weak password (< 8 chars)", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.register({
          email: "weak@naqiy.fr",
          password: "short",
          displayName: "Weak",
        })
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await seedTestUser();
    });

    it("returns tokens on valid credentials", async () => {
      const caller = createTestCaller();
      const result = await caller.auth.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(result.user.email).toBe(TEST_USER.email);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("rejects wrong password", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.login({
          email: TEST_USER.email,
          password: "WrongPassword123!",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("rejects non-existent email", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.login({
          email: "nobody@naqiy.fr",
          password: "whatever",
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("refresh", () => {
    it("issues new token pair and invalidates old refresh token", async () => {
      const caller = createTestCaller();
      const { refreshToken } = await caller.auth.register({
        email: "refresh@naqiy.fr",
        password: "SecurePass123!",
        displayName: "Refresh Test",
      });

      const result = await caller.auth.refresh({ refreshToken });
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.refreshToken).not.toBe(refreshToken);

      // Old token should be rejected (rotation)
      await expect(
        caller.auth.refresh({ refreshToken })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("me", () => {
    it("returns user profile for authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.auth.me();
      expect(result.email).toBe(TEST_USER.email);
      expect(result.displayName).toBe(TEST_USER.displayName);
      // Must not expose password hash
      expect((result as any).passwordHash).toBeUndefined();
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();

      await expect(caller.auth.me()).rejects.toThrow(TRPCError);
    });
  });
});
