/**
 * Entry Point - Router Redirect
 *
 * Redirige vers l'écran approprié selon l'état de l'application.
 * NOTE: AppInitializer (in _layout.tsx) already handles the global loading
 * state, so this screen is only rendered AFTER initialization is complete.
 * We use useAuthStore (the canonical API store) for auth state — NOT
 * useLocalAuthStore which depends on MMKV rehydration.
 */

import React from "react";
import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/store";
import { useAuthStore } from "@/store/apiStores";

export default function Index() {
  const { hasCompletedOnboarding } = useOnboardingStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect logic
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
