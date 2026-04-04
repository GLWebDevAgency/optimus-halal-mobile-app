import { trpc } from "@/lib/trpc";
import { setTokens, clearTokens } from "@services/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { identifyUser, resetUser, trackEvent } from "@/lib/analytics";
import { setUserContext, clearSentryUser } from "@/lib/sentry";
import {
  useLocalAuthStore,
  useLocalFavoritesStore,
  useLocalStoreFavoritesStore,
  useLocalScanHistoryStore,
  useQuotaStore,
} from "@/store";
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

      identifyUser(data.user.id, {
        email: data.user.email,
        display_name: data.user.displayName,
        tier: "premium",
      });
      setUserContext(data.user.id, data.user.email);
      trackEvent("login", { method: "email" });

      identifyPurchasesUser(data.user.id).catch((e) =>
        logger.warn("Auth", "RevenueCat identify on login failed", String(e))
      );

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

      identifyPurchasesUser(data.user.id).catch((e) =>
        logger.warn("Auth", "RevenueCat identify on register failed", String(e))
      );

      syncLocalDataToCloud().catch((e) =>
        logger.warn("Auth", "Local data sync on register failed", String(e))
      );
    },
  });
}

/**
 * Full session cleanup — shared between logout and delete account.
 *
 * Clears ALL user-specific data:
 * - Tokens (in-memory + SecureStore)
 * - React Query cache (prevents stale data on next login)
 * - Zustand stores with user-specific data (MMKV)
 * - Analytics identity (PostHog, Sentry)
 * - RevenueCat identity (resets to anonymous)
 *
 * Device-level data is preserved (theme, language, onboarding).
 */
async function performFullCleanup(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  // 1. Cancel in-flight queries to prevent stale re-population
  queryClient.cancelQueries();

  // 2. Clear tokens (in-memory immediate, SecureStore async)
  await clearTokens();

  // 3. Clear React Query cache
  queryClient.clear();

  // 4. Clear user-specific Zustand stores (MMKV persisted)
  //    Device-level stores (theme, language, onboarding) are intentionally kept.
  useLocalAuthStore.getState().logout();
  useLocalFavoritesStore.getState().clear();
  useLocalStoreFavoritesStore.getState().clear();
  useLocalScanHistoryStore.getState().clear();
  useQuotaStore.getState().syncFromServer(0);

  // 5. Analytics cleanup
  resetUser();
  clearSentryUser();

  // 6. RevenueCat: reset to anonymous
  logoutPurchases().catch((e) =>
    logger.warn("Auth", "RevenueCat logout failed", String(e))
  );
}

export function useLogout() {
  const queryClient = useQueryClient();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      trackEvent("logout");
      await performFullCleanup(queryClient);
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

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return trpc.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      trackEvent("account_deleted");
      await performFullCleanup(queryClient);
    },
  });
}
