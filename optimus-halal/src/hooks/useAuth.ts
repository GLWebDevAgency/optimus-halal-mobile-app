import { trpc } from "@/lib/trpc";
import { setTokens, clearTokens } from "@services/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { identifyUser, resetUser, trackEvent } from "@/lib/analytics";
import { setUserContext, clearSentryUser } from "@/lib/sentry";
import { useLocalAuthStore } from "@/store";

export function useMe(options?: { enabled?: boolean }) {
  return trpc.auth.me.useQuery(undefined, {
    retry: false,
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
    },
  });
}

export function useRequestPasswordReset() {
  return trpc.auth.requestPasswordReset.useMutation();
}

export function useResetPassword() {
  return trpc.auth.resetPassword.useMutation();
}
