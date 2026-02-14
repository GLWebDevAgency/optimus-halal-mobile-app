/**
 * Root Layout - Expo Router
 * 
 * Configuration globale de l'application
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { useThemeStore, useLanguageStore } from "@/store";
import { useAuthStore } from "@/store/apiStores";
import { setApiLanguage } from "@/services/api";
import { trpc, createTRPCClientForProvider } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui";

// Create a client with enterprise-grade configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes cache
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================
// APP INITIALIZER
// ============================================

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const language = useLanguageStore((state) => state.language);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize auth tokens on app start
    initialize();

    // Sync language with API client
    setApiLanguage(language);
  }, []);

  useEffect(() => {
    // Update API language when it changes
    setApiLanguage(language);
  }, [language]);

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#0f1a13' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================
// ROOT LAYOUT
// ============================================

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();

  const [trpcClient] = useState(() => createTRPCClientForProvider());

  // Determine effective color scheme
  const effectiveColorScheme =
    theme === "system" ? systemColorScheme : theme;
  const isDark = effectiveColorScheme === "dark";

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDark ? '#0f1a13' : '#ffffff' }}>
              <AppInitializer>
                <StatusBar style={isDark ? "light" : "dark"} />
                <OfflineBanner />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 300,
                    gestureEnabled: true,
                  }}
                >
                  <Stack.Screen
                    name="index"
                    options={{ animation: "fade", animationDuration: 200 }}
                  />
                  <Stack.Screen
                    name="(onboarding)"
                    options={{ animation: "fade", animationDuration: 400 }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{ animation: "fade", animationDuration: 350 }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ animation: "fade", animationDuration: 300 }}
                  />
                  <Stack.Screen
                    name="(marketplace)"
                    options={{
                      animation: "fade_from_bottom",
                      animationDuration: 350,
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      animation: "fade_from_bottom",
                      animationDuration: 300,
                    }}
                  />
                  <Stack.Screen
                    name="scan-result"
                    options={{
                      presentation: "card",
                      animation: "slide_from_bottom",
                      animationDuration: 350,
                      gestureEnabled: true,
                      gestureDirection: "vertical",
                    }}
                  />
                  <Stack.Screen
                    name="report"
                    options={{
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      animationDuration: 350,
                      gestureEnabled: true,
                      gestureDirection: "vertical",
                    }}
                  />
                </Stack>
              </AppInitializer>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
