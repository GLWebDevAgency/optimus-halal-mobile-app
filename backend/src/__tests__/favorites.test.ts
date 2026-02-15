import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, seedProductAndScan } from "./helpers/seed.js";

describe("favorites router", () => {
  describe("add + list + remove", () => {
    it("full CRUD lifecycle", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      // Add
      const fav = await caller.favorites.add({ productId: product.id });
      expect(fav.productId).toBe(product.id);

      // List
      const list = await caller.favorites.list({});
      expect(list).toHaveLength(1);
      expect(list[0].product?.name).toBe("Test Product");

      // Remove
      const removed = await caller.favorites.remove({ productId: product.id });
      expect(removed.success).toBe(true);

      // Verify empty
      const emptyList = await caller.favorites.list({});
      expect(emptyList).toHaveLength(0);
    });

    it("rejects duplicate favorite", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      await caller.favorites.add({ productId: product.id });

      await expect(
        caller.favorites.add({ productId: product.id })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("folders", () => {
    it("creates folder and moves favorite into it", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const folder = await caller.favorites.createFolder({
        name: "Halal certifie",
        color: "#10b981",
      });
      expect(folder.name).toBe("Halal certifie");

      const fav = await caller.favorites.add({ productId: product.id });
      const moved = await caller.favorites.moveToFolder({
        favoriteId: fav.id,
        folderId: folder.id,
      });
      expect(moved.folderId).toBe(folder.id);
    });
  });
});
