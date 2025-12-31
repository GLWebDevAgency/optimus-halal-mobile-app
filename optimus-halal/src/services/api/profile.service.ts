/**
 * Profile Service - Enterprise-grade Mobile App
 * 
 * User profile, addresses, and gamification service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// PROFILE SERVICE
// ============================================

export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<Types.UserProfile> {
    return apiClient.mobile.getProfile.query();
  },

  /**
   * Update user profile
   */
  async updateProfile(input: Types.UpdateProfileInput): Promise<Types.SuccessResponse & { profile: Partial<Types.UserProfile> }> {
    return apiClient.mobile.updateProfile.mutate(input);
  },

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<{ addresses: Types.Address[] }> {
    return apiClient.mobile.getAddresses.query();
  },

  /**
   * Add new address
   */
  async addAddress(input: Types.CreateAddressInput): Promise<Types.Address> {
    return apiClient.mobile.addAddress.mutate(input);
  },

  /**
   * Update address
   */
  async updateAddress(addressId: string, input: Partial<Types.CreateAddressInput>): Promise<Types.SuccessResponse> {
    return apiClient.mobile.updateAddress.mutate({ addressId, ...input });
  },

  /**
   * Delete address
   */
  async deleteAddress(addressId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.deleteAddress.mutate({ addressId });
  },

  /**
   * Set default address
   */
  async setDefaultAddress(addressId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.setDefaultAddress.mutate({ addressId });
  },

  /**
   * Get gamification stats
   */
  async getGamificationStats(): Promise<Types.GamificationStats> {
    return apiClient.mobile.getGamificationStats.query();
  },
};

export default profileService;
