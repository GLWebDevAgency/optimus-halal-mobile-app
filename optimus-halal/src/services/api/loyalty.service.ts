/**
 * Loyalty Service — Mobile BFF adapter
 *
 * BFF routes: loyalty.getBalance, loyalty.getHistory,
 *             loyalty.getRewards, loyalty.claimReward,
 *             loyalty.getLeaderboard
 */

import { apiClient } from './client';
import type * as Types from './types';

export const loyaltyService = {
  async getLoyaltyAccount(): Promise<Types.LoyaltyAccount> {
    // Backend returns { points, level, experiencePoints }
    // Map to LoyaltyAccount shape
    const result = await apiClient.loyalty.getBalance.query();
    return {
      currentPoints: result.points ?? 0,
      lifetimePoints: result.points ?? 0,
      currentLevel: 'bronze' as Types.LoyaltyLevel,
      rank: 0,
      levelProgress: 0,
      pointsToNextLevel: 0,
      benefits: [],
    };
  },

  async getLoyaltyTransactions(
    pagination?: Types.PaginationInput,
    type?: Types.TransactionType
  ): Promise<{
    transactions: Types.LoyaltyTransaction[];
    pagination: Types.PaginationOutput;
  }> {
    // Backend uses offset (not cursor) and returns array directly
    const result = await apiClient.loyalty.getHistory.query({
      limit: pagination?.limit ?? 20,
      offset: 0,
    });

    return {
      transactions: (result ?? []) as unknown as Types.LoyaltyTransaction[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result?.length ?? 0,
        totalPages: 1,
        hasNext: (result?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async getAvailableRewards(): Promise<{
    rewards: Types.LoyaltyReward[];
  }> {
    // Backend getRewards requires input with optional category/limit
    const rewards = await apiClient.loyalty.getRewards.query({});
    return { rewards: rewards as unknown as Types.LoyaltyReward[] };
  },

  async redeemReward(rewardId: string): Promise<Types.RedeemRewardResponse> {
    const result = await apiClient.loyalty.claimReward.mutate({ rewardId });
    return {
      success: true,
      rewardCode: (result as any).redemptionCode ?? '',
      newBalance: 0,
    };
  },

  async getLeaderboard(
    limit: number = 20
  ): Promise<{ entries: Types.LeaderboardEntry[] }> {
    const result = await apiClient.loyalty.getLeaderboard.query({ limit });
    return { entries: (result as any).entries ?? result ?? [] };
  },
};

export default loyaltyService;
