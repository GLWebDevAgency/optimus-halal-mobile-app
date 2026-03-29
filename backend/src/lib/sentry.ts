import * as Sentry from "@sentry/node";
import { env } from "./env.js";

// tRPC error codes that are expected user-facing responses, not bugs.
// These generate noise in Sentry without actionable value.
const EXPECTED_TRPC_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "TOO_MANY_REQUESTS",
  "PARSE_ERROR",
]);

export function initSentry() {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    ignoreErrors: [
      // PgBouncer connection pool noise (Railway marks as error)
      "login attempt",
      "new connection to server",
      // Expected client errors
      "UNAUTHORIZED",
      "NOT_FOUND",
    ],
    beforeSend(event, hint) {
      // Strip sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
      }

      // Drop expected tRPC errors (user-facing, not bugs)
      const err = hint?.originalException;
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        typeof (err as { code: string }).code === "string" &&
        EXPECTED_TRPC_CODES.has((err as { code: string }).code)
      ) {
        return null;
      }

      return event;
    },
  });
}

export { Sentry };
