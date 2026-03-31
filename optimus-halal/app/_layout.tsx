/**
 * Root Layout - Expo Router
 * 
 * Configuration globale de l'application
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import "../global.css";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AppState,
  I18nManager,
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { useLanguageStore, useQuotaStore, useTrialStore, useOnboardingStore } from "@/store";
import { useTheme, useTranslation } from "@/hooks";
import { initializeTokens, isAuthenticated as hasStoredTokens, clearTokens, setApiLanguage, setOnAuthFailure } from "@/services/api";
import { DevScanSeeder } from "@/utils/seed-scan-history";
import { useMe } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { isRTL as isRTLLanguage } from "@/i18n";
import { trpc, createTRPCClientForProvider } from "@/lib/trpc";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui";
import { logger } from "@/lib/logger";
import { initPurchases, logoutPurchases } from "@/services/purchases";
import { useRemoteFlags } from "@/hooks/useRemoteFlags";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { initSentry, setGuestContext, setUserContext, clearSentryUser } from "../src/lib/sentry";
import { initAnalytics, identifyUser, setSuperProperties, resetUser } from "../src/lib/analytics";
import { getDeviceId } from "@/services/api/client";
import { setNavigationBarTheme } from "@/lib/navigationBar";
import {
  useFonts as useNunitoFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import {
  useFonts as useNunitoSansFonts,
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_900Black,
} from "@expo-google-fonts/nunito-sans";

// ── Auth Context — single source of truth for auth state across all screens ──
// Pattern: Clerk / NextAuth / Firebase Auth — one provider, consumed everywhere.
// Eliminates stale hasStoredTokens() reads and duplicate useMe() calls.
type AuthUser = NonNullable<ReturnType<typeof useMe>["data"]>;

interface AuthContextValue {
  user: AuthUser | null;
  isGuest: boolean;
  isAuthLoading: boolean;
  isAuthError: boolean;
  refetchAuth: () => Promise<unknown>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isGuest: true,
  isAuthLoading: true,
  isAuthError: false,
  refetchAuth: () => Promise.resolve(),
});

export function useAuth() {
  return React.useContext(AuthContext);
}

initSentry();
initAnalytics();

// ── Pause React Query polling when app is backgrounded ────
// Without this, refetchInterval keeps firing in the background,
// wasting battery and data. Also triggers a refetch on foreground.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state) => {
    handleFocus(state === "active");
  });
  return () => sub.remove();
});

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
        <Pressable onPress={onClose}>
          <Text style={{ color: "#fff", fontSize: 16 }}>{t.common.close}</Text>
        </Pressable>
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
  const [splashDone, setSplashDone] = useState(false);
  const initCalled = useRef(false);
  const nativeSplashHidden = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hide native splash immediately on mount — AnimatedSplash takes over
  useEffect(() => {
    if (!nativeSplashHidden.current) {
      nativeSplashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

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

    // Reset quota counter if new day (anonymous scan limit)
    useQuotaStore.getState().resetIfNewDay();

    // Auto-start trial for existing users who completed onboarding
    // before the trial feature was added (migration edge case)
    if (!useTrialStore.getState().hasTrialStarted()) {
      if (useOnboardingStore.getState().hasCompletedOnboarding) {
        useTrialStore.getState().startTrial();
      }
    }

    // DEV: scan seeding is now handled by <DevScanSeeder /> in the JSX tree

    // Initialize RevenueCat (works anonymously, identified after login)
    initPurchases().catch((e) => logger.warn("AppInit", "RevenueCat init failed", String(e)));

    // Set Sentry guest context + PostHog super properties with device ID
    getDeviceId().then((deviceId) => {
      setGuestContext(deviceId);
      setSuperProperties({
        app_version: "1.0.0",
        tier: "guest",
      });
    }).catch(() => {});

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

  // ── Auth context value — reactive, single source of truth ──
  const authValue = useMemo<AuthContextValue>(() => {
    const hasTokens = tokensReady && hasStoredTokens();
    const isLoading = !tokensReady || (hasTokens && meQuery.isLoading);
    // Guest = auth fully resolved AND no user data AND no stored tokens.
    // If tokens exist but meQuery failed/hasn't resolved, user is NOT guest —
    // they're in an error/loading state. This prevents flash-of-guest-UI.
    const isGuest = !isLoading && !meQuery.data && !hasTokens;
    return {
      user: (meQuery.data as AuthUser | undefined) ?? null,
      isGuest,
      isAuthLoading: isLoading,
      isAuthError: meQuery.isError,
      refetchAuth: meQuery.refetch,
    };
  }, [tokensReady, meQuery.data, meQuery.isLoading, meQuery.isError, meQuery.refetch]);

  // ── Force-logout: expired subscription ──
  // If tokens exist but RevenueCat says not premium and meQuery resolved
  // with a user → subscription expired, force logout to prevent stale access.
  const { isPremium, isLoading: premiumLoading } = usePremium();

  useEffect(() => {
    if (premiumLoading) return;
    const hasTokens = tokensReady && hasStoredTokens();
    if (hasTokens && !isPremium && !meQuery.isLoading && meQuery.data) {
      logger.warn("Auth", "Subscription expired — force logout");
      clearTokens();
      queryClient.clear();
      resetUser();
      clearSentryUser();
      logoutPurchases().catch(() => {});
    }
  }, [tokensReady, isPremium, premiumLoading, meQuery.data, meQuery.isLoading]);

  // Step 3: Fetch remote feature flags (after auth resolves)
  // Enabled for authenticated users only — guests use hardcoded defaults.
  // Polls every 5min, persists to MMKV for instant next startup.
  useRemoteFlags({ enabled: !!meQuery.data });

  // Step 4: Register push token once auth state resolves
  // Guest → saves to devices table (no email needed for nudges)
  // Registered → saves to push_tokens table
  usePushNotifications({ isGuest: authValue.isGuest, isAuthLoading: authValue.isAuthLoading });

  // Upgrade Sentry + PostHog context when returning user is identified
  useEffect(() => {
    if (meQuery.data) {
      const user = meQuery.data;
      setUserContext(user.id, user.email);
      identifyUser(user.id, {
        email: user.email,
        display_name: user.displayName,
        tier: "premium",
      });
      setSuperProperties({ tier: "premium" });
    }
  }, [meQuery.data]);

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

  // AnimatedSplash exit callback
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const handleLongPress = useCallback(() => setShowDebug(true), []);

  if (showDebug) {
    return <DebugOverlay onClose={() => setShowDebug(false)} />;
  }

  // If timed out, show debug info + option to continue
  if (timedOut && isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: initIsDark ? "#0C0C0C" : "#f3f1ed", padding: 24, paddingTop: 60 }}>
        <Text style={{ color: "#ef4444", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          {t.common.initTooLong}
        </Text>
        <Text style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
          {t.common.initTooLongDesc.replace("{{seconds}}", String(INIT_TIMEOUT_MS / 1000))}
        </Text>
        <PressableScale
          onPress={() => setShowDebug(true)}
        >
          <View style={{ backgroundColor: "#16a34a", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
              {t.common.viewLogs}
            </Text>
          </View>
        </PressableScale>
        <PressableScale
          onPress={() => {
            setForceReady(true);
            setTimedOut(false);
            setSplashDone(true);
          }}
        >
          <View style={{ backgroundColor: "#333", padding: 12, borderRadius: 8 }}>
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {t.common.continueAnyway}
            </Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {__DEV__ && !isInitializing && <DevScanSeeder isAuthenticated={!!meQuery.data} />}
      {children}
      {/* AnimatedSplash overlays content — renders on top, exits when ready */}
      {!splashDone && (
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={3000}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <AnimatedSplash
            isReady={!isInitializing}
            onFinish={handleSplashFinish}
          />
        </Pressable>
      )}
    </AuthContext.Provider>
  );
}

// ============================================
// ROOT LAYOUT
// ============================================

export default function RootLayout() {
  const { isDark, effectiveTheme } = useTheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const [nunitoSansLoaded] = useNunitoSansFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_900Black,
  });

  const fontsLoaded = nunitoLoaded && nunitoSansLoaded;

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
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDark ? '#0C0C0C' : '#f3f1ed' }}>
              <AppInitializer>
                <StatusBar style={isDark ? "light" : "dark"} />
                <OfflineBanner />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 300,
                    gestureEnabled: true,
                    contentStyle: { backgroundColor: isDark ? '#0C0C0C' : '#f3f1ed' },
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
                  <Stack.Screen
                    name="paywall"
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
