import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createTestCaller,
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import {
  seedTestUser,
  seedProductAndScan,
} from "./helpers/seed.js";
import { products, scans } from "../db/schema/index.js";

describe("scan router", () => {
  describe("scanBarcode", () => {
    it("scans existing product and records scan", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.scanBarcode({
        barcode: product.barcode,
      });

      expect(result.product).not.toBeNull();
      expect(result.product!.barcode).toBe(product.barcode);
      expect(result.scan).toBeDefined();
      expect(result.scan.barcode).toBe(product.barcode);
      expect(result.scan.userId).toBe(user.id);
      expect(result.isNewProduct).toBe(false);
    });

    it("rejects unauthenticated scan", async () => {
      const caller = createTestCaller();

      await expect(
        caller.scan.scanBarcode({ barcode: "3760020507350" })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getHistory", () => {
    it("returns scan history for authenticated user", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.getHistory({ limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].barcode).toBe(product.barcode);
    });

    it("returns empty list for user with no scans", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.getHistory({ limit: 10 });
      expect(result.items).toHaveLength(0);
    });

    it("returns nextCursor when more items exist", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      // Seed multiple products + scans with distinct barcodes and timestamps
      const barcodes = ["1111111111111", "2222222222222", "3333333333333"];
      for (let i = 0; i < barcodes.length; i++) {
        const barcode = barcodes[i];
        const [product] = await db
          .insert(products)
          .values({
            barcode,
            name: `Product ${barcode}`,
            brand: "Test Brand",
            halalStatus: "halal",
            confidenceScore: 90,
            ingredients: ["water"],
          })
          .returning();

        await db.insert(scans).values({
          userId: user.id,
          productId: product.id,
          barcode,
          halalStatus: "halal",
          confidenceScore: 90,
          scannedAt: new Date(Date.now() - i * 60_000), // stagger by 1 min
        });
      }

      // With limit=2 and 3 scans, first page has 2 items and a cursor
      const page1 = await caller.scan.getHistory({ limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.nextCursor).toBeDefined();

      // With limit=10, all 3 fit in one page — no cursor
      const all = await caller.scan.getHistory({ limit: 10 });
      expect(all.items).toHaveLength(3);
      expect(all.nextCursor).toBeUndefined();
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();

      await expect(
        caller.scan.getHistory({ limit: 10 })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getStats", () => {
    it("returns stats for authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.getStats();
      expect(result.totalScans).toBeDefined();
      expect(result.currentStreak).toBeDefined();
      expect(result.longestStreak).toBeDefined();
      expect(result.experiencePoints).toBeDefined();
      expect(result.level).toBeDefined();
      expect(result.totalScansVerified).toBeDefined();
    });

    it("returns zeroes for fresh user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.getStats();
      expect(result.totalScans).toBe(0);
      expect(result.currentStreak).toBe(0);
      expect(result.totalScansVerified).toBe(0);
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();

      await expect(caller.scan.getStats()).rejects.toThrow(TRPCError);
    });
  });

  describe("requestAnalysis", () => {
    it("creates analysis request for authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.scan.requestAnalysis({
        barcode: "1234567890123",
        productName: "Unknown Product",
        notes: "Found at local store",
      });

      expect(result.barcode).toBe("1234567890123");
      expect(result.userId).toBe(user.id);
      expect(result.productName).toBe("Unknown Product");
      expect(result.notes).toBe("Found at local store");
      expect(result.status).toBe("pending");
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();

      await expect(
        caller.scan.requestAnalysis({
          barcode: "1234567890123",
          productName: "Test",
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
