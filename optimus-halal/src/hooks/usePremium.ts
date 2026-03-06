import { useCallback, useEffect, useMemo, useState } from "react";
import { useFeatureFlagsStore } from "@/store";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { getCustomerInfo, isPremiumCustomer, onCustomerInfoUpdated } from "@/services/purchases";
import { useMe } from "@/hooks/useAuth";

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
  const hasTokens = hasStoredTokens();
  const meQuery = useMe({ enabled: hasTokens });
  const isGuest = !hasTokens && !meQuery.data;

  // RevenueCat local entitlement (works for both anonymous & identified users)
  const [rcPremium, setRcPremium] = useState(false);

  useEffect(() => {
    if (!flags.paymentsEnabled) return;

    // Check on mount
    getCustomerInfo().then((info) => {
      if (info) setRcPremium(isPremiumCustomer(info));
    }).catch(() => {});

    // Listen for changes (renewals, cancellations)
    const unsubscribe = onCustomerInfoUpdated((info) => {
      setRcPremium(isPremiumCustomer(info));
    });

    return unsubscribe;
  }, [flags.paymentsEnabled]);

  // Backend check (only for authenticated users — their subscription state)
  const statusQuery = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: flags.paymentsEnabled && !isGuest,
    staleTime: 5 * 60 * 1000,
  });

  const showPaywall = useCallback(() => {
    if (flags.paymentsEnabled && flags.paywallEnabled) {
      router.push("/paywall" as any);
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

    // RevenueCat is the source of truth for entitlement
    const backendData = statusQuery.data;
    const premium = rcPremium || backendData?.tier === "premium";

    return {
      isPremium: premium,
      isLoading: !isGuest && statusQuery.isLoading,
      tier: premium ? "premium" : "free",
      expiresAt: backendData?.expiresAt ? new Date(backendData.expiresAt) : null,
      provider: backendData?.provider ?? (rcPremium ? "revenuecat" : null),
      showPaywall,
    };
  }, [flags.paymentsEnabled, statusQuery.data, statusQuery.isLoading, rcPremium, isGuest, showPaywall]);
}
