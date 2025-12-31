/**
 * Product Service - Enterprise-grade Mobile App
 * 
 * Product search, details, and categories service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// PRODUCT SERVICE
// ============================================

export const productService = {
  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<{
    product: Types.Product | null;
    certifier: Types.CertifierInfo | null;
    category: { id: string; name: string } | null;
    hasActiveAlerts: boolean;
  }> {
    return apiClient.mobile.getProduct.query({ productId });
  },

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    pagination?: Types.PaginationInput,
    filters?: {
      categoryId?: string;
      halalStatus?: Types.HalalStatus;
      certified?: boolean;
    }
  ): Promise<{
    products: Types.Product[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.searchProducts.query({
      query,
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 10): Promise<{ products: Types.Product[] }> {
    return apiClient.mobile.getTrendingProducts.query({ limit });
  },

  /**
   * Get product alternatives
   */
  async getProductAlternatives(productId: string, limit: number = 5): Promise<{
    alternatives: Types.ProductAlternative[];
  }> {
    return apiClient.mobile.getProductAlternatives.query({ productId, limit });
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<{
    categories: Array<{
      id: string;
      name: string;
      parentId?: string | null;
      imageUrl?: string | null;
    }>;
  }> {
    return apiClient.mobile.getCategories.query();
  },
};

export default productService;
