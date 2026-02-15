import PostHog from "posthog-react-native";
import { POSTHOG_API_KEY, POSTHOG_HOST } from "../constants/config";

let posthog: PostHog | null = null;

export function initAnalytics() {
  if (!POSTHOG_API_KEY || __DEV__) return;

  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    enableSessionReplay: false,
  });
}

export function trackEvent(event: string, properties?: Record<string, string | number | boolean | null>) {
  posthog?.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, string | number | boolean | null>) {
  posthog?.identify(userId, traits);
}

export function resetUser() {
  posthog?.reset();
}

export { posthog };
