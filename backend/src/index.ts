import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import { requestLogger } from "./middleware/logger.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { env } from "./lib/env.js";

const app = new Hono();

// ── Global Middleware ──────────────────────────────────────

const allowedOrigins = env.NODE_ENV === "production"
  ? ["https://optimus-halal.com", "https://app.optimus-halal.com"]
  : ["*"];

app.use("*", cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.use("*", requestLogger);

// Rate limit: 100 req/min on auth routes, 300 req/min global
app.use("/trpc/auth.*", rateLimit({ windowMs: 60_000, max: 100, keyPrefix: "rl:auth" }));
app.use("/trpc/*", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "rl:api" }));

// ── Health Check ──────────────────────────────────────────

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "optimus-halal-bff",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
);

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
  console.error("[ERROR]", err.message);
  return c.json(
    { error: "Internal Server Error" },
    500
  );
});

// ── Server Start ──────────────────────────────────────────

const port = env.PORT;

console.log(`
╔══════════════════════════════════════════╗
║   Optimus Halal Mobile BFF              ║
║   Running on http://localhost:${port}       ║
║   Environment: ${env.NODE_ENV.padEnd(24)}║
╚══════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });
