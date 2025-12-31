/**
 * tRPC Client - Enterprise-grade Mobile App
 * 
 * Type-safe API client using tRPC vanilla client
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { API_CONFIG, STORAGE_KEYS, HTTP_STATUS, ERROR_CODES } from './config';

// ============================================
// TYPE IMPORTS (from API Gateway)
// ============================================

// In a real setup, these would be imported from the API Gateway package
// For now, we define the router type locally
import type * as Types from './types';

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class OptimusApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  statusCode?: number;

  constructor(code: string, message: string, details?: Record<string, unknown>, statusCode?: number) {
    super(message);
    this.name = 'OptimusApiError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  static fromTRPCError(error: unknown): OptimusApiError {
    if (error && typeof error === 'object' && 'code' in error) {
      const trpcError = error as { code: string; message: string; data?: unknown };
      return new OptimusApiError(
        trpcError.code,
        trpcError.message,
        trpcError.data as Record<string, unknown>
      );
    }
    return new OptimusApiError(ERROR_CODES.UNKNOWN_ERROR, 'An unexpected error occurred');
  }

  static networkError(): OptimusApiError {
    return new OptimusApiError(
      ERROR_CODES.NETWORK_ERROR,
      'Unable to connect to the server. Please check your internet connection.'
    );
  }

  static timeoutError(): OptimusApiError {
    return new OptimusApiError(
      ERROR_CODES.TIMEOUT_ERROR,
      'Request timed out. Please try again.'
    );
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Initialize tokens from storage
 */
export async function initializeTokens(): Promise<void> {
  try {
    const [storedAccess, storedRefresh] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    accessToken = storedAccess;
    refreshToken = storedRefresh;
  } catch (error) {
    console.error('Failed to initialize tokens:', error);
  }
}

/**
 * Store tokens
 */
export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access),
    AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
  ]);
}

/**
 * Clear tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
  ]);
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!accessToken;
}

// ============================================
// DEVICE ID MANAGEMENT
// ============================================

/**
 * Get or generate device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return generateUUID();
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// LANGUAGE HEADER
// ============================================

let currentLanguage: 'fr' | 'en' | 'ar' = 'fr';

export function setApiLanguage(lang: 'fr' | 'en' | 'ar'): void {
  currentLanguage = lang;
}

// ============================================
// TRPC CLIENT CREATION
// ============================================

/**
 * Create the tRPC client with all configurations
 */
function createApiClient() {
  const client = createTRPCClient<any>({
    links: [
      httpBatchLink({
        url: `${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}`,
        
        // Custom fetch with timeout and retries
        fetch: async (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // Handle token refresh on 401
            if (response.status === HTTP_STATUS.UNAUTHORIZED && refreshToken && !isRefreshing) {
              await performTokenRefresh();
              // Retry original request
              return fetch(url, {
                ...options,
                headers: {
                  ...options?.headers,
                  Authorization: accessToken ? `Bearer ${accessToken}` : '',
                },
              });
            }

            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            
            if (error instanceof Error && error.name === 'AbortError') {
              throw OptimusApiError.timeoutError();
            }
            
            throw OptimusApiError.networkError();
          }
        },

        // Add headers
        headers: async () => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept-Language': currentLanguage,
            'X-App-Version': '1.0.0',
            'X-Platform': 'mobile',
          };

          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }

          const deviceId = await getDeviceId();
          headers['X-Device-Id'] = deviceId;

          return headers;
        },
      }),
    ],
  });

  return client;
}

/**
 * Perform token refresh
 */
async function performTokenRefresh(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
    return;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}/mobile.refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.result?.data?.accessToken) {
        await setTokens(data.result.data.accessToken, data.result.data.refreshToken);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      // Clear tokens on refresh failure
      await clearTokens();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  await refreshPromise;
}

// ============================================
// API CLIENT INSTANCE
// ============================================

export const apiClient = createApiClient();

// ============================================
// CONVENIENCE METHODS
// ============================================

/**
 * Wrapper for safe API calls with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    showError?: boolean;
    onError?: (error: OptimusApiError) => void;
  }
): Promise<{ data: T | null; error: OptimusApiError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const apiError = error instanceof OptimusApiError 
      ? error 
      : OptimusApiError.fromTRPCError(error);

    if (API_CONFIG.enableLogging) {
      console.error('API Error:', apiError);
    }

    if (options?.onError) {
      options.onError(apiError);
    }

    return { data: null, error: apiError };
  }
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

export type { Types };
