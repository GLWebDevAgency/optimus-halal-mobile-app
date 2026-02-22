/**
 * API Configuration - Enterprise-grade Mobile App
 *
 * Environment-based configuration for API connectivity.
 * In dev mode, auto-detects the LAN IP from Expo's metro bundler
 * so you never need to update .env when WiFi reconnects.
 */

import Constants from "expo-constants";

// ============================================
// ENVIRONMENT DETECTION
// ============================================

const isDevelopment = __DEV__;

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Auto-detect dev machine LAN IP from Expo metro bundler.
 *
 * Constants.expoConfig.hostUri = "192.168.x.x:8081" (metro port)
 * We strip the port and reuse the hostname for our backend on :3000.
 * Falls back to EXPO_PUBLIC_API_HOST env var, then localhost.
 */
function getDevApiUrl(): string {
  // 1. Expo metro bundler knows the correct LAN IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) return `http://${host}:3000`;
  }

  // 2. Explicit env override (CI, custom setups)
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envHost) return `http://${envHost}:3000`;

  // 3. Last resort
  return "http://localhost:3000";
}

const DEV_API_URL = getDevApiUrl();

/** Production API base URL (fallback) */
const PROD_API_URL = "https://mobile-bff-production-aefc.up.railway.app";

/**
 * Resolve API base URL.
 * Priority: EXPO_PUBLIC_API_URL (explicit) > dev auto-detect > prod fallback
 */
function resolveBaseUrl(): string {
  // 1. Explicit override via EAS build env (preview, production, custom)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // 2. Dev mode: auto-detect LAN IP
  if (isDevelopment) return DEV_API_URL;

  // 3. Fallback: production
  return PROD_API_URL;
}

// ============================================
// CONFIGURATION
// ============================================

export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** tRPC endpoint path */
  trpcPath: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Enable request logging in development */
  enableLogging: boolean;
  /** Retry configuration */
  retry: {
    maxRetries: number;
    retryDelay: number;
    retryOn: number[];
  };
  /** Headers configuration */
  headers: {
    contentType: string;
    acceptLanguage: string;
  };
}

/**
 * Get API configuration based on environment
 */
export function getApiConfig(): ApiConfig {
  const baseUrl = resolveBaseUrl();

  return {
    baseUrl,
    trpcPath: '/trpc',
    timeout: 30000, // 30 seconds
    enableLogging: isDevelopment,
    retry: {
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes
    },
    headers: {
      contentType: 'application/json',
      acceptLanguage: 'fr', // Will be dynamic based on i18n
    },
  };
}

// ============================================
// API CONSTANTS
// ============================================

/** Storage keys for auth tokens */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'naqiy.access_token',
  REFRESH_TOKEN: 'naqiy.refresh_token',
  DEVICE_ID: 'naqiy.device_id',
  USER_DATA: 'naqiy.user_data',
} as const;

/** HTTP status codes */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/** Error codes for client-side handling */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ============================================
// EXPORTED CONFIG
// ============================================

export const API_CONFIG = getApiConfig();

if (isDevelopment) {
  console.log(`[API] Dev URL auto-detected: ${API_CONFIG.baseUrl}`);
}
