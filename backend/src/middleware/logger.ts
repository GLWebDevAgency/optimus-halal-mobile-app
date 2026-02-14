import { createMiddleware } from "hono/factory";
import { logger } from "../lib/logger.js";

export const requestLogger = createMiddleware(async (c, next) => {
  const start = performance.now();

  await next();

  const ms = Math.round(performance.now() - start);
  const status = c.res.status;
  const data = {
    method: c.req.method,
    path: c.req.path,
    status,
    ms,
  };

  if (status >= 500) {
    logger.error("request", data);
  } else if (status >= 400) {
    logger.warn("request", data);
  } else {
    logger.info("request", data);
  }
});
