/**
 * Onboarding Layout
 */

import { Stack } from "expo-router";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function OnboardingLayout() {
  return (
    <QueryErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </QueryErrorBoundary>
  );
}
