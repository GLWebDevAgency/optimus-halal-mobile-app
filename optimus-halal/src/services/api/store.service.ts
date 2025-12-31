/**
 * Store Service - Enterprise-grade Mobile App
 * 
 * Store search, nearby, and management service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// STORE SERVICE
// ============================================

export const storeService = {
  /**
   * Get store details
   */
  async getStore(storeId: string): Promise<Types.StoreWithDetails> {
    return apiClient.mobile.getStore.query({ storeId });
  },

  /**
   * Search stores
   */
  async searchStores(
    query: string,
    pagination?: Types.PaginationInput,
    filters?: {
      storeType?: Types.StoreType;
      halalCertifiedOnly?: boolean;
      openNow?: boolean;
    }
  ): Promise<{
    stores: Types.Store[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.searchStores.query({
      query,
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Get nearby stores
   */
  async getNearbyStores(input: Types.NearbyStoresInput): Promise<{
    stores: (Types.Store & { distance: number })[];
  }> {
    return apiClient.mobile.getNearbyStores.query(input);
  },

  /**
   * Subscribe to store updates
   */
  async subscribeToStore(storeId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.subscribeToStore.mutate({ storeId });
  },

  /**
   * Unsubscribe from store
   */
  async unsubscribeFromStore(storeId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.unsubscribeFromStore.mutate({ storeId });
  },

  /**
   * Get subscribed stores
   */
  async getSubscribedStores(): Promise<{ stores: Types.Store[] }> {
    return apiClient.mobile.getSubscribedStores.query();
  },
};

export default storeService;
