/**
 * Onboarding Layout
 */

import { Stack } from "expo-router";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { useTheme } from "@/hooks/useTheme";

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <QueryErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </QueryErrorBoundary>
  );
}
