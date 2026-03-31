/**
 * App configuration endpoint — public, no auth required.
 *
 * GET /app-config — returns version requirements, store URLs, maintenance mode.
 *
 * All values are driven by environment variables with sensible defaults,
 * enabling runtime control without redeployment.
 */

import { Hono } from "hono";

export const appConfigRoutes = new Hono();

// ── GET /app-config ──────────────────────────────────────────

appConfigRoutes.get("/app-config", (c) => {
  c.header("Cache-Control", "public, max-age=300");

  return c.json({
    minVersion: process.env.MIN_APP_VERSION ?? "1.0.0",
    latestVersion: process.env.LATEST_APP_VERSION ?? "1.0.0",
    forceUpdate: process.env.FORCE_APP_UPDATE === "true",
    storeUrls: {
      ios:
        process.env.APP_STORE_URL ??
        "https://apps.apple.com/app/naqiy/id0000000000",
      android:
        process.env.PLAY_STORE_URL ??
        "https://play.google.com/store/apps/details?id=com.naqiy.app",
    },
    maintenance: process.env.APP_MAINTENANCE === "true",
    message: process.env.APP_MESSAGE || null,
  });
});
