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
    const result = await apiClient.favorites.list.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
      folderId,
    });

    return {
      favorites: (result.favorites ?? []) as Types.Favorite[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.favorites?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async addFavorite(input: Types.AddFavoriteInput): Promise<Types.Favorite> {
    return apiClient.favorites.add.mutate(input) as Promise<Types.Favorite>;
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
      const found = (result.favorites ?? []).some(
        (f: any) => f.productId === productId
      );
      return { isFavorite: found };
    } catch {
      return { isFavorite: false };
    }
  },

  async getFolders(): Promise<{ folders: Types.FavoriteFolder[] }> {
    const folders = await apiClient.favorites.listFolders.query();
    return { folders: folders as Types.FavoriteFolder[] };
  },

  async createFolder(
    input: Types.CreateFolderInput
  ): Promise<Types.FavoriteFolder> {
    return apiClient.favorites.createFolder.mutate(
      input
    ) as Promise<Types.FavoriteFolder>;
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
