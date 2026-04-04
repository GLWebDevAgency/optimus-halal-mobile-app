/**
 * useTrialGuard — Guards premium data stored in MMKV during trial.
 *
 * Trial data is accessible only when:
 * - Trial is active (< 7 days)
 * - User is Naqiy+ premium
 *
 * Post-trial free users get the fallback value — data stays in MMKV
 * for future merge if they subscribe.
 */

import { useMemo } from "react";
import { usePremium } from "./usePremium";

/**
 * Returns true if premium/trial data should be accessible.
 * Use this to guard any consumer of premium-only local data.
 */
export function useCanAccessPremiumData(): boolean {
  const { isPremium } = usePremium();
  return isPremium; // isPremium = paid OR trial — both have full feature access
}

/**
 * Returns the effective madhab — "general" for free post-trial users,
 * the actual value for trial/premium users.
 */
export function useEffectiveMadhab(storedMadhab: string): string {
  const canAccess = useCanAccessPremiumData();
  return useMemo(() => {
    if (!canAccess && storedMadhab !== "general") return "general";
    return storedMadhab;
  }, [canAccess, storedMadhab]);
}
