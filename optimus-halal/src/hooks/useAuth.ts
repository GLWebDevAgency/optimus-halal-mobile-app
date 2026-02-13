import { trpc } from "@/lib/trpc";
import { setTokens, clearTokens } from "@services/api/client";
import { useQueryClient } from "@tanstack/react-query";

export function useMe() {
  return trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await clearTokens();
      queryClient.clear();
    },
  });
}

export function useRequestPasswordReset() {
  return trpc.auth.requestPasswordReset.useMutation();
}

export function useResetPassword() {
  return trpc.auth.resetPassword.useMutation();
}
