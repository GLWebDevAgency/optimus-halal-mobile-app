import { describe, it, expect } from "vitest";
import { createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";

describe("subscription router", () => {
  it("getStatus returns free tier by default", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("free");
    expect(status.expiresAt).toBeNull();
    expect(status.provider).toBeNull();
    expect(status.productId).toBeNull();
  });

  it("verifyPurchase upgrades to premium", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    const result = await caller.subscription.verifyPurchase({
      provider: "revenuecat",
      productId: "premium_monthly",
      receiptData: "mock-receipt-data",
    });
    expect(result.success).toBe(true);
    expect(result.tier).toBe("premium");

    // Verify status changed
    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("premium");
    expect(status.provider).toBe("revenuecat");
    expect(status.productId).toBe("premium_monthly");
  });

  it("getHistory returns subscription events", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    // Create a purchase first
    await caller.subscription.verifyPurchase({
      provider: "revenuecat",
      productId: "premium_monthly",
      receiptData: "mock-receipt-data",
    });

    const history = await caller.subscription.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].eventType).toBe("INITIAL_PURCHASE");
    expect(history[0].provider).toBe("revenuecat");
    expect(history[0].productId).toBe("premium_monthly");
  });

  it("getStatus auto-downgrades expired premium", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    // First upgrade
    await caller.subscription.verifyPurchase({
      provider: "revenuecat",
      productId: "premium_monthly",
      receiptData: "mock-receipt",
    });

    // Manually set expiration to past date (simulate expired subscription)
    const { db } = await import("../db/index.js");
    const { users } = await import("../db/schema/index.js");
    const { eq } = await import("drizzle-orm");

    await db.update(users).set({
      subscriptionExpiresAt: new Date("2020-01-01"),
    }).where(eq(users.id, user.id));

    // Now getStatus should auto-downgrade
    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("free");
    expect(status.expiresAt).toBeNull();
  });
});
