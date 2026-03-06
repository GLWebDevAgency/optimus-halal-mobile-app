import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN, APP_CONFIG } from "../constants/config";

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    release: `${APP_CONFIG.APP_NAME}@${APP_CONFIG.VERSION}`,
  });
}

/** Tag Sentry scope for guest (anonymous) sessions */
export function setGuestContext(deviceId: string) {
  Sentry.setUser({ id: deviceId });
  Sentry.setTag("tier", "guest");
  Sentry.setTag("is_guest", "true");
  Sentry.setTag("app_version", APP_CONFIG.VERSION);
}

/** Tag Sentry scope for authenticated (Naqiy+) sessions */
export function setUserContext(userId: string, email: string) {
  Sentry.setUser({ id: userId, email });
  Sentry.setTag("tier", "premium");
  Sentry.setTag("is_guest", "false");
  Sentry.setTag("app_version", APP_CONFIG.VERSION);
}

/** Clear Sentry user on logout */
export function clearSentryUser() {
  Sentry.setUser(null);
  Sentry.setTag("tier", "guest");
  Sentry.setTag("is_guest", "true");
}

export { Sentry };
