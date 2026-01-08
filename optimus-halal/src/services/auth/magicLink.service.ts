/**
 * Magic Link Authentication Service
 * 
 * Uses REST API via API Gateway for passwordless authentication
 * - Email-based magic links via Brevo
 * - JWT tokens (secure, short-lived)
 * - Deep linking support
 */

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use API Gateway for REST endpoints
const API_URL = 'https://api-gateway-production-fce7.up.railway.app';

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
 * Request a magic link to be sent to email (via API Gateway)
 */
export async function requestMagicLink(
  email: string,
  displayName?: string
): Promise<MagicLinkResponse> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);

    const response = await fetch(`${API_URL}/api/v1/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        displayName,
        redirectUrl: Linking.createURL('auth/verify'),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to send magic link',
      };
    }

    return {
      success: data.success,
      message: data.message || 'Magic link sent to your email',
      expiresIn: data.expiresIn || 900,
    };
  } catch (error: any) {
    console.error('[MagicLink] Request error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please try again.',
    };
  }
}

/**
 * Verify magic link token
 */
export async function verifyMagicLinkToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Invalid or expired link',
      };
    }

    if (data.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    if (data.user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }

    return {
      success: true,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error: any) {
    console.error('[MagicLink] Verify error:', error);
    return {
      success: false,
      message: error.message || 'Verification failed',
    };
  }
}

export async function getPendingEmail(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
}

export async function clearPendingEmail(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'temp-mail.org',
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
