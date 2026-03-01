import { describe, it, expect, beforeEach } from "vitest";
import { createTestCaller, db, redis } from "./helpers/test-context.js";
import { certifiers } from "../db/schema/index.js";

async function seedCertifier(
  id: string,
  overrides: Partial<typeof certifiers.$inferInsert> = {}
) {
  const [certifier] = await db
    .insert(certifiers)
    .values({
      id,
      name: `Certifier ${id}`,
      isActive: true,
      halalAssessment: false,
      trustScore: 50,
      ...overrides,
    })
    .returning();
  return certifier;
}

// Flush certifier cache keys before each test to avoid stale cached responses
beforeEach(async () => {
  // Flush both legacy "certifiers:*" and runtime score cache "certifier:*"
  const keys = await redis.keys("certifier*");
  if (keys.length > 0) await redis.del(...keys);
});

describe("certifier router", () => {
  describe("ranking", () => {
    it("returns certifiers ordered by trust score descending", async () => {
      // Scores are computed from practice flags, not the trustScore column.
      // More positive practices → higher score.
      await seedCertifier("cert-low", {
        name: "Low Trust",
        acceptsMechanicalSlaughter: true,
        acceptsStunning: true,
        acceptsElectronarcosis: true,
      });
      await seedCertifier("cert-high", {
        name: "High Trust",
        controllersAreEmployees: true,
        hasSalariedSlaughterers: true,
        controllersPresentEachProduction: true,
        transparencyPublicCharter: true,
        transparencyAuditReports: true,
        transparencyCompanyList: true,
      });
      await seedCertifier("cert-mid", {
        name: "Mid Trust",
        controllersAreEmployees: true,
        hasSalariedSlaughterers: true,
      });
      // Inactive — should be excluded
      await seedCertifier("cert-inactive", {
        name: "Inactive",
        isActive: false,
      });

      const caller = createTestCaller();
      const result = await caller.certifier.ranking();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("High Trust");
      expect(result[1].name).toBe("Mid Trust");
      expect(result[2].name).toBe("Low Trust");
    });
  });

  describe("getById", () => {
    it("returns certifier by ID", async () => {
      await seedCertifier("avs", {
        name: "AVS",
        website: "https://avs.fr",
        trustScore: 85,
      });

      const caller = createTestCaller();
      const result = await caller.certifier.getById({ id: "avs" });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("AVS");
      expect(result!.website).toBe("https://avs.fr");
    });

    it("returns null for nonexistent certifier", async () => {
      const caller = createTestCaller();
      const result = await caller.certifier.getById({ id: "nonexistent" });

      expect(result).toBeNull();
    });
  });

  describe("trusted", () => {
    it("returns only certifiers with halalAssessment=true", async () => {
      await seedCertifier("trusted-1", {
        name: "Trusted A",
        halalAssessment: true,
        controllersAreEmployees: true,
        hasSalariedSlaughterers: true,
        transparencyPublicCharter: true,
      });
      await seedCertifier("trusted-2", {
        name: "Trusted B",
        halalAssessment: true,
      });
      await seedCertifier("untrusted-1", {
        name: "Untrusted C",
        halalAssessment: false,
      });

      const caller = createTestCaller();
      const result = await caller.certifier.trusted();

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.name.startsWith("Trusted"))).toBe(true);
      // Should be ordered by trust score descending
      expect(result[0].name).toBe("Trusted A");
      expect(result[1].name).toBe("Trusted B");
    });
  });
});
