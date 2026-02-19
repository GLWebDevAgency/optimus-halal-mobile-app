import { describe, it, expect } from "vitest";
import { createTestCaller, db } from "./helpers/test-context.js";
import { additives, additiveMadhabRulings } from "../db/schema/index.js";

async function seedAdditive(
  overrides: Partial<typeof additives.$inferInsert> = {}
) {
  const [additive] = await db
    .insert(additives)
    .values({
      code: "E100",
      nameFr: "Curcumine",
      nameEn: "Curcumin",
      category: "colorant",
      halalStatusDefault: "halal",
      origin: "plant",
      isActive: true,
      ...overrides,
    })
    .returning();
  return additive;
}

describe("additive router", () => {
  describe("list", () => {
    it("returns active additives", async () => {
      const caller = createTestCaller();

      await seedAdditive({ code: "E100", nameFr: "Curcumine", isActive: true });
      await seedAdditive({
        code: "E200",
        nameFr: "Acide sorbique",
        nameEn: "Sorbic acid",
        category: "preservative",
        isActive: true,
      });
      await seedAdditive({
        code: "E999",
        nameFr: "Inactif",
        category: "other",
        isActive: false,
      });

      const result = await caller.additive.list({});

      // Only active additives
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.isActive)).toBe(true);
      // Ordered by code ascending
      expect(result[0].code).toBe("E100");
      expect(result[1].code).toBe("E200");
    });

    it("filters by category", async () => {
      const caller = createTestCaller();

      await seedAdditive({ code: "E100", category: "colorant" });
      await seedAdditive({
        code: "E200",
        nameFr: "Acide sorbique",
        category: "preservative",
      });

      const result = await caller.additive.list({ category: "colorant" });
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("E100");
    });
  });

  describe("getByCode", () => {
    it("returns additive by code with madhab rulings", async () => {
      const caller = createTestCaller();

      await seedAdditive({ code: "E120", nameFr: "Cochenille", origin: "insect", halalStatusDefault: "doubtful" });

      // Seed madhab rulings
      await db.insert(additiveMadhabRulings).values([
        {
          additiveCode: "E120",
          madhab: "hanafi",
          ruling: "haram",
          explanationFr: "Interdit selon le fiqh hanafite car d'origine insecte",
        },
        {
          additiveCode: "E120",
          madhab: "shafii",
          ruling: "halal",
          explanationFr: "Autorisé selon le fiqh shafiite par istihala",
        },
      ]);

      const result = await caller.additive.getByCode({ code: "E120" });

      expect(result).not.toBeNull();
      expect(result!.code).toBe("E120");
      expect(result!.nameFr).toBe("Cochenille");
      expect(result!.halalStatusDefault).toBe("doubtful");
      expect(result!.madhabRulings).toHaveLength(2);

      const hanafiRuling = result!.madhabRulings.find(
        (r) => r.madhab === "hanafi"
      );
      expect(hanafiRuling).toBeDefined();
      expect(hanafiRuling!.ruling).toBe("haram");
    });

    it("returns null for nonexistent code", async () => {
      const caller = createTestCaller();

      const result = await caller.additive.getByCode({ code: "E999" });
      expect(result).toBeNull();
    });

    it("normalizes OFF-style codes (en:e120 -> E120)", async () => {
      const caller = createTestCaller();

      await seedAdditive({ code: "E120", nameFr: "Cochenille", origin: "insect", halalStatusDefault: "doubtful" });

      const result = await caller.additive.getByCode({ code: "en:e120" });
      expect(result).not.toBeNull();
      expect(result!.code).toBe("E120");
    });
  });

  describe("search", () => {
    it("finds additives by code or name", async () => {
      const caller = createTestCaller();

      await seedAdditive({ code: "E100", nameFr: "Curcumine", nameEn: "Curcumin" });
      await seedAdditive({
        code: "E200",
        nameFr: "Acide sorbique",
        nameEn: "Sorbic acid",
        category: "preservative",
      });
      await seedAdditive({
        code: "E300",
        nameFr: "Acide ascorbique",
        nameEn: "Ascorbic acid",
        category: "antioxidant",
      });

      // Search by code
      const byCode = await caller.additive.search({ query: "E100" });
      expect(byCode).toHaveLength(1);
      expect(byCode[0].code).toBe("E100");

      // Search by French name
      const byNameFr = await caller.additive.search({ query: "Curcumine" });
      expect(byNameFr).toHaveLength(1);
      expect(byNameFr[0].nameFr).toBe("Curcumine");

      // Search by partial English name (matches E200 and E300)
      const byPartial = await caller.additive.search({ query: "acid" });
      expect(byPartial).toHaveLength(2);
    });
  });

  describe("getForProduct", () => {
    it("returns additives matching OFF tags", async () => {
      const caller = createTestCaller();

      await seedAdditive({
        code: "E322",
        nameFr: "Lécithines",
        nameEn: "Lecithins",
        category: "emulsifier",
        halalStatusDefault: "halal",
      });
      await seedAdditive({
        code: "E471",
        nameFr: "Mono- et diglycérides",
        nameEn: "Mono- and diglycerides",
        category: "emulsifier",
        halalStatusDefault: "doubtful",
        origin: "mixed",
      });

      // OFF-style tags: "en:e322i" should normalize to "E322"
      const result = await caller.additive.getForProduct({
        additiveTags: ["en:e322i", "en:e471"],
      });

      expect(result).toHaveLength(2);
      const codes = result.map((a) => a.code).sort();
      expect(codes).toEqual(["E322", "E471"]);

      // Each result should have madhabRuling field (null when general)
      expect(result[0].madhabRuling).toBeNull();
    });

    it("returns empty array for empty tags", async () => {
      const caller = createTestCaller();

      const result = await caller.additive.getForProduct({
        additiveTags: [],
      });
      expect(result).toEqual([]);
    });

    it("includes madhab-specific ruling when requested", async () => {
      const caller = createTestCaller();

      await seedAdditive({
        code: "E120",
        nameFr: "Cochenille",
        origin: "insect",
        halalStatusDefault: "doubtful",
      });

      await db.insert(additiveMadhabRulings).values({
        additiveCode: "E120",
        madhab: "hanafi",
        ruling: "haram",
        explanationFr: "Interdit en fiqh hanafite",
      });

      const result = await caller.additive.getForProduct({
        additiveTags: ["en:e120"],
        madhab: "hanafi",
      });

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("E120");
      expect(result[0].madhabRuling).not.toBeNull();
      expect(result[0].madhabRuling!.ruling).toBe("haram");
      expect(result[0].madhabRuling!.madhab).toBe("hanafi");
    });
  });
});
