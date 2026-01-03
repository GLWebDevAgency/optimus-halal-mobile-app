/**
 * Profile Service - gRPC-Web Client
 * 
 * Handles user profile management, preferences, addresses
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient, GrpcApiError, GrpcStatus } from './client';
import { SERVICES } from './types';
import type {
  UserProfile,
  GetProfileRequest,
  UpdateProfileRequest,
  GetPreferencesRequest,
  UpdatePreferencesRequest,
  UserPreferences,
  GetAddressesRequest,
  AddressListResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  DeleteAddressRequest,
  SetDefaultAddressRequest,
  UserAddress,
  GetUserStatsRequest,
  UserStats,
  GetActivitySummaryRequest,
  ActivitySummary,
  DeleteProfileRequest,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Profile Service client for React Native
 * 
 * Usage:
 * ```typescript
 * import { profileService } from '@/services/grpc';
 * 
 * // Get profile
 * const profile = await profileService.getProfile({ userId: 'xxx' });
 * 
 * // Update profile
 * const updated = await profileService.updateProfile({
 *   userId: 'xxx',
 *   displayName: 'John Doe',
 * });
 * ```
 */
class ProfileService {
  private readonly service = SERVICES.PROFILE;

  /**
   * Get user profile
   */
  async getProfile(request: GetProfileRequest): Promise<UserProfile> {
    return grpcClient.unary<GetProfileRequest, UserProfile>(
      this.service,
      'GetProfile',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Update user profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    return grpcClient.unary<UpdateProfileRequest, UserProfile>(
      this.service,
      'UpdateProfile',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Delete user profile
   */
  async deleteProfile(request: DeleteProfileRequest): Promise<void> {
    await grpcClient.unary<DeleteProfileRequest, Record<string, never>>(
      this.service,
      'DeleteProfile',
      request,
      { timeout: TIMEOUTS.default, retryEnabled: false }
    );
  }

  /**
   * Get user preferences
   */
  async getPreferences(request: GetPreferencesRequest): Promise<UserPreferences> {
    return grpcClient.unary<GetPreferencesRequest, UserPreferences>(
      this.service,
      'GetPreferences',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Update user preferences
   */
  async updatePreferences(request: UpdatePreferencesRequest): Promise<UserPreferences> {
    return grpcClient.unary<UpdatePreferencesRequest, UserPreferences>(
      this.service,
      'UpdatePreferences',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get user addresses
   */
  async getAddresses(request: GetAddressesRequest): Promise<AddressListResponse> {
    return grpcClient.unary<GetAddressesRequest, AddressListResponse>(
      this.service,
      'ListAddresses',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Create new address
   */
  async createAddress(request: CreateAddressRequest): Promise<UserAddress> {
    return grpcClient.unary<CreateAddressRequest, UserAddress>(
      this.service,
      'CreateAddress',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Update address
   */
  async updateAddress(request: UpdateAddressRequest): Promise<UserAddress> {
    return grpcClient.unary<UpdateAddressRequest, UserAddress>(
      this.service,
      'UpdateAddress',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Delete address
   */
  async deleteAddress(request: DeleteAddressRequest): Promise<void> {
    await grpcClient.unary<DeleteAddressRequest, Record<string, never>>(
      this.service,
      'DeleteAddress',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Set default address
   */
  async setDefaultAddress(request: SetDefaultAddressRequest): Promise<UserAddress> {
    return grpcClient.unary<SetDefaultAddressRequest, UserAddress>(
      this.service,
      'SetDefaultAddress',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get user stats (gamification)
   */
  async getUserStats(request: GetUserStatsRequest): Promise<UserStats> {
    return grpcClient.unary<GetUserStatsRequest, UserStats>(
      this.service,
      'GetUserStats',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(request: GetActivitySummaryRequest): Promise<ActivitySummary> {
    return grpcClient.unary<GetActivitySummaryRequest, ActivitySummary>(
      this.service,
      'GetActivitySummary',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const profileService = new ProfileService();
export default profileService;
