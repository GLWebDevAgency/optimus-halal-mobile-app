import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller, db } from "./helpers/test-context.js";
import { seedTestUser, seedProductAndScan } from "./helpers/seed.js";
import { products, categories } from "../db/schema/index.js";

describe("product router", () => {
  describe("getById", () => {
    it("returns product by ID", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createTestCaller();

      const result = await caller.product.getById({ id: product.id });
      expect(result.barcode).toBe(product.barcode);
      expect(result.name).toBe("Test Product");
      expect(result.brand).toBe("Test Brand");
    });

    it("throws notFound for non-existent product", async () => {
      const caller = createTestCaller();
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await expect(
        caller.product.getById({ id: fakeId })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getByBarcode", () => {
    it("returns product by barcode", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createTestCaller();

      const result = await caller.product.getByBarcode({
        barcode: product.barcode,
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(product.id);
      expect(result!.name).toBe("Test Product");
    });

    it("returns null for non-existent barcode", async () => {
      const caller = createTestCaller();

      const result = await caller.product.getByBarcode({
        barcode: "0000000000000",
      });
      expect(result).toBeNull();
    });
  });

  describe("search", () => {
    it("finds products by name", async () => {
      const user = await seedTestUser();
      await seedProductAndScan(user.id);
      const caller = createTestCaller();

      const result = await caller.product.search({ query: "Test Product" });
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items[0].name).toBe("Test Product");
    });

    it("finds products by brand", async () => {
      const user = await seedTestUser();
      await seedProductAndScan(user.id);
      const caller = createTestCaller();

      const result = await caller.product.search({ query: "Test Brand" });
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].brand).toBe("Test Brand");
    });

    it("returns empty for no matches", async () => {
      const caller = createTestCaller();

      const result = await caller.product.search({
        query: "xyznonexistent",
      });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("filters by halal status", async () => {
      const user = await seedTestUser();
      await seedProductAndScan(user.id);
      const caller = createTestCaller();

      const halal = await caller.product.search({ halalStatus: "halal" });
      expect(halal.items.length).toBeGreaterThan(0);
      expect(halal.items[0].halalStatus).toBe("halal");

      const haram = await caller.product.search({ halalStatus: "haram" });
      expect(haram.items).toHaveLength(0);
      expect(haram.total).toBe(0);
    });

    it("respects limit and offset", async () => {
      const user = await seedTestUser();
      // Seed multiple products
      for (let i = 0; i < 5; i++) {
        await db.insert(products).values({
          barcode: `900000000000${i}`,
          name: `Searchable Product ${i}`,
          brand: "Bulk Brand",
          halalStatus: "halal",
          confidenceScore: 80,
          ingredients: ["flour", "water"],
        });
      }
      const caller = createTestCaller();

      const page1 = await caller.product.search({
        query: "Searchable",
        limit: 2,
        offset: 0,
      });
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = await caller.product.search({
        query: "Searchable",
        limit: 2,
        offset: 2,
      });
      expect(page2.items).toHaveLength(2);
      expect(page2.total).toBe(5);

      // Ensure no overlap
      const page1Ids = page1.items.map((i) => i.id);
      const page2Ids = page2.items.map((i) => i.id);
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });
  });

  describe("getCategories", () => {
    it("returns categories sorted by sortOrder", async () => {
      // Seed categories
      await db.insert(categories).values([
        { id: "dairy", name: "Dairy", nameFr: "Produits laitiers", sortOrder: 2 },
        { id: "beverages", name: "Beverages", nameFr: "Boissons", sortOrder: 1 },
        { id: "snacks", name: "Snacks", nameFr: "Snacks", sortOrder: 3 },
      ]);
      const caller = createTestCaller();

      const result = await caller.product.getCategories();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("beverages");
      expect(result[1].id).toBe("dairy");
      expect(result[2].id).toBe("snacks");
    });

    it("returns empty when no categories exist", async () => {
      const caller = createTestCaller();

      const result = await caller.product.getCategories();
      expect(result).toHaveLength(0);
    });
  });

  describe("getAlternatives", () => {
    it("returns halal alternatives in same category", async () => {
      // Seed a doubtful product
      const [doubtful] = await db
        .insert(products)
        .values({
          barcode: "5000000000001",
          name: "Doubtful Product",
          brand: "Some Brand",
          category: "dairy",
          halalStatus: "doubtful",
          confidenceScore: 40,
          ingredients: ["milk", "gelatin"],
        })
        .returning();

      // Seed halal alternatives in same category
      await db.insert(products).values([
        {
          barcode: "5000000000002",
          name: "Halal Dairy 1",
          brand: "Halal Brand",
          category: "dairy",
          halalStatus: "halal",
          confidenceScore: 95,
          ingredients: ["milk"],
        },
        {
          barcode: "5000000000003",
          name: "Halal Dairy 2",
          brand: "Another Halal",
          category: "dairy",
          halalStatus: "halal",
          confidenceScore: 85,
          ingredients: ["milk", "sugar"],
        },
      ]);

      const caller = createTestCaller();
      const alternatives = await caller.product.getAlternatives({
        productId: doubtful.id,
        limit: 5,
      });

      expect(alternatives.length).toBe(2);
      // Should be sorted by confidence score descending
      expect(alternatives[0].confidenceScore).toBeGreaterThanOrEqual(
        alternatives[1].confidenceScore
      );
      // All should be halal
      for (const alt of alternatives) {
        expect(alt.halalStatus).toBe("halal");
        expect(alt.id).not.toBe(doubtful.id);
      }
    });

    it("returns empty when no alternatives exist", async () => {
      const [product] = await db
        .insert(products)
        .values({
          barcode: "6000000000001",
          name: "Lonely Product",
          brand: "Solo Brand",
          category: "unique-category",
          halalStatus: "doubtful",
          confidenceScore: 50,
          ingredients: ["flour"],
        })
        .returning();

      const caller = createTestCaller();
      const alternatives = await caller.product.getAlternatives({
        productId: product.id,
        limit: 5,
      });

      expect(alternatives).toHaveLength(0);
    });

    it("throws notFound for non-existent product", async () => {
      const caller = createTestCaller();
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await expect(
        caller.product.getAlternatives({ productId: fakeId, limit: 5 })
      ).rejects.toThrow(TRPCError);
    });
  });
});
