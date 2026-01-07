/**
 * Magic Link Authentication Service
 * 
 * Enterprise-grade passwordless authentication using gRPC-Web
 * - Email-based magic links
 * - JWT tokens (secure, short-lived)
 * - Deep linking support
 */

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import directly to avoid circular dependency
import { authService } from '@/services/grpc/auth.service';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth:access_token',
  REFRESH_TOKEN: '@auth:refresh_token',
  USER: '@auth:user',
  PENDING_EMAIL: '@auth:pending_email',
};

export interface MagicLinkUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyTokenResponse {
  success: boolean;
  user?: MagicLinkUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Request a magic link to be sent to email (via gRPC)
 */
export async function requestMagicLink(
  email: string,
  displayName?: string
): Promise<MagicLinkResponse> {
  try {
    // Store email for deep link handling
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);

    const response = await authService.requestMagicLink({
      email: email.toLowerCase().trim(),
      displayName,
      redirectUrl: Linking.createURL('auth/verify'),
    });

    return {
      success: response.success,
      message: response.message || 'Magic link sent to your email',
      expiresIn: response.expiresIn || 900, // 15 minutes default
    };
  } catch (error: any) {
    console.error('[MagicLink] Request error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send magic link',
    };
  }
}

/**
 * Verify magic link token and authenticate user (via gRPC)
 */
export async function verifyMagicLinkToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await authService.verifyMagicLink({ token });

    // Clear pending email
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);

    // Store user data
    if (response.user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        id: response.user.userId,
        email: response.user.displayName ? undefined : undefined,
        displayName: response.user.displayName,
        avatarUrl: response.user.avatarUrl,
      }));
    }

    return {
      success: true,
      user: response.user ? {
        id: response.user.userId,
        email: response.user.displayName || '',
        displayName: response.user.displayName,
        avatarUrl: response.user.avatarUrl,
        verified: response.user.isVerified,
      } : undefined,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
  } catch (error: any) {
    console.error('[MagicLink] Verify error:', error);
    return {
      success: false,
      message: error.message || 'Invalid or expired link',
    };
  }
}

/**
 * Get pending email (for UI state restoration)
 */
export async function getPendingEmail(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
}

/**
 * Clear pending email
 */
export async function clearPendingEmail(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Check if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

/**
 * Generate a state parameter for OAuth-like flow
 */
export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
