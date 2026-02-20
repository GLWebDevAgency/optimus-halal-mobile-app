/**
 * Root Layout - Expo Router
 * 
 * Configuration globale de l'application
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import "../global.css";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  I18nManager,
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useLanguageStore } from "@/store";
import { useTheme, useTranslation } from "@/hooks";
import { initializeTokens, isAuthenticated as hasStoredTokens, clearTokens, setApiLanguage, setOnAuthFailure } from "@/services/api";
import { useMe } from "@/hooks/useAuth";
import { isRTL as isRTLLanguage } from "@/i18n";
import { trpc, createTRPCClientForProvider } from "@/lib/trpc";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui";
import { logger } from "@/lib/logger";
import { initSentry } from "../src/lib/sentry";
import { initAnalytics } from "../src/lib/analytics";
import { setNavigationBarTheme } from "@/lib/navigationBar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

initSentry();
initAnalytics();

// Prevent the splash screen from auto-hiding before theme and state are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

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
      retry: (failureCount, error) => {
        // Never retry on rate-limited or auth errors — server won't change its mind
        const status = (error as any)?.data?.httpStatus ?? (error as any)?.status;
        if (status === 429 || status === 401 || status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
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
  const language = useLanguageStore((state) => state.language);
  const { isDark: initIsDark } = useTheme();
  const { t } = useTranslation();
  const [showDebug, setShowDebug] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [tokensReady, setTokensReady] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const initCalled = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: Load tokens from SecureStore
  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    // Register auth failure callback — invoked when token refresh fails.
    // Clears tokens and React Query cache so the user is redirected to login.
    setOnAuthFailure(() => {
      logger.warn("Auth", "onAuthFailure: clearing tokens + query cache");
      clearTokens().catch(() => {});
      queryClient.clear();
    });

    logger.info("AppInit", "useEffect: loading tokens from SecureStore");
    initializeTokens()
      .catch((e) => logger.error("AppInit", "initializeTokens() threw", String(e)))
      .finally(() => {
        logger.info("AppInit", "tokens loaded, hasStoredTokens:", hasStoredTokens());
        setTokensReady(true);
      });
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

  // Step 2: Once tokens loaded, fetch user profile (only if tokens exist)
  const shouldFetchMe = tokensReady && hasStoredTokens();
  const meQuery = useMe({ enabled: shouldFetchMe });

  // Initialization is done when:
  // - tokens loaded AND no tokens → not authenticated, done immediately
  // - tokens loaded AND has tokens AND meQuery resolved → done
  // - forceReady → user bypassed timeout
  const isInitializing = !forceReady && (!tokensReady || (shouldFetchMe && meQuery.isLoading));

  // Clear timeout as soon as init completes
  useEffect(() => {
    if (!isInitializing && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      // Hide splash screen smoothly now that everything is ready
      setTimeout(() => SplashScreen.hideAsync(), 100);
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
            setForceReady(true);
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
  const { isDark, effectiveTheme } = useTheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  // Sync NativeWind dark mode synchronously before paint to avoid
  // a 1-frame flash where dark: classes lag behind inline colors
  useLayoutEffect(() => {
    setColorScheme(effectiveTheme);
  }, [effectiveTheme, setColorScheme]);

  // Android navigation bar color — async native call, no layout impact
  useEffect(() => {
    setNavigationBarTheme(isDark);
  }, [isDark]);

  const [trpcClient] = useState(() => createTRPCClientForProvider());

  // Keep splash screen visible until fonts are ready
  if (!fontsLoaded) return null;

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
