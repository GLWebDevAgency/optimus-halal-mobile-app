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
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="coming-soon" />
      <Stack.Screen name="catalog" />
      <Stack.Screen 
        name="product/[id]" 
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-tracking" />
    </Stack>
    </QueryErrorBoundary>
  );
}
