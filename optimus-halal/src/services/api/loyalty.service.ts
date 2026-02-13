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
    return apiClient.loyalty.getBalance.query() as Promise<Types.LoyaltyAccount>;
  },

  async getLoyaltyTransactions(
    pagination?: Types.PaginationInput,
    type?: Types.TransactionType
  ): Promise<{
    transactions: Types.LoyaltyTransaction[];
    pagination: Types.PaginationOutput;
  }> {
    const result = await apiClient.loyalty.getHistory.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
    });

    return {
      transactions: (result.transactions ?? []) as Types.LoyaltyTransaction[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.transactions?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async getAvailableRewards(): Promise<{
    rewards: Types.LoyaltyReward[];
  }> {
    const rewards = await apiClient.loyalty.getRewards.query();
    return { rewards: rewards as Types.LoyaltyReward[] };
  },

  async redeemReward(rewardId: string): Promise<Types.RedeemRewardResponse> {
    const result = await apiClient.loyalty.claimReward.mutate({ rewardId });
    return {
      success: true,
      rewardCode: (result as any).rewardCode ?? '',
      newBalance: (result as any).newBalance ?? 0,
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
