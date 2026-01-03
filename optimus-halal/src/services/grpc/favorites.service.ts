/**
 * Favorites Service - gRPC-Web Client
 * 
 * Handles user favorites management: add/remove favorites, folders
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient } from './client';
import { SERVICES } from './types';
import type {
  GetFavoritesRequest,
  FavoritesListResponse,
  AddFavoriteRequest,
  RemoveFavoriteRequest,
  Favorite,
  GetFoldersRequest,
  FoldersListResponse,
  CreateFolderRequest,
  UpdateFolderRequest,
  DeleteFolderRequest,
  FavoriteFolder,
  MoveFavoriteRequest,
  CheckFavoriteRequest,
  CheckFavoriteResponse,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Favorites Service client for React Native
 */
class FavoritesService {
  private readonly service = SERVICES.FAVORITES;

  /**
   * Get user favorites with optional pagination and folder filter
   */
  async getFavorites(request: GetFavoritesRequest): Promise<FavoritesListResponse> {
    return grpcClient.unary<GetFavoritesRequest, FavoritesListResponse>(
      this.service,
      'GetFavorites',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Add product to favorites
   */
  async addFavorite(request: AddFavoriteRequest): Promise<Favorite> {
    return grpcClient.unary<AddFavoriteRequest, Favorite>(
      this.service,
      'AddFavorite',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Remove product from favorites
   */
  async removeFavorite(request: RemoveFavoriteRequest): Promise<void> {
    await grpcClient.unary<RemoveFavoriteRequest, Record<string, never>>(
      this.service,
      'RemoveFavorite',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Check if product is in favorites
   */
  async checkFavorite(request: CheckFavoriteRequest): Promise<CheckFavoriteResponse> {
    return grpcClient.unary<CheckFavoriteRequest, CheckFavoriteResponse>(
      this.service,
      'CheckFavorite',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get user folders
   */
  async getFolders(request: GetFoldersRequest): Promise<FoldersListResponse> {
    return grpcClient.unary<GetFoldersRequest, FoldersListResponse>(
      this.service,
      'GetFolders',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Create new folder
   */
  async createFolder(request: CreateFolderRequest): Promise<FavoriteFolder> {
    return grpcClient.unary<CreateFolderRequest, FavoriteFolder>(
      this.service,
      'CreateFolder',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Update folder
   */
  async updateFolder(request: UpdateFolderRequest): Promise<FavoriteFolder> {
    return grpcClient.unary<UpdateFolderRequest, FavoriteFolder>(
      this.service,
      'UpdateFolder',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Delete folder
   */
  async deleteFolder(request: DeleteFolderRequest): Promise<void> {
    await grpcClient.unary<DeleteFolderRequest, Record<string, never>>(
      this.service,
      'DeleteFolder',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Move favorite to another folder
   */
  async moveFavorite(request: MoveFavoriteRequest): Promise<Favorite> {
    return grpcClient.unary<MoveFavoriteRequest, Favorite>(
      this.service,
      'MoveFavorite',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;
