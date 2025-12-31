/**
 * Favorites Service - Enterprise-grade Mobile App
 * 
 * Favorites and folders management service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// FAVORITES SERVICE
// ============================================

export const favoritesService = {
  /**
   * Get favorites with pagination
   */
  async getFavorites(
    pagination?: Types.PaginationInput,
    folderId?: string
  ): Promise<{
    favorites: Types.Favorite[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getFavorites.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      folderId,
    });
  },

  /**
   * Add product to favorites
   */
  async addFavorite(input: Types.AddFavoriteInput): Promise<Types.Favorite> {
    return apiClient.mobile.addFavorite.mutate(input);
  },

  /**
   * Remove from favorites
   */
  async removeFavorite(favoriteId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.removeFavorite.mutate({ favoriteId });
  },

  /**
   * Check if product is favorite
   */
  async isFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    return apiClient.mobile.isFavorite.query({ productId });
  },

  /**
   * Get all folders
   */
  async getFolders(): Promise<{ folders: Types.FavoriteFolder[] }> {
    return apiClient.mobile.getFolders.query();
  },

  /**
   * Create a new folder
   */
  async createFolder(input: Types.CreateFolderInput): Promise<Types.FavoriteFolder> {
    return apiClient.mobile.createFolder.mutate(input);
  },

  /**
   * Update folder
   */
  async updateFolder(
    folderId: string,
    input: Partial<Types.CreateFolderInput>
  ): Promise<Types.SuccessResponse> {
    return apiClient.mobile.updateFolder.mutate({ folderId, ...input });
  },

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.deleteFolder.mutate({ folderId });
  },
};

export default favoritesService;
