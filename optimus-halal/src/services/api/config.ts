/**
 * API Configuration - Enterprise-grade Mobile App
 * 
 * Environment-based configuration for API connectivity
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

// ============================================
// ENVIRONMENT DETECTION
// ============================================

const isDevelopment = __DEV__;

// ============================================
// API ENDPOINTS
// ============================================

/** Development API base URL - Local backend via LAN IP (for physical device) */
const DEV_API_URL = `http://${
  // Expo sets this env var when running; fallback to Railway if not available
  process.env.EXPO_PUBLIC_API_HOST ?? '192.168.53.102'
}:3000`;

/** Production API base URL (same BFF for now) */
const PROD_API_URL = 'https://mobile-bff-production-aefc.up.railway.app';

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
  const baseUrl = isDevelopment ? DEV_API_URL : PROD_API_URL;

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
  ACCESS_TOKEN: 'optimus.access_token',
  REFRESH_TOKEN: 'optimus.refresh_token',
  DEVICE_ID: 'optimus.device_id',
  USER_DATA: 'optimus.user_data',
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
