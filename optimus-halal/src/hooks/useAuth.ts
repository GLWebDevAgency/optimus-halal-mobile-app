import { trpc } from "@/lib/trpc";
import { setTokens, clearTokens } from "@services/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { identifyUser, resetUser, trackEvent } from "@/lib/analytics";
import { setUserContext, clearSentryUser } from "@/lib/sentry";
import { useLocalAuthStore } from "@/store";
import { identifyUser as identifyPurchasesUser, logoutPurchases } from "@/services/purchases";
import { syncLocalDataToCloud } from "@/services/sync-local-data";
import { logger } from "@/lib/logger";

export function useMe(options?: { enabled?: boolean }) {
  return trpc.auth.me.useQuery(undefined, {
    retry: 1,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 min
    enabled: options?.enabled ?? true,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });

      // PostHog: merge anonymous session into identified user
      identifyUser(data.user.id, {
        email: data.user.email,
        display_name: data.user.displayName,
        tier: "premium",
      });
      // Sentry: tag crash reports with user identity
      setUserContext(data.user.id, data.user.email);
      trackEvent("login", { method: "email" });

      // RevenueCat: link anonymous purchase to identified user.
      // Recovers orphaned purchases from "paid but quit before signup" scenario.
      identifyPurchasesUser(data.user.id).catch((e) =>
        logger.warn("Auth", "RevenueCat identify on login failed", String(e))
      );

      // Merge guest local data -> cloud (fire-and-forget, non-blocking)
      syncLocalDataToCloud().catch((e) =>
        logger.warn("Auth", "Local data sync on login failed", String(e))
      );
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });

      identifyUser(data.user.id, {
        email: data.user.email,
        display_name: data.user.displayName,
        tier: "premium",
      });
      setUserContext(data.user.id, data.user.email);
      trackEvent("signup_completed", { method: "email" });

      // RevenueCat: link anonymous purchase to new account.
      // Critical for post-payment signup flow — links $RCAnonymousID to userId.
      identifyPurchasesUser(data.user.id).catch((e) =>
        logger.warn("Auth", "RevenueCat identify on register failed", String(e))
      );

      // Merge guest local data -> cloud (fire-and-forget, non-blocking)
      syncLocalDataToCloud().catch((e) =>
        logger.warn("Auth", "Local data sync on register failed", String(e))
      );
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      trackEvent("logout");

      // 1. Cancel all in-flight queries immediately to prevent
      //    stale responses from repopulating the cache after clear
      queryClient.cancelQueries();

      // 2. Clear tokens (in-memory + SecureStore, fault-tolerant)
      await clearTokens();

      // 3. Clear React Query cache — MUST run even if clearTokens had issues
      queryClient.clear();

      // 4. Clear persisted Zustand auth store (MMKV)
      useLocalAuthStore.getState().logout();

      // 5. Analytics cleanup
      resetUser();
      clearSentryUser();

      // 6. RevenueCat: reset to anonymous — new anonymous ID generated
      logoutPurchases().catch((e) =>
        logger.warn("Auth", "RevenueCat logout failed", String(e))
      );
    },
  });
}

export function useRequestPasswordReset() {
  return trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      trackEvent("password_reset_requested");
    },
  });
}

export function useResetPassword() {
  return trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      trackEvent("password_reset_completed");
    },
  });
}
