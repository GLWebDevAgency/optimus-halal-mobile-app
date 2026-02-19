/**
 * Entry Point - Router Redirect
 *
 * Redirige vers l'écran approprié selon l'état de l'application.
 * NOTE: AppInitializer (in _layout.tsx) already handles the global loading
 * state, so this screen is only rendered AFTER initialization is complete.
 * Auth state comes from the useMe() tRPC query — if it has data, the
 * user is authenticated; otherwise they're redirected to welcome/login.
 */

import React from "react";
import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/store";
import { useMe } from "@/hooks/useAuth";

export default function Index() {
  const { hasCompletedOnboarding } = useOnboardingStore();
  const { data: me } = useMe();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!me) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
