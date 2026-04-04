import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeatureFlagsStore, useTrialStore } from "@/store";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { getCustomerInfo, isPremiumCustomer, onCustomerInfoUpdated } from "@/services/purchases";
import { useMe } from "@/hooks/useAuth";
import type { PaywallTrigger } from "@/types/paywall";

type PremiumTier = "free" | "trial" | "premium";

interface PremiumState {
  /**
   * True when the user has full feature access — either via active trial OR paid subscription.
   * Use this to gate features (scans, favorites, madhab, etc.).
   */
  isPremium: boolean;
  /**
   * True ONLY for paying Naqiy+ subscribers (RevenueCat entitlement or backend tier=premium).
   * Use this to guard paywall screens — trial users should still see the purchase CTA.
   */
  isPaidPremium: boolean;
  /** True until ALL async sources (RC + backend) have resolved at least once. */
  isLoading: boolean;
  tier: PremiumTier;
  expiresAt: Date | null;
  provider: string | null;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  showPaywall: (trigger?: PaywallTrigger) => void;
}

export function usePremium(): PremiumState {
  const { flags } = useFeatureFlagsStore();
  const hasTokens = hasStoredTokens();
  const meQuery = useMe({ enabled: hasTokens });
  const isGuest = !meQuery.data && (!hasTokens || meQuery.isError);

  // ── RevenueCat local entitlement ──
  const [rcPremium, setRcPremium] = useState(false);
  const [rcLoaded, setRcLoaded] = useState(false);

  useEffect(() => {
    if (!flags.paymentsEnabled) {
      setRcLoaded(true);
      return;
    }

    getCustomerInfo()
      .then((info) => {
        if (info) setRcPremium(isPremiumCustomer(info));
      })
      .catch(() => {})
      .finally(() => setRcLoaded(true));

    const unsubscribe = onCustomerInfoUpdated((info) => {
      setRcPremium(isPremiumCustomer(info));
    });

    return unsubscribe;
  }, [flags.paymentsEnabled]);

  // ── Backend subscription status (authenticated users only) ──
  const statusQuery = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: flags.paymentsEnabled && !isGuest,
    staleTime: 5 * 60 * 1000,
  });

  const showPaywall = useCallback((trigger?: PaywallTrigger) => {
    if (flags.paymentsEnabled && flags.paywallEnabled) {
      router.push({
        pathname: "/paywall" as any,
        params: trigger ? { trigger } : undefined,
      });
    }
  }, [flags.paymentsEnabled, flags.paywallEnabled]);

  // ── Trial state (anonymous users only) ──
  // Read raw store values via selector (Zustand-reactive, referentially stable).
  // NEVER call functions like isTrialActive() inside selectors — they read Date.now()
  // and produce unstable return values that cause infinite re-render loops.
  const trialExpiresAt = useTrialStore((s) => s.trialExpiresAt);
  const serverConfirmedExpired = useTrialStore((s) => s.serverConfirmedExpired);

  // Derive trial state from raw values (stable within the same render frame)
  const isTrialActive = useMemo(() => {
    if (serverConfirmedExpired) return false;
    if (!trialExpiresAt) return false;
    return new Date(trialExpiresAt) > new Date();
  }, [trialExpiresAt, serverConfirmedExpired]);

  const trialDaysRemaining = useMemo(() => {
    if (serverConfirmedExpired || !trialExpiresAt) return 0;
    const remaining = new Date(trialExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  }, [trialExpiresAt, serverConfirmedExpired]);

  return useMemo(() => {
    if (!flags.paymentsEnabled) {
      return {
        isPremium: false,
        isPaidPremium: false,
        isLoading: false,
        tier: "free" as const,
        expiresAt: null,
        provider: null,
        isTrialActive: false,
        trialDaysRemaining: 0,
        showPaywall,
      };
    }

    const backendLoading = !isGuest && statusQuery.isLoading;
    const loading = !rcLoaded || backendLoading;

    const backendData = statusQuery.data;
    const paidPremium = rcPremium || backendData?.tier === "premium";
    const premium = paidPremium || isTrialActive;

    const tier: PremiumTier = paidPremium
      ? "premium"
      : isTrialActive
        ? "trial"
        : "free";

    return {
      isPremium: premium,
      isPaidPremium: paidPremium,
      isLoading: loading,
      tier,
      expiresAt: backendData?.expiresAt ? new Date(backendData.expiresAt) : null,
      provider: backendData?.provider ?? (rcPremium ? "revenuecat" : null),
      isTrialActive,
      trialDaysRemaining,
      showPaywall,
    };
  }, [flags.paymentsEnabled, statusQuery.data, statusQuery.isLoading, rcPremium, rcLoaded, isGuest, isTrialActive, trialDaysRemaining, showPaywall]);
}
