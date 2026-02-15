/**
 * Product Service — Mobile BFF adapter
 *
 * BFF routes: product.getById, product.getByBarcode,
 *             product.search, product.getCategories,
 *             product.getAlternatives
 */

import { apiClient } from './client';
import type * as Types from './types';

export const productService = {
  async getProduct(productId: string): Promise<{
    product: Types.Product | null;
    certifier: Types.CertifierInfo | null;
    category: { id: string; name: string } | null;
    hasActiveAlerts: boolean;
  }> {
    const result = await apiClient.product.getById.query({ id: productId });
    const product = result as Types.Product | null;
    return {
      product,
      certifier: product?.certifierId
        ? {
            id: product.certifierId,
            name: product.certifierName ?? '',
            logo: product.certifierLogo ?? null,
            isVerified: true,
          }
        : null,
      category:
        product?.categoryId && product?.category
          ? { id: product.categoryId, name: product.category }
          : null,
      hasActiveAlerts: false,
    };
  },

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
    // Backend returns { items, total }, not { products, total }
    const result = await apiClient.product.search.query({
      query,
      limit: pagination?.limit ?? 20,
      ...filters,
    });

    return {
      products: (result.items ?? []) as Types.Product[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.total ?? result.items?.length ?? 0,
        totalPages: Math.ceil(
          (result.total ?? result.items?.length ?? 0) /
            (pagination?.limit ?? 20)
        ),
        hasNext: (result.items?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async getTrendingProducts(
    limit: number = 10
  ): Promise<{ products: Types.Product[] }> {
    // Not available in BFF — stub
    return { products: [] };
  },

  async getProductAlternatives(
    productId: string,
    limit: number = 5
  ): Promise<{ alternatives: Types.ProductAlternative[] }> {
    // Backend expects { productId }, not { id }
    const result = await apiClient.product.getAlternatives.query({
      productId,
      limit,
    });
    return {
      alternatives: (result as any[]).map((alt: any) => ({
        ...alt,
        similarityScore: alt.similarityScore ?? 0,
      })),
    };
  },

  async getCategories(): Promise<{
    categories: {
      id: string;
      name: string;
      parentId?: string | null;
      imageUrl?: string | null;
    }[];
  }> {
    const categories = await apiClient.product.getCategories.query();
    return { categories: categories as any[] };
  },
};

export default productService;
