import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { appRouter } from "../../trpc/router.js";
import { db } from "../../db/index.js";
import { redis } from "../../lib/redis.js";
import type { Context } from "../../trpc/context.js";

// Obtain createCallerFactory from an initTRPC instance (matches production config)
const t = initTRPC.context<Context>().create({ transformer: superjson });
const createCaller = t.createCallerFactory(appRouter);

export function createTestCaller(overrides: Partial<Context> = {}) {
  return createCaller({
    db,
    redis,
    userId: null,
    subscriptionTier: "free",
    requestId: "test-request-id",
    ...overrides,
  });
}

export function createAuthenticatedCaller(userId: string) {
  return createTestCaller({ userId });
}

export { db, redis };
