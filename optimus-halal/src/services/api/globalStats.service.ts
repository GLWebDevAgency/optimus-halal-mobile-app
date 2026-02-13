/**
 * Global Stats Service — Mobile BFF adapter
 *
 * BFF routes: stats.global
 */

import { apiClient } from './client';
import type * as Types from './types';

export const globalStatsService = {
  async getGlobalStats(): Promise<Types.GlobalStats> {
    return apiClient.stats.global.query() as Promise<Types.GlobalStats>;
  },
};

export default globalStatsService;
