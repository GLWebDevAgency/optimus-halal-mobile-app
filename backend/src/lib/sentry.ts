import * as Sentry from "@sentry/node";
import { env } from "./env.js";

export function initSentry() {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    beforeSend(event) {
      // Strip sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
}

export { Sentry };
