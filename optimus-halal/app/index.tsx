/**
 * Entry Point - Router Redirect
 *
 * Redirige vers l'écran approprié selon l'état de l'application.
 * NOTE: AppInitializer (in _layout.tsx) already handles the global loading
 * state, so this screen is only rendered AFTER initialization is complete.
 * Auth state comes from the useMe() tRPC query — if it has data, the
 * user is authenticated; otherwise they're redirected to welcome/login.
 */

/**
 * Entry Point - Router Redirect
 *
 * Redirige vers l'écran approprié selon l'état de l'application.
 * Auth is NOT required — anonymous users go directly to tabs.
 * Account creation only happens during Naqiy+ subscription.
 */

import React from "react";
import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/store";

export default function Index() {
  const { hasCompletedOnboarding } = useOnboardingStore();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // Direct access to tabs — anonymous mode with free scans (AI analyses limited)
  return <Redirect href="/(tabs)" />;
}
