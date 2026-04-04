/**
 * Entry Point — Router Redirect
 *
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
