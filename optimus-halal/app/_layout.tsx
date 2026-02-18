/**
 * Root Layout - Expo Router
 * 
 * Configuration globale de l'application
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import "../global.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  I18nManager,
  useColorScheme,
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useThemeStore, useLanguageStore } from "@/store";
import { useTheme, useTranslation } from "@/hooks";
import { useAuthStore } from "@/store/apiStores";
import { setApiLanguage } from "@/services/api";
import { isRTL as isRTLLanguage } from "@/i18n";
import { trpc, createTRPCClientForProvider } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui";
import { logger } from "@/lib/logger";
import { initSentry } from "../src/lib/sentry";
import { initAnalytics } from "../src/lib/analytics";

initSentry();
initAnalytics();

// ── Sync RTL direction on app startup ─────────────────────
// I18nManager.forceRTL persists but only renders after a restart.
// After a restart we read the persisted language and ensure the
// I18nManager state matches — this runs synchronously before
// any React tree renders so the layout direction is correct.
const persistedLanguage = useLanguageStore.getState().language;
const shouldBeRTL = isRTLLanguage(persistedLanguage);
if (I18nManager.isRTL !== shouldBeRTL) {
  I18nManager.forceRTL(shouldBeRTL);
  I18nManager.allowRTL(shouldBeRTL);
}

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

/** Debug log overlay — shown when init hangs or on long press */
function DebugOverlay({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState(logger.getFormattedLogs());
  const { t } = useTranslation();

  useEffect(() => {
    const unsub = logger.subscribe(() => setLogs(logger.getFormattedLogs()));
    return unsub;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000000ee", padding: 16, paddingTop: 60 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: "#16a34a", fontSize: 16, fontWeight: "bold" }}>
          Debug Logs
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: "#fff", fontSize: 16 }}>{t.common.close}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <Text style={{ color: "#e0e0e0", fontSize: 11, fontFamily: "monospace" }}>
          {logs || t.common.noLogsCollected}
        </Text>
      </ScrollView>
    </View>
  );
}

const INIT_TIMEOUT_MS = 8000;

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const language = useLanguageStore((state) => state.language);
  const { isDark: initIsDark } = useTheme();
  const { t } = useTranslation();
  const [showDebug, setShowDebug] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const initCalled = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    logger.info("AppInit", "useEffect: calling initialize()");
    initialize().catch((e) =>
      logger.error("AppInit", "initialize() threw", String(e))
    );
    setApiLanguage(language);

    // Safety timeout — force past loading if init hangs
    timeoutRef.current = setTimeout(() => {
      logger.warn("AppInit", `Timeout after ${INIT_TIMEOUT_MS}ms — forcing past loading`);
      setTimedOut(true);
    }, INIT_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Clear timeout as soon as init completes
  useEffect(() => {
    if (!isInitializing && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isInitializing]);

  useEffect(() => {
    setApiLanguage(language);
  }, [language]);

  const handleLongPress = useCallback(() => setShowDebug(true), []);

  if (showDebug) {
    return <DebugOverlay onClose={() => setShowDebug(false)} />;
  }

  // Show loading spinner only during app startup init (with timeout escape)
  if (isInitializing && !timedOut) {
    return (
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={3000}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: initIsDark ? "#0f1a13" : "#ffffff" }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ color: "#888", fontSize: 12, marginTop: 16 }}>
          {t.common.loadingLongPress}
        </Text>
      </Pressable>
    );
  }

  // If timed out, show debug info + option to continue
  if (timedOut && isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: initIsDark ? "#0f1a13" : "#ffffff", padding: 24, paddingTop: 60 }}>
        <Text style={{ color: "#ef4444", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          {t.common.initTooLong}
        </Text>
        <Text style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
          {t.common.initTooLongDesc.replace("{{seconds}}", String(INIT_TIMEOUT_MS / 1000))}
        </Text>
        <TouchableOpacity
          onPress={() => setShowDebug(true)}
          style={{ backgroundColor: "#16a34a", padding: 12, borderRadius: 8, marginBottom: 12 }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
            {t.common.viewLogs}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            useAuthStore.setState({ isInitializing: false });
            setTimedOut(false);
          }}
          style={{ backgroundColor: "#333", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            {t.common.continueAnyway}
          </Text>
        </TouchableOpacity>
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
                  <Stack.Screen
                    name="articles"
                    options={{
                      animation: "fade_from_bottom",
                      animationDuration: 300,
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
