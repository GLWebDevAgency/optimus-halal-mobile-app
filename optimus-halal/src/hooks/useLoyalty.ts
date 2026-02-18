import { trpc } from "@/lib/trpc";

export function useLoyaltyBalance() {
  return trpc.loyalty.getBalance.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
}

export function useAchievements() {
  return trpc.loyalty.getAchievements.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
}

export function useLeaderboard(limit = 20) {
  return trpc.loyalty.getLeaderboard.useQuery(
    { limit },
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useLoyaltyHistory(limit = 20, offset = 0) {
  return trpc.loyalty.getHistory.useQuery(
    { limit, offset },
    { staleTime: 1000 * 60 * 2 }
  );
}

export function useRewards(category?: string) {
  return trpc.loyalty.getRewards.useQuery(
    { category, limit: 20 },
    { staleTime: 1000 * 60 * 10 }
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

export function useMyRewards() {
  return trpc.loyalty.getMyRewards.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
}
