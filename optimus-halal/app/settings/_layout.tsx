/**
 * Settings Layout
 *
 * Smooth transitions for all settings screens.
 * Uses fade_from_bottom for a polished feel when navigating
 * from the profile tab into individual settings pages.
 */

import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <QueryErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade_from_bottom",
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="appearance" options={{ animation: "fade", animationDuration: 250 }} />
        <Stack.Screen name="language" options={{ animation: "fade", animationDuration: 250 }} />
        <Stack.Screen name="certifications" />
        <Stack.Screen name="exclusions" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="favorites" />
      </Stack>
    </QueryErrorBoundary>
  );
}
