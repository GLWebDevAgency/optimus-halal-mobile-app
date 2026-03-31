/**
 * useAppUpdate — Version management & OTA update hook
 *
 * Responsibilities:
 *  1. Check current app version against backend `/app-config` min version
 *  2. Check for OTA updates via expo-updates
 *  3. Expose state for the UI to render force-update / OTA / maintenance modals
 *
 * All expo-updates calls are wrapped in try/catch because they throw
 * in dev mode / Expo Go where the native module is unavailable.
 *
 * The backend fetch has a 5s timeout and fails silently — the app
 * must remain functional even when the endpoint is unreachable.
 *
 * @module hooks/useAppUpdate
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Updates from "expo-updates";
import { APP_VERSION } from "@/utils/appVersion";
import { getApiConfig } from "@/services/api/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppUpdateState {
  /** App is too old — must update from store */
  forceUpdate: boolean;
  /** OTA update downloaded and ready to install */
  otaReady: boolean;
  /** Backend is in maintenance mode */
  maintenance: boolean;
  /** Optional message from backend */
  message: string | null;
  /** Store URL for current platform */
  storeUrl: string | null;
  /** Apply downloaded OTA update (triggers reload) */
  applyOtaUpdate: () => Promise<void>;
}

/** Shape of the backend `/app-config` response */
interface AppConfigResponse {
  minVersion: string;
  maintenance?: boolean;
  message?: string | null;
  storeUrls?: {
    ios?: string;
    android?: string;
  };
}

// ---------------------------------------------------------------------------
// Semver comparison (no external dependency)
// ---------------------------------------------------------------------------

/**
 * Parse a semver string into a numeric triple.
 * Handles "1.2.3", "1.2", "1" gracefully.
 */
function parseSemver(version: string): [number, number, number] {
  const parts = version
    .replace(/^v/, "")
    .split(".")
    .map((p) => {
      const n = parseInt(p, 10);
      return Number.isNaN(n) ? 0 : n;
    });
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Compare two semver strings.
 * Returns:
 *  -1 if a < b
 *   0 if a === b
 *   1 if a > b
 */
function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const [aMajor, aMinor, aPatch] = parseSemver(a);
  const [bMajor, bMinor, bPatch] = parseSemver(b);

  if (aMajor !== bMajor) return aMajor < bMajor ? -1 : 1;
  if (aMinor !== bMinor) return aMinor < bMinor ? -1 : 1;
  if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Store URLs
// ---------------------------------------------------------------------------

const DEFAULT_STORE_URLS = {
  ios: "https://apps.apple.com/app/naqiy/id0000000000", // Replace with real App Store ID
  android:
    "https://play.google.com/store/apps/details?id=com.naqiy.app",
} as const;

function getStoreUrl(
  storeUrls?: AppConfigResponse["storeUrls"],
): string {
  if (Platform.OS === "ios") {
    return storeUrls?.ios ?? DEFAULT_STORE_URLS.ios;
  }
  return storeUrls?.android ?? DEFAULT_STORE_URLS.android;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppUpdate(): AppUpdateState {
  const [forceUpdate, setForceUpdate] = useState(false);
  const [otaReady, setOtaReady] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  // Prevent double-fetch in StrictMode / fast re-mount
  const didRun = useRef(false);

  // --------------------------------------------------
  // 1. Backend version check
  // --------------------------------------------------
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const baseUrl = getApiConfig().baseUrl;

    async function checkVersion() {
      try {
        const res = await fetchWithTimeout(
          `${baseUrl}/app-config`,
          5_000,
        );

        if (!res.ok) return; // Fail silently

        const data: AppConfigResponse = await res.json();

        // Maintenance mode
        if (data.maintenance) {
          setMaintenance(true);
          setMessage(data.message ?? null);
          return;
        }

        // Version comparison
        if (data.minVersion && compareSemver(APP_VERSION, data.minVersion) < 0) {
          setForceUpdate(true);
          setStoreUrl(getStoreUrl(data.storeUrls));
          setMessage(data.message ?? null);
        }
      } catch {
        // Network error, timeout, JSON parse error — fail silently
        // The app should remain usable when the endpoint is unreachable
      }
    }

    checkVersion();
  }, []);

  // --------------------------------------------------
  // 2. OTA update check (in parallel)
  // --------------------------------------------------
  useEffect(() => {
    async function checkOta() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          const result = await Updates.fetchUpdateAsync();

          if (result.isNew) {
            setOtaReady(true);
          }
        }
      } catch {
        // Expected in dev / Expo Go where the native module is unavailable.
        // Also catches network errors during OTA check — fail silently.
      }
    }

    checkOta();
  }, []);

  // --------------------------------------------------
  // 3. Apply OTA update
  // --------------------------------------------------
  const applyOtaUpdate = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // Should not happen in production, but guard just in case
    }
  }, []);

  return {
    forceUpdate,
    otaReady,
    maintenance,
    message,
    storeUrl,
    applyOtaUpdate,
  };
}
