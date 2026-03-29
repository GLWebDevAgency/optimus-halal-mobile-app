import { createMiddleware } from "hono/factory";
import { logger } from "../lib/logger.js";

// Routes where 401/403 is expected behavior (not a warning)
const EXPECTED_AUTH_ROUTES = [
  "/trpc/admin.checkAccess",
  "/trpc/auth.me",
  "/trpc/auth.refresh",
];

export const requestLogger = createMiddleware(async (c, next) => {
  const start = performance.now();

  await next();

  const ms = Math.round(performance.now() - start);
  const status = c.res.status;
  const path = c.req.path;
  const data = {
    method: c.req.method,
    path,
    status,
    ms,
  };

  if (status >= 500) {
    logger.error("request", data);
  } else if (status >= 400) {
    // Expected auth failures are info, not warn
    const isExpectedAuthFailure =
      (status === 401 || status === 403) &&
      EXPECTED_AUTH_ROUTES.some((r) => path.startsWith(r));
    if (isExpectedAuthFailure) {
      logger.info("request", data);
    } else {
      logger.warn("request", data);
    }
  } else {
    logger.info("request", data);
  }
});
