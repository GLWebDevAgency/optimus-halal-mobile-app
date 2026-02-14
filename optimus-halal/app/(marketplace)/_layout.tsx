/**
 * Marketplace Layout
 * 
 * Layout pour les écrans du marketplace
 */

import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { colors } from "@/constants/theme";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function MarketplaceLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryErrorBoundary>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        contentStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="coming-soon" options={{ animation: "fade" }} />
      <Stack.Screen name="catalog" />
      <Stack.Screen
        name="product/[id]"
        options={{
          presentation: "card",
          animation: "slide_from_bottom",
          animationDuration: 350,
        }}
      />
      <Stack.Screen name="cart" options={{ animation: "slide_from_bottom", animationDuration: 300 }} />
      <Stack.Screen name="checkout" />
      <Stack.Screen
        name="order-tracking"
        options={{
          animation: "fade",
          animationDuration: 250,
        }}
      />
    </Stack>
    </QueryErrorBoundary>
  );
}
