/**
 * Loyalty Service - Enterprise-grade Mobile App
 * 
 * Loyalty points, rewards, and leaderboard service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// LOYALTY SERVICE
// ============================================

export const loyaltyService = {
  /**
   * Get loyalty account details
   */
  async getLoyaltyAccount(): Promise<Types.LoyaltyAccount> {
    return apiClient.mobile.getLoyaltyAccount.query();
  },

  /**
   * Get loyalty transactions with pagination
   */
  async getLoyaltyTransactions(
    pagination?: Types.PaginationInput,
    type?: Types.TransactionType
  ): Promise<{
    transactions: Types.LoyaltyTransaction[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getLoyaltyTransactions.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      type,
    });
  },

  /**
   * Get available rewards
   */
  async getAvailableRewards(): Promise<{ rewards: Types.LoyaltyReward[] }> {
    return apiClient.mobile.getAvailableRewards.query();
  },

  /**
   * Redeem a reward
   */
  async redeemReward(rewardId: string): Promise<Types.RedeemRewardResponse> {
    return apiClient.mobile.redeemReward.mutate({ rewardId });
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 20): Promise<{
    entries: Types.LeaderboardEntry[];
  }> {
    return apiClient.mobile.getLeaderboard.query({ limit });
  },
};

export default loyaltyService;
