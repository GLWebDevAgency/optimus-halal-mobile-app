/**
 * Global Stats Service - Enterprise-grade Mobile App
 * 
 * Global statistics for social proof
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// GLOBAL STATS SERVICE
// ============================================

export const globalStatsService = {
  /**
   * Get global statistics
   */
  async getGlobalStats(): Promise<Types.GlobalStats> {
    return apiClient.mobile.getGlobalStats.query();
  },
};

export default globalStatsService;
