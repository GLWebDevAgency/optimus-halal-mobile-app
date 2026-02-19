import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
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

  it("verifyPurchase rejects (no server-side validation yet)", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    await expect(
      caller.subscription.verifyPurchase({
        provider: "revenuecat",
        productId: "premium_monthly",
        receiptData: "mock-receipt-data",
      })
    ).rejects.toThrow("Vérification d'achat non disponible");
  });

  it("getHistory returns subscription events", async () => {
    const user = await seedTestUser();
    const caller = createAuthenticatedCaller(user.id);

    // Seed premium state directly (verifyPurchase is disabled for security)
    const { db } = await import("../db/index.js");
    const { users, subscriptionEvents } = await import(
      "../db/schema/index.js"
    );

    await db
      .update(users)
      .set({
        subscriptionTier: "premium",
        subscriptionProvider: "revenuecat",
        subscriptionProductId: "premium_monthly",
      })
      .where(eq(users.id, user.id));

    await db.insert(subscriptionEvents).values({
      userId: user.id,
      eventType: "INITIAL_PURCHASE",
      provider: "revenuecat",
      productId: "premium_monthly",
      environment: "PRODUCTION",
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

    // Seed premium state directly with past expiration
    const { db } = await import("../db/index.js");
    const { users } = await import("../db/schema/index.js");

    await db
      .update(users)
      .set({
        subscriptionTier: "premium",
        subscriptionProvider: "revenuecat",
        subscriptionProductId: "premium_monthly",
        subscriptionExpiresAt: new Date("2020-01-01"),
      })
      .where(eq(users.id, user.id));

    // Now getStatus should auto-downgrade
    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("free");
    expect(status.expiresAt).toBeNull();
  });
});
