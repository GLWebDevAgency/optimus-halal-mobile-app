/**
 * Auth Service — Mobile BFF adapter
 *
 * BFF routes: auth.register, auth.login, auth.logout, auth.refresh,
 *             auth.requestPasswordReset, auth.resetPassword, auth.me
 */

import {
  apiClient,
  setTokens,
  clearTokens,
  getDeviceId,
} from "./client";
import type * as Types from "./types";

export const authService = {
  async register(input: Types.RegisterInput): Promise<Types.AuthResponse> {
    const result = await apiClient.auth.register.mutate({
      email: input.email ?? '',
      password: input.password,
      displayName: input.displayName,
      phoneNumber: input.phoneNumber,
    });

    if (result.accessToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return {
      success: true,
      user: result.user,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 900,
      },
    };
  },

  async login(email: string, password: string): Promise<Types.AuthResponse> {
    const deviceId = await getDeviceId();
    const result = await apiClient.auth.login.mutate({
      email,
      password,
      deviceId,
      deviceName: "Mobile App",
    });

    if (result.accessToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 900,
      },
    };
  },

  async getProfile(): Promise<Types.UserProfile> {
    const profile = await apiClient.profile.getProfile.query();
    // Backend doesn't return badges — provide default
    return { ...profile, badges: [] } as unknown as Types.UserProfile;
  },

  async requestPasswordReset(email: string): Promise<Types.SuccessResponse> {
    return apiClient.auth.requestPasswordReset.mutate({ email });
  },

  async confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string
  ): Promise<Types.SuccessResponse> {
    return apiClient.auth.resetPassword.mutate({ email, code, newPassword });
  },

  async logout(): Promise<void> {
    try {
      await apiClient.auth.logout.mutate();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      await clearTokens();
    }
  },

  async refreshToken(currentRefreshToken: string): Promise<Types.AuthTokens> {
    const result = await apiClient.auth.refresh.mutate({
      refreshToken: currentRefreshToken,
    });
    await setTokens(result.accessToken, result.refreshToken);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: 900,
    };
  },
};

export default authService;
