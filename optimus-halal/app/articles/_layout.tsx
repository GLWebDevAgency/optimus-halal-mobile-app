import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function ArticlesLayout() {
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
      />
    </QueryErrorBoundary>
  );
}
