import { describe, it, expect, beforeEach } from "vitest";
import { createTestCaller, db, redis } from "./helpers/test-context.js";
import { boycottTargets } from "../db/schema/index.js";

async function seedBoycottTarget(
  overrides: Partial<typeof boycottTargets.$inferInsert> = {}
) {
  const [target] = await db
    .insert(boycottTargets)
    .values({
      companyName: "Test Company",
      brands: ["BrandA", "BrandB"],
      boycottLevel: "official_bds",
      severity: "warning",
      reason: "Raison du boycott pour cette entreprise",
      isActive: true,
      ...overrides,
    })
    .returning();
  return target;
}

// Flush boycott cache keys before each test to avoid stale cached responses
beforeEach(async () => {
  const keys = await redis.keys("boycott:*");
  if (keys.length > 0) await redis.del(...keys);
});

describe("boycott router", () => {
  describe("checkBrand", () => {
    it("returns isBoycotted=true for matching brand", async () => {
      await seedBoycottTarget({
        companyName: "Evil Corp",
        brands: ["NestlePure", "Maggi"],
      });

      const caller = createTestCaller();
      const result = await caller.boycott.checkBrand({ brand: "Maggi" });

      expect(result.isBoycotted).toBe(true);
      expect(result.targets).toHaveLength(1);
      expect(result.targets[0].companyName).toBe("Evil Corp");
    });

    it("returns isBoycotted=false for non-matching brand", async () => {
      await seedBoycottTarget({
        companyName: "Evil Corp",
        brands: ["NestlePure", "Maggi"],
      });

      const caller = createTestCaller();
      const result = await caller.boycott.checkBrand({ brand: "Innocent" });

      expect(result.isBoycotted).toBe(false);
      expect(result.targets).toHaveLength(0);
    });
  });

  describe("list", () => {
    it("returns active boycott targets", async () => {
      await seedBoycottTarget({ companyName: "Active Corp", isActive: true });
      await seedBoycottTarget({ companyName: "Inactive Corp", isActive: false });

      const caller = createTestCaller();
      const result = await caller.boycott.list({ limit: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].companyName).toBe("Active Corp");
    });
  });

  describe("getById", () => {
    it("returns target by ID", async () => {
      const target = await seedBoycottTarget({
        companyName: "Specific Corp",
        brands: ["BrandX"],
        reason: "Raison spécifique du boycott",
      });

      const caller = createTestCaller();
      const result = await caller.boycott.getById({ id: target.id });

      expect(result).not.toBeNull();
      expect(result!.companyName).toBe("Specific Corp");
      expect(result!.brands).toContain("BrandX");
    });

    it("returns null for nonexistent target", async () => {
      const caller = createTestCaller();
      const result = await caller.boycott.getById({
        id: "00000000-0000-0000-0000-000000000000",
      });

      expect(result).toBeNull();
    });
  });
});
