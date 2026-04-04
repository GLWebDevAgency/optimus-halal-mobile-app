/**
 * Loyalty Hooks — All queries require authentication.
 *
 * Each hook accepts an optional `enabled` override so callers can
 * disable queries when the user is a guest (no account = no loyalty data).
 * Default: true — callers MUST pass `enabled: !!user` or similar guard.
 */

import { trpc } from "@/lib/trpc";

export function useLoyaltyBalance(options?: { enabled?: boolean }) {
  return trpc.loyalty.getBalance.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled,
  });
}

export function useAchievements(options?: { enabled?: boolean }) {
  return trpc.loyalty.getAchievements.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  });
}

export function useLeaderboard(limit = 20, options?: { enabled?: boolean }) {
  return trpc.loyalty.getLeaderboard.useQuery(
    { limit },
    {
      staleTime: 1000 * 60 * 5,
      enabled: options?.enabled ?? true,
    }
  );
}

export function useLoyaltyHistory(limit = 20, offset = 0, options?: { enabled?: boolean }) {
  return trpc.loyalty.getHistory.useQuery(
    { limit, offset },
    {
      staleTime: 1000 * 60 * 2,
      enabled: options?.enabled ?? true,
    }
  );
}

export function useRewards(category?: string, options?: { enabled?: boolean }) {
  return trpc.loyalty.getRewards.useQuery(
    { category, limit: 20 },
    {
      staleTime: 1000 * 60 * 10,
      enabled: options?.enabled ?? true,
    }
  );
}

export function useClaimReward() {
  const utils = trpc.useUtils();
  return trpc.loyalty.claimReward.useMutation({
    onSuccess: () => {
      utils.loyalty.getBalance.invalidate();
      utils.loyalty.getRewards.invalidate();
      utils.loyalty.getMyRewards.invalidate();
    },
  });
}

export function useMyRewards(options?: { enabled?: boolean }) {
  return trpc.loyalty.getMyRewards.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}
