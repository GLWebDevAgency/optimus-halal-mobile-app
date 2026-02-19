import { useCallback, useMemo } from "react";
import { useFeatureFlagsStore } from "@/store";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

type PremiumTier = "free" | "premium";

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  tier: PremiumTier;
  expiresAt: Date | null;
  provider: string | null;
  showPaywall: () => void;
}

export function usePremium(): PremiumState {
  const { flags } = useFeatureFlagsStore();

  // Flag OFF = free tier, zero API calls
  const statusQuery = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: flags.paymentsEnabled,
    staleTime: 5 * 60 * 1000, // 5min cache
  });

  const showPaywall = useCallback(() => {
    if (flags.paymentsEnabled && flags.paywallEnabled) {
      router.push("/settings/premium" as any);
    }
  }, [flags.paymentsEnabled, flags.paywallEnabled]);

  return useMemo(() => {
    if (!flags.paymentsEnabled) {
      return {
        isPremium: false,
        isLoading: false,
        tier: "free",
        expiresAt: null,
        provider: null,
        showPaywall,
      };
    }

    const data = statusQuery.data;
    return {
      isPremium: data?.tier === "premium",
      isLoading: statusQuery.isLoading,
      tier: (data?.tier ?? "free") as PremiumTier,
      expiresAt: data?.expiresAt ? new Date(data.expiresAt) : null,
      provider: data?.provider ?? null,
      showPaywall,
    };
  }, [flags.paymentsEnabled, statusQuery.data, statusQuery.isLoading, showPaywall]);
}
