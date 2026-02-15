import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN } from "../constants/config";

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
  });
}

export { Sentry };
