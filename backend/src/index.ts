import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
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
import { initSentry, Sentry } from "./lib/sentry.js";
import { webhookRoutes } from "./routes/webhook.js";
import { internalRoutes } from "./routes/internal.js";
import { appConfigRoutes } from "./routes/app-config.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

initSentry();

const app = new Hono();

// ── Global Middleware ──────────────────────────────────────

app.use("*", compress());
app.use("*", secureHeaders());

app.use("*", cors({
  origin: env.CORS_ORIGINS === "*"
    ? "*"
    : env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-App-Version", "X-Platform", "X-Device-Id"],
  maxAge: 86400,
}));

app.use("*", requestLogger);

// ── Rate Limiting (most specific first) ────────────────────
// Expensive endpoints get tighter limits to prevent abuse
app.use("/trpc/scan.analyze*", rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "rl:analyze" }));
app.use("/trpc/store.nearby", rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "rl:nearby" }));
app.use("/trpc/product.search", rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "rl:search" }));
app.use("/trpc/store.search", rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "rl:search" }));
app.use("/trpc/auth.*", rateLimit({ windowMs: 60_000, max: 100, keyPrefix: "rl:auth" }));
// Admin mutations get tighter limits
app.use("/trpc/admin.*", rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "rl:admin" }));
app.use("/trpc/adminWaitlist.*", rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "rl:admin" }));
// General fallback
app.use("/trpc/*", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "rl:api" }));

// ── Health Check ──────────────────────────────────────────

app.get("/health", async (c) => {
  const checks: Record<string, string> = {
    status: "ok",
    service: "naqiy-bff",
    version: pkg.version,
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await db.execute(sql`
      SELECT count(*)::int AS c
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'products', 'refresh_tokens')
    `);
    const count = Number(result[0]?.c ?? 0);
    checks.database = count === 3 ? "ok" : "schema_incomplete";
    if (count < 3) checks.status = "degraded";
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

// ── App Config (public) ─────────────────────────────────
app.route("/", appConfigRoutes);

// ── Webhook Routes ──────────────────────────────────────
app.use("/webhooks/*", rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "rl:webhook" }));
app.route("/webhooks", webhookRoutes);

// ── Internal Routes (cron, admin — auth via CRON_SECRET) ──
app.route("/internal", internalRoutes);

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
  Sentry.captureException(err, {
    extra: { path: c.req.path, method: c.req.method },
  });
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
  service: "naqiy-bff",
  port,
  env: env.NODE_ENV,
  url: `http://localhost:${port}`,
});

const server = serve({ fetch: app.fetch, port });

// ── Graceful Shutdown ────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(() => {
    logger.info("HTTP server closed");
  });

  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch { /* already closed */ }

  // Give in-flight requests 10s to finish
  setTimeout(() => {
    logger.warn("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
