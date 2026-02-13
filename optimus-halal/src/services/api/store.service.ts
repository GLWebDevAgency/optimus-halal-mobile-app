/**
 * Store Service — Mobile BFF adapter
 *
 * BFF routes: store.search, store.nearby, store.getById,
 *             store.subscribe, store.unsubscribe, store.getSubscriptions
 */

import { apiClient } from './client';
import type * as Types from './types';

export const storeService = {
  async getStore(storeId: string): Promise<Types.StoreWithDetails> {
    const result = await apiClient.store.getById.query({ id: storeId });
    return result as Types.StoreWithDetails;
  },

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
    const result = await apiClient.store.search.query({
      query,
      limit: pagination?.limit ?? 20,
      ...filters,
    });

    return {
      stores: (result.stores ?? []) as Types.Store[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.stores?.length ?? 0,
        totalPages: 1,
        hasNext: (result.stores?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async getNearbyStores(
    input: Types.NearbyStoresInput
  ): Promise<{ stores: (Types.Store & { distance: number })[] }> {
    const result = await apiClient.store.nearby.query(input);
    return { stores: (result as any).stores ?? result ?? [] };
  },

  async subscribeToStore(storeId: string): Promise<Types.SuccessResponse> {
    await apiClient.store.subscribe.mutate({ storeId });
    return { success: true };
  },

  async unsubscribeFromStore(storeId: string): Promise<Types.SuccessResponse> {
    await apiClient.store.unsubscribe.mutate({ storeId });
    return { success: true };
  },

  async getSubscribedStores(): Promise<{ stores: Types.Store[] }> {
    const stores = await apiClient.store.getSubscriptions.query();
    return { stores: stores as Types.Store[] };
  },
};

export default storeService;
