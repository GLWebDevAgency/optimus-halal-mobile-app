import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import { requestLogger } from "./middleware/logger.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { db } from "./db/index.js";
import { redis } from "./lib/redis.js";
import { sql } from "drizzle-orm";

const app = new Hono();

// ── Global Middleware ──────────────────────────────────────

app.use("*", compress());

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-App-Version", "X-Platform", "X-Device-Id"],
  maxAge: 86400,
}));

app.use("*", requestLogger);

// Rate limit: 100 req/min on auth routes, 300 req/min global
app.use("/trpc/auth.*", rateLimit({ windowMs: 60_000, max: 100, keyPrefix: "rl:auth" }));
app.use("/trpc/*", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "rl:api" }));

// ── Health Check ──────────────────────────────────────────

app.get("/health", async (c) => {
  const checks: Record<string, string> = {
    status: "ok",
    service: "optimus-halal-bff",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "ok";
  } catch {
    checks.database = "error";
    checks.status = "degraded";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
    checks.status = "degraded";
  }

  checks.uptime = `${Math.floor(process.uptime())}s`;

  return c.json(checks, checks.status === "ok" ? 200 : 503);
});

// ── tRPC Handler ──────────────────────────────────────────

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  })
);

// ── 404 Fallback ──────────────────────────────────────────

app.notFound((c) =>
  c.json({ error: "Not Found", path: c.req.path }, 404)
);

// ── Error Handler ─────────────────────────────────────────

app.onError((err, c) => {
  logger.error("Erreur interne du serveur", {
    error: err.message,
    path: c.req.path,
    method: c.req.method,
  });
  return c.json(
    { error: "Erreur interne du serveur" },
    500
  );
});

// ── Server Start ──────────────────────────────────────────

const port = env.PORT;

logger.info("Serveur demarré", {
  service: "optimus-halal-bff",
  port,
  env: env.NODE_ENV,
  url: `http://localhost:${port}`,
});

serve({ fetch: app.fetch, port });
