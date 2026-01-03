/**
 * Auth Service - Enterprise-grade Mobile App
 * 
 * Authentication service for login, register, password reset
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient, setTokens, clearTokens, getDeviceId, safeApiCall, OptimusApiError } from './client';
import type * as Types from './types';

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  /**
   * Register a new user
   */
  async register(input: Types.RegisterInput): Promise<Types.AuthResponse> {
    const deviceId = await getDeviceId();
    const response = await apiClient.mobile.register.mutate({
      ...input,
      deviceId,
      deviceName: 'Mobile App',
    });

    if (response.success && response.tokens) {
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    }

    return response;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<Types.AuthResponse> {
    const deviceId = await getDeviceId();
    const response = await apiClient.mobile.login.mutate({
      email,
      password,
      deviceId,
      deviceName: 'Mobile App',
    });

    if (response.success && response.tokens) {
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    }
    console.log('Login response:', response);

    return response;
  },

  /**
   * Get full user profile after login
   */
  async getProfile(): Promise<Types.UserProfile> {
    return apiClient.mobile.getProfile.query();
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.requestPasswordReset.mutate({ email });
  },

  /**
   * Confirm password reset with code
   */
  async confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string
  ): Promise<Types.SuccessResponse> {
    return apiClient.mobile.confirmPasswordReset.mutate({
      email,
      code,
      newPassword,
    });
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.mobile.logout.mutate();
    } catch (error) {
      // Ignore errors on logout
      console.warn('Logout API call failed:', error);
    } finally {
      await clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(currentRefreshToken: string): Promise<Types.AuthTokens> {
    const response = await apiClient.mobile.refreshToken.mutate({
      refreshToken: currentRefreshToken,
    });

    await setTokens(response.accessToken, response.refreshToken);

    return response;
  },
};

export default authService;
