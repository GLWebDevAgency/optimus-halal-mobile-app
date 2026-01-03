/**
 * Store Service - gRPC-Web Client
 * 
 * Handles store/point of sale operations: nearby stores, search, reviews
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient } from './client';
import { SERVICES } from './types';
import type {
  GetNearbyStoresRequest,
  StoreListResponse,
  SearchStoresRequest,
  GetStoreRequest,
  Store,
  GetStoreReviewsRequest,
  ReviewListResponse,
  CreateStoreReviewRequest,
  StoreReview,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Store Service client for React Native
 */
class StoreService {
  private readonly service = SERVICES.STORE;

  /**
   * Get nearby stores based on location
   */
  async getNearbyStores(request: GetNearbyStoresRequest): Promise<StoreListResponse> {
    return grpcClient.unary<GetNearbyStoresRequest, StoreListResponse>(
      this.service,
      'GetNearbyStores',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Search stores by query
   */
  async searchStores(request: SearchStoresRequest): Promise<StoreListResponse> {
    return grpcClient.unary<SearchStoresRequest, StoreListResponse>(
      this.service,
      'SearchStores',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get store details by ID
   */
  async getStore(request: GetStoreRequest): Promise<Store> {
    return grpcClient.unary<GetStoreRequest, Store>(
      this.service,
      'GetStore',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get reviews for a store
   */
  async getStoreReviews(request: GetStoreReviewsRequest): Promise<ReviewListResponse> {
    return grpcClient.unary<GetStoreReviewsRequest, ReviewListResponse>(
      this.service,
      'GetStoreReviews',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Create a review for a store
   */
  async createStoreReview(request: CreateStoreReviewRequest): Promise<StoreReview> {
    return grpcClient.unary<CreateStoreReviewRequest, StoreReview>(
      this.service,
      'CreateStoreReview',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const storeService = new StoreService();
export default storeService;
