import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller } from "./helpers/test-context.js";
import { seedArticles } from "./helpers/seed.js";

describe("article router", () => {
  describe("list", () => {
    it("returns published articles ordered by date", async () => {
      await seedArticles(5);
      const caller = createTestCaller();

      const result = await caller.article.list({ limit: 10 });
      expect(result.items).toHaveLength(5);
      expect(result.items[0].title).toBe("Article 1");
    });

    it("paginates with cursor", async () => {
      await seedArticles(5);
      const caller = createTestCaller();

      const page1 = await caller.article.list({ limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.nextCursor).toBeTruthy();

      const page2 = await caller.article.list({ limit: 2, cursor: page1.nextCursor! });
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].id).not.toBe(page1.items[0].id);
    });

    it("returns empty for invalid cursor", async () => {
      await seedArticles(3);
      const caller = createTestCaller();

      const result = await caller.article.list({
        limit: 10,
        cursor: "00000000-0000-0000-0000-000000000000",
      });
      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe("getBySlug", () => {
    it("returns article by slug", async () => {
      await seedArticles(1);
      const caller = createTestCaller();

      const article = await caller.article.getBySlug({ slug: "article-1" });
      expect(article.title).toBe("Article 1");
    });

    it("throws NOT_FOUND for missing slug", async () => {
      const caller = createTestCaller();

      await expect(
        caller.article.getBySlug({ slug: "nonexistent" })
      ).rejects.toThrow(TRPCError);
    });
  });
});
