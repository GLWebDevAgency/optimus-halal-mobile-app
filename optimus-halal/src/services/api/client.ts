/**
 * tRPC Client — Naqiy Mobile App
 *
 * Type-safe API client connected to the dedicated Mobile BFF
 * (Hono + tRPC v11 + Drizzle + superjson)
 */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { API_CONFIG, STORAGE_KEYS, HTTP_STATUS, ERROR_CODES } from "./config";
import { logger } from "@/lib/logger";

import type { AppRouter } from "@backend/trpc/router";
import type * as Types from "./types";
import type { Language } from "@/i18n";

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class NaqiyApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  statusCode?: number;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    statusCode?: number
  ) {
    super(message);
    this.name = "NaqiyApiError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  static fromTRPCError(error: unknown): NaqiyApiError {
    if (error && typeof error === "object") {
      // TRPCClientError with a valid server shape (has code + message)
      const shape = (error as any).shape;
      if (shape && typeof shape === "object" && shape.message) {
        return new NaqiyApiError(
          shape.code || ERROR_CODES.UNKNOWN_ERROR,
          shape.message,
          shape.data
        );
      }

      // TRPCClientError or similar with top-level code + message
      if ("code" in error && "message" in error) {
        const trpcError = error as {
          code: string;
          message: string;
          data?: unknown;
        };
        return new NaqiyApiError(
          trpcError.code,
          trpcError.message,
          trpcError.data as Record<string, unknown>
        );
      }

      // Generic Error with a message
      if (error instanceof Error) {
        return new NaqiyApiError(ERROR_CODES.UNKNOWN_ERROR, error.message);
      }
    }
    return new NaqiyApiError(
      ERROR_CODES.UNKNOWN_ERROR,
      "An unexpected error occurred"
    );
  }

  static networkError(): NaqiyApiError {
    return new NaqiyApiError(
      ERROR_CODES.NETWORK_ERROR,
      "Unable to connect to the server. Please check your internet connection."
    );
  }

  static timeoutError(): NaqiyApiError {
    return new NaqiyApiError(
      ERROR_CODES.TIMEOUT_ERROR,
      "Request timed out. Please try again."
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

export async function initializeTokens(): Promise<void> {
  logger.info("Auth", "initializeTokens: start");
  try {
    const [storedAccess, storedRefresh] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    accessToken = storedAccess;
    refreshToken = storedRefresh;
    logger.info("Auth", "initializeTokens: done", {
      hasAccess: !!storedAccess,
      hasRefresh: !!storedRefresh,
    });
  } catch (error) {
    logger.error("Auth", "initializeTokens: failed", String(error));
  }
}

export async function setTokens(
  access: string,
  refresh: string
): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
  ]);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

// ============================================
// DEVICE ID MANAGEMENT
// ============================================

export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return Crypto.randomUUID();
  }
}

// ============================================
// LANGUAGE HEADER
// ============================================

let currentLanguage: Language = "fr";

export function setApiLanguage(lang: Language): void {
  currentLanguage = lang;
}

// ============================================
// TRPC CLIENT — Connected to Mobile BFF
// ============================================

function createApiClient() {
  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}`,
        transformer: superjson,

        fetch: async (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            API_CONFIG.timeout
          );

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // 429 — rate limited: return immediately, don't retry
            if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
              return response;
            }

            // Only refresh tokens for protected-route 401s.
            // Public auth procedures (login/register) return 401 for invalid
            // credentials — those must reach the caller directly.
            const urlStr = typeof url === "string" ? url : url.toString();
            const isAuthPublic = ["auth.login", "auth.register", "auth.refresh", "auth.resetPassword"]
              .some((p) => urlStr.includes(encodeURIComponent(p)) || urlStr.includes(p));

            if (
              response.status === HTTP_STATUS.UNAUTHORIZED &&
              refreshToken &&
              !isAuthPublic
            ) {
              await performTokenRefresh();
              return fetch(url, {
                ...options,
                headers: {
                  ...options?.headers,
                  Authorization: accessToken ? `Bearer ${accessToken}` : "",
                },
              });
            }

            return response;
          } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === "AbortError") {
              throw NaqiyApiError.timeoutError();
            }

            throw NaqiyApiError.networkError();
          }
        },

        headers: async () => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Accept-Language": currentLanguage,
            "X-App-Version": "1.0.0",
            "X-Platform": "mobile",
          };

          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }

          const deviceId = await getDeviceId();
          headers["X-Device-Id"] = deviceId;

          return headers;
        },
      }),
    ],
  });

  return client;
}

// ============================================
// AUTH FAILURE CALLBACK
// ============================================

type AuthFailureCallback = () => void;
let onAuthFailure: AuthFailureCallback | null = null;

/**
 * Register a callback invoked when token refresh fails (user must re-login).
 * Typically called once from the root layout to wire up Zustand store clearing.
 */
export function setOnAuthFailure(cb: AuthFailureCallback): void {
  onAuthFailure = cb;
}

/**
 * Token refresh via BFF auth.refresh procedure.
 * Uses apiClient directly — isRefreshing flag prevents recursive 401 handling.
 * Exported so the React Query tRPC client can reuse the same refresh lock.
 */
export async function performTokenRefresh(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
    return;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const result = await apiClient.auth.refresh.mutate({ refreshToken });

      if (result?.accessToken && result?.refreshToken) {
        await setTokens(result.accessToken, result.refreshToken);
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      await clearTokens();
      logger.warn("Auth", "Token refresh failed — logging out", String(error));
      onAuthFailure?.();
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

export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    showError?: boolean;
    onError?: (error: NaqiyApiError) => void;
    suppressLog?: boolean;
  }
): Promise<{ data: T | null; error: NaqiyApiError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const apiError =
      error instanceof NaqiyApiError
        ? error
        : NaqiyApiError.fromTRPCError(error);

    if (API_CONFIG.enableLogging && !options?.suppressLog) {
      if (apiError.code === "UNAUTHORIZED") {
        console.warn("API Unauthorized:", apiError.message);
      } else {
        console.error("API Error:", apiError);
      }
    }

    if (options?.onError) {
      options.onError(apiError);
    }

    return { data: null, error: apiError };
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
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
