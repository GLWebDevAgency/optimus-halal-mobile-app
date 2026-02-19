import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createTestCaller,
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";
import { products, stores, reviews } from "../db/schema/index.js";

describe("report router", () => {
  // ── Reports ─────────────────────────────────────────────

  describe("createReport", () => {
    it("creates a report for the authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const report = await caller.report.createReport({
        type: "incorrect_halal_status",
        title: "Wrong halal status",
        description: "This product is labelled halal but contains gelatin from pork.",
      });

      expect(report.id).toBeDefined();
      expect(report.userId).toBe(user.id);
      expect(report.type).toBe("incorrect_halal_status");
      expect(report.title).toBe("Wrong halal status");
      expect(report.status).toBe("pending");
    });

    it("requires authentication", async () => {
      const caller = createTestCaller();

      await expect(
        caller.report.createReport({
          type: "other",
          title: "Some report title",
          description: "This is a detailed description of the issue.",
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getMyReports", () => {
    it("returns only the authenticated user's reports", async () => {
      const user1 = await seedTestUser();
      const caller1 = createAuthenticatedCaller(user1.id);

      // Create 2 reports for user1
      await caller1.report.createReport({
        type: "missing_product",
        title: "Missing product report",
        description: "Cannot find this product in the database at all.",
      });
      await caller1.report.createReport({
        type: "wrong_ingredients",
        title: "Wrong ingredients listed",
        description: "The ingredient list does not match the packaging.",
      });

      const myReports = await caller1.report.getMyReports({
        limit: 20,
        offset: 0,
      });

      expect(myReports).toHaveLength(2);
      expect(myReports[0].userId).toBe(user1.id);
      expect(myReports[1].userId).toBe(user1.id);
    });
  });

  // ── Reviews ─────────────────────────────────────────────

  describe("createReview", () => {
    it("creates a review with rating", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const [product] = await db
        .insert(products)
        .values({
          barcode: "1234567890123",
          name: "Test Product",
          brand: "TestBrand",
          halalStatus: "halal",
          confidenceScore: 95,
          ingredients: ["water"],
        })
        .returning();

      const review = await caller.report.createReview({
        productId: product.id,
        rating: 4,
        comment: "Good halal product, verified.",
      });

      expect(review.id).toBeDefined();
      expect(review.userId).toBe(user.id);
      expect(review.productId).toBe(product.id);
      expect(review.rating).toBe(4);
      expect(review.comment).toBe("Good halal product, verified.");
      expect(review.helpfulCount).toBe(0);
    });
  });

  describe("getProductReviews", () => {
    it("returns reviews for a product", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const [product] = await db
        .insert(products)
        .values({
          barcode: "9876543210987",
          name: "Another Product",
          brand: "TestBrand",
          halalStatus: "halal",
          confidenceScore: 90,
          ingredients: ["flour", "water"],
        })
        .returning();

      // Create 2 reviews for this product
      await caller.report.createReview({
        productId: product.id,
        rating: 5,
        comment: "Excellent product",
      });
      await caller.report.createReview({
        productId: product.id,
        rating: 3,
        comment: "Average product",
      });

      // Public caller can fetch product reviews
      const publicCaller = createTestCaller();
      const productReviews = await publicCaller.report.getProductReviews({
        productId: product.id,
        limit: 20,
        offset: 0,
      });

      expect(productReviews).toHaveLength(2);
      expect(productReviews.every((r) => r.productId === product.id)).toBe(true);
    });
  });

  describe("markHelpful", () => {
    it("increments helpful count and deduplicates on second vote", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const [product] = await db
        .insert(products)
        .values({
          barcode: "5555555555555",
          name: "Helpful Test Product",
          brand: "TestBrand",
          halalStatus: "halal",
          confidenceScore: 85,
          ingredients: ["sugar"],
        })
        .returning();

      // Create a review to vote on
      const review = await caller.report.createReview({
        productId: product.id,
        rating: 4,
      });

      // First vote — should succeed
      const firstVote = await caller.report.markHelpful({
        reviewId: review.id,
      });
      expect(firstVote.success).toBe(true);
      expect(firstVote.alreadyVoted).toBe(false);

      // Second vote — should be deduplicated
      const secondVote = await caller.report.markHelpful({
        reviewId: review.id,
      });
      expect(secondVote.success).toBe(false);
      expect(secondVote.alreadyVoted).toBe(true);

      // Verify helpful count is 1 (not 2)
      const publicCaller = createTestCaller();
      const [updatedReview] = await publicCaller.report.getProductReviews({
        productId: product.id,
        limit: 1,
        offset: 0,
      });
      expect(updatedReview.helpfulCount).toBe(1);
    });
  });
});
