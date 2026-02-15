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
