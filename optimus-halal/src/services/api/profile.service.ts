/**
 * Profile Service — Mobile BFF adapter
 *
 * BFF routes: profile.getProfile, profile.updateProfile,
 *             profile.getAddresses, profile.addAddress,
 *             profile.updateAddress, profile.deleteAddress,
 *             profile.getGamification
 */

import { apiClient } from './client';
import type * as Types from './types';

export const profileService = {
  async getProfile(): Promise<Types.UserProfile> {
    const profile = await apiClient.profile.getProfile.query();
    // Backend doesn't return badges — provide default
    return { ...profile, badges: [] } as unknown as Types.UserProfile;
  },

  async updateProfile(
    input: Types.UpdateProfileInput
  ): Promise<Types.SuccessResponse & { profile: Partial<Types.UserProfile> }> {
    const result = await apiClient.profile.updateProfile.mutate(input);
    return { success: true, profile: result as Partial<Types.UserProfile> };
  },

  async getAddresses(): Promise<{ addresses: Types.Address[] }> {
    const addresses = await apiClient.profile.getAddresses.query();
    return { addresses: addresses as Types.Address[] };
  },

  async addAddress(input: Types.CreateAddressInput): Promise<Types.Address> {
    return apiClient.profile.addAddress.mutate(input) as Promise<Types.Address>;
  },

  async updateAddress(
    addressId: string,
    input: Partial<Types.CreateAddressInput>
  ): Promise<Types.SuccessResponse> {
    await apiClient.profile.updateAddress.mutate({ id: addressId, ...input });
    return { success: true };
  },

  async deleteAddress(addressId: string): Promise<Types.SuccessResponse> {
    await apiClient.profile.deleteAddress.mutate({ id: addressId });
    return { success: true };
  },

  async setDefaultAddress(addressId: string): Promise<Types.SuccessResponse> {
    await apiClient.profile.updateAddress.mutate({
      id: addressId,
      isDefault: true,
    });
    return { success: true };
  },

  async getGamificationStats(): Promise<Types.GamificationStats> {
    // Backend returns: { level, experiencePoints, totalScans, currentStreak, longestStreak, lastScanDate }
    // Missing: xpForNextLevel, xpProgress, badges, loyaltyPoints, loyaltyLevel
    const data = await apiClient.profile.getGamification.query();
    return {
      level: data.level ?? 1,
      experiencePoints: data.experiencePoints ?? 0,
      xpForNextLevel: 100,
      xpProgress: 0,
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      badges: [],
      totalScans: data.totalScans ?? 0,
      loyaltyPoints: 0,
      loyaltyLevel: 'bronze',
    };
  },
};

export default profileService;
