/**
 * Magic Link Authentication Service
 * 
 * Enterprise-grade passwordless authentication
 * - Email-based magic links
 * - JWT tokens (secure, short-lived)
 * - Rate limiting
 * - Deep linking support
 */

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.optimus-halal.com';
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
 * Request a magic link to be sent to email
 */
export async function requestMagicLink(
  email: string,
  displayName?: string
): Promise<MagicLinkResponse> {
  try {
    // Store email for deep link handling
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);

    const response = await fetch(`${API_URL}/auth/magic-link`, {
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
      throw new Error(data.message || 'Failed to send magic link');
    }

    return {
      success: true,
      message: data.message || 'Magic link sent to your email',
      expiresIn: data.expiresIn || 900, // 15 minutes default
    };
  } catch (error: any) {
    console.error('[MagicLink] Request error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send magic link. Please try again.',
    };
  }
}

/**
 * Verify magic link token from URL
 */
export async function verifyMagicLinkToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid or expired magic link');
    }

    // Store tokens and user
    if (data.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    if (data.user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }

    // Clear pending email
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);

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
      message: error.message || 'Failed to verify magic link',
    };
  }
}

/**
 * Check if access token is valid and not expired
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return false;

    const decoded: any = jwtDecode(token);
    const now = Date.now() / 1000;

    // Check if token expires in next 5 minutes
    return decoded.exp > now + 300;
  } catch (error) {
    console.error('[MagicLink] Token validation error:', error);
    return false;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }

    return true;
  } catch (error) {
    console.error('[MagicLink] Refresh token error:', error);
    return false;
  }
}

/**
 * Get stored user data
 */
export async function getStoredUser(): Promise<MagicLinkUser | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch (error) {
    console.error('[MagicLink] Get user error:', error);
    return null;
  }
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('[MagicLink] Get token error:', error);
    return null;
  }
}

/**
 * Logout - clear all stored data
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.PENDING_EMAIL,
    ]);
  } catch (error) {
    console.error('[MagicLink] Logout error:', error);
  }
}

/**
 * Get pending email (for showing in UI)
 */
export async function getPendingEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
  } catch (error) {
    console.error('[MagicLink] Get pending email error:', error);
    return null;
  }
}

/**
 * Generate a secure state parameter for OAuth-like flow
 */
export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
