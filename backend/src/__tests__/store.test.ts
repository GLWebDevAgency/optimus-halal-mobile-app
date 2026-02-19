import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createTestCaller,
  createAuthenticatedCaller,
  db,
} from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";
import { stores, storeHours } from "../db/schema/index.js";

async function seedStore(overrides: Partial<typeof stores.$inferInsert> = {}) {
  const [store] = await db
    .insert(stores)
    .values({
      name: "Boucherie Halal",
      storeType: "butcher",
      address: "10 rue de Paris",
      city: "Paris",
      postalCode: "75001",
      latitude: 48.8566,
      longitude: 2.3522,
      isActive: true,
      halalCertified: true,
      certifier: "avs",
      ...overrides,
    })
    .returning();
  return store;
}

describe("store router", () => {
  describe("search", () => {
    it("returns stores matching query", async () => {
      const caller = createTestCaller();

      await seedStore({ name: "Boucherie El Baraka" });
      await seedStore({
        name: "Restaurant Le Cèdre",
        storeType: "restaurant",
        address: "5 avenue des Champs",
        sourceId: "src-2",
      });
      await seedStore({
        name: "Supermarché Inactive",
        storeType: "supermarket",
        isActive: false,
        address: "3 rue Inactive",
        sourceId: "src-3",
      });

      // Search by name
      const result = await caller.store.search({ query: "Baraka" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Boucherie El Baraka");
      expect(result.total).toBe(1);

      // Search all active
      const all = await caller.store.search({});
      expect(all.total).toBe(2); // inactive excluded
    });

    it("filters by storeType", async () => {
      const caller = createTestCaller();

      await seedStore({ name: "Butcher A", storeType: "butcher" });
      await seedStore({
        name: "Restaurant B",
        storeType: "restaurant",
        address: "20 rue B",
        sourceId: "src-rest",
      });

      const result = await caller.store.search({ storeType: "butcher" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Butcher A");
    });
  });

  describe("getById", () => {
    it("returns store with hours", async () => {
      const caller = createTestCaller();
      const store = await seedStore();

      // Seed store hours
      await db.insert(storeHours).values([
        {
          storeId: store.id,
          dayOfWeek: 1,
          openTime: "09:00",
          closeTime: "19:00",
          isClosed: false,
        },
        {
          storeId: store.id,
          dayOfWeek: 0,
          openTime: "10:00",
          closeTime: "13:00",
          isClosed: false,
        },
      ]);

      const result = await caller.store.getById({ id: store.id });

      expect(result.name).toBe("Boucherie Halal");
      expect(result.hours).toHaveLength(2);
      // Hours ordered by dayOfWeek ascending
      expect(result.hours[0].dayOfWeek).toBe(0);
      expect(result.hours[1].dayOfWeek).toBe(1);
      expect(result.hours[1].openTime).toBe("09:00");
    });

    it("throws NOT_FOUND for missing store", async () => {
      const caller = createTestCaller();
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await expect(caller.store.getById({ id: fakeId })).rejects.toThrow(
        TRPCError
      );

      try {
        await caller.store.getById({ id: fakeId });
      } catch (err) {
        expect(err).toBeInstanceOf(TRPCError);
        expect((err as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("subscribe / unsubscribe", () => {
    it("manages store subscriptions", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);
      const store = await seedStore();

      // Subscribe
      const sub = await caller.store.subscribe({ storeId: store.id });
      expect(sub.storeId).toBe(store.id);
      expect(sub.userId).toBe(user.id);

      // Verify via getSubscriptions
      const subs = await caller.store.getSubscriptions();
      expect(subs).toHaveLength(1);
      expect(subs[0].name).toBe("Boucherie Halal");
      expect(subs[0].subscribedAt).toBeDefined();

      // Unsubscribe
      const result = await caller.store.unsubscribe({ storeId: store.id });
      expect(result.success).toBe(true);

      // Verify empty
      const emptySubs = await caller.store.getSubscriptions();
      expect(emptySubs).toHaveLength(0);
    });

    it("rejects duplicate subscription", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);
      const store = await seedStore();

      await caller.store.subscribe({ storeId: store.id });

      await expect(
        caller.store.subscribe({ storeId: store.id })
      ).rejects.toThrow(TRPCError);
    });
  });
});
