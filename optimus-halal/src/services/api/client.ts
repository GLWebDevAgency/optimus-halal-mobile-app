/**
 * tRPC Client — Optimus Halal Mobile App
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

export class OptimusApiError extends Error {
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
    this.name = "OptimusApiError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  static fromTRPCError(error: unknown): OptimusApiError {
    if (error && typeof error === "object") {
      if ("shape" in error) {
        const shape = (error as any).shape;
        return new OptimusApiError(
          shape?.code || ERROR_CODES.UNKNOWN_ERROR,
          shape?.message || "An unexpected error occurred",
          shape?.data
        );
      }

      if ("code" in error && "message" in error) {
        const trpcError = error as {
          code: string;
          message: string;
          data?: unknown;
        };
        return new OptimusApiError(
          trpcError.code,
          trpcError.message,
          trpcError.data as Record<string, unknown>
        );
      }

      if (error instanceof Error) {
        return new OptimusApiError(ERROR_CODES.UNKNOWN_ERROR, error.message, {
          stack: error.stack,
        });
      }
    }
    return new OptimusApiError(
      ERROR_CODES.UNKNOWN_ERROR,
      "An unexpected error occurred"
    );
  }

  static networkError(): OptimusApiError {
    return new OptimusApiError(
      ERROR_CODES.NETWORK_ERROR,
      "Unable to connect to the server. Please check your internet connection."
    );
  }

  static timeoutError(): OptimusApiError {
    return new OptimusApiError(
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
  try {
    const [storedAccess, storedRefresh] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    accessToken = storedAccess;
    refreshToken = storedRefresh;
  } catch (error) {
    if (__DEV__) console.warn("Failed to initialize tokens:", error);
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

            if (
              response.status === HTTP_STATUS.UNAUTHORIZED &&
              refreshToken &&
              !isRefreshing
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
              throw OptimusApiError.timeoutError();
            }

            throw OptimusApiError.networkError();
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

/**
 * Token refresh via BFF auth.refresh procedure.
 * Uses apiClient directly — isRefreshing flag prevents recursive 401 handling.
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
    onError?: (error: OptimusApiError) => void;
    suppressLog?: boolean;
  }
): Promise<{ data: T | null; error: OptimusApiError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const apiError =
      error instanceof OptimusApiError
        ? error
        : OptimusApiError.fromTRPCError(error);

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
