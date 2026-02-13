/**
 * Favorites Service — Mobile BFF adapter
 *
 * BFF routes: favorites.list, favorites.add, favorites.remove,
 *             favorites.moveToFolder, favorites.listFolders,
 *             favorites.createFolder, favorites.updateFolder,
 *             favorites.deleteFolder
 */

import { apiClient } from './client';
import type * as Types from './types';

export const favoritesService = {
  async getFavorites(
    pagination?: Types.PaginationInput,
    folderId?: string
  ): Promise<{
    favorites: Types.Favorite[];
    pagination: Types.PaginationOutput;
  }> {
    // Backend uses offset (not cursor) and returns array directly
    const result = await apiClient.favorites.list.query({
      limit: pagination?.limit ?? 20,
      offset: 0,
      folderId,
    });

    return {
      favorites: (result ?? []) as unknown as Types.Favorite[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result?.length ?? 0,
        totalPages: 1,
        hasNext: (result?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async addFavorite(input: Types.AddFavoriteInput): Promise<Types.Favorite> {
    const result = await apiClient.favorites.add.mutate(input);
    return result as unknown as Types.Favorite;
  },

  async removeFavorite(favoriteId: string): Promise<Types.SuccessResponse> {
    // BFF remove takes productId — use favoriteId as productId fallback
    await apiClient.favorites.remove.mutate({ productId: favoriteId });
    return { success: true };
  },

  async isFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    // Not a dedicated BFF endpoint — check via list
    try {
      const result = await apiClient.favorites.list.query({ limit: 100 });
      const found = (result ?? []).some(
        (f: { productId: string }) => f.productId === productId
      );
      return { isFavorite: found };
    } catch {
      return { isFavorite: false };
    }
  },

  async getFolders(): Promise<{ folders: Types.FavoriteFolder[] }> {
    const folders = await apiClient.favorites.listFolders.query();
    return { folders: folders as unknown as Types.FavoriteFolder[] };
  },

  async createFolder(
    input: Types.CreateFolderInput
  ): Promise<Types.FavoriteFolder> {
    const result = await apiClient.favorites.createFolder.mutate(input);
    return result as unknown as Types.FavoriteFolder;
  },

  async updateFolder(
    folderId: string,
    input: Partial<Types.CreateFolderInput>
  ): Promise<Types.SuccessResponse> {
    await apiClient.favorites.updateFolder.mutate({ id: folderId, ...input });
    return { success: true };
  },

  async deleteFolder(folderId: string): Promise<Types.SuccessResponse> {
    await apiClient.favorites.deleteFolder.mutate({ id: folderId });
    return { success: true };
  },
};

export default favoritesService;
