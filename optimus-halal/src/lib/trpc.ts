/**
 * tRPC React Query Client — Naqiy Mobile App
 *
 * Features:
 * - Automatic token refresh on 401 responses
 * - Concurrent request queuing during refresh (single in-flight refresh)
 * - Failed refresh triggers full logout via onAuthFailure callback
 * - Shares refresh lock with the vanilla tRPC client in client.ts
 */

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@backend/trpc/router";
import { API_CONFIG } from "@services/api/config";
import {
  getAccessToken,
  getRefreshToken,
  getDeviceId,
  performTokenRefresh,
} from "@services/api/client";
import { logger } from "@/lib/logger";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Custom fetch wrapper that intercepts 401 responses, refreshes the
 * access token, and retries the original request with updated headers.
 *
 * Relies on the shared `performTokenRefresh()` from client.ts which
 * guarantees only one refresh is in-flight at a time — concurrent 401s
 * all await the same promise.
 */
/** Auth procedure paths that return 401 for invalid credentials — never refresh on these. */
const AUTH_PUBLIC_PATHS = ["auth.login", "auth.register", "auth.refresh", "auth.resetPassword"];

/** Check if the request targets a public auth procedure (login/register/etc.). */
function isAuthPublicRequest(url: RequestInfo | URL): boolean {
  const urlStr = typeof url === "string" ? url : url.toString();
  return AUTH_PUBLIC_PATHS.some((path) => urlStr.includes(encodeURIComponent(path)) || urlStr.includes(path));
}

async function fetchWithTokenRefresh(
  url: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> {
  // Add timeout to prevent hanging requests (e.g. backend Redis connection stall)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
  clearTimeout(timeoutId);

  // 429 — rate limited: return immediately, let React Query handle backoff.
  if (response.status === 429) {
    return response;
  }

  // Only attempt refresh if:
  // 1. Response is 401 (access token expired)
  // 2. We have a refresh token to use
  // 3. Request is NOT a public auth procedure (login/register 401 = bad credentials)
  if (response.status === 401 && getRefreshToken() && !isAuthPublicRequest(url)) {
    logger.info("Auth", "tRPC 401 intercepted — attempting token refresh");

    try {
      await performTokenRefresh();

      // Retry the original request with the new access token
      const newHeaders = new Headers(options?.headers);
      const newToken = getAccessToken();
      if (newToken) {
        newHeaders.set("Authorization", `Bearer ${newToken}`);
      } else {
        newHeaders.delete("Authorization");
      }

      logger.info("Auth", "Token refreshed — retrying original request");
      return fetch(url, { ...options, headers: newHeaders });
    } catch (error) {
      // performTokenRefresh already cleared tokens and called onAuthFailure
      logger.error(
        "Auth",
        "Token refresh failed in tRPC link — returning original 401",
        String(error)
      );
      return response;
    }
  }

  return response;
}

export function createTRPCClientForProvider() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}`,
        transformer: superjson,

        fetch: fetchWithTokenRefresh,

        headers: async () => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-App-Version": "1.0.0",
            "X-Platform": "mobile",
          };

          const token = getAccessToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const deviceId = await getDeviceId();
          headers["X-Device-Id"] = deviceId;

          return headers;
        },
      }),
    ],
  });
}
