import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function AlertsLayout() {
  const { colors } = useTheme();

  return (
    <QueryErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </QueryErrorBoundary>
  );
}
