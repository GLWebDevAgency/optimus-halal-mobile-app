/**
 * useRemoteFlags — Fetches feature flags from backend and syncs to Zustand store.
 *
 * Flow:
 * 1. On mount → read MMKV cached flags → update store immediately (0ms startup)
 * 2. ALWAYS fetch global flags (public, no auth) → baseline for all users
 * 3. When user is authenticated → fetch featureFlags.getForUser (overrides global)
 * 4. On success → update Zustand store + persist to MMKV
 * 5. Refetch every 5 minutes (poll interval)
 * 6. On error → keep current flags (MMKV cache or defaults)
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import * as Application from "expo-application";
import { trpc } from "@/lib/trpc";
import { useFeatureFlagsStore } from "@/store";
import { mmkvStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import type { FeatureFlags } from "@constants/config";

const MMKV_FLAGS_KEY = "naqiy.remote_flags";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const flagInput = {
  platform: Platform.OS,
  appVersion: Application.nativeApplicationVersion ?? undefined,
};

/**
 * Restore cached flags from MMKV on app startup (synchronous, 0ms).
 * Called once before any network request.
 */
function restoreCachedFlags(): void {
  try {
    const cached = mmkvStorage.getItem(MMKV_FLAGS_KEY);
    if (typeof cached === "string") {
      const parsed = JSON.parse(cached) as Partial<FeatureFlags>;
      useFeatureFlagsStore.getState().updateFlags(parsed);
      logger.info("RemoteFlags", "Restored cached flags from MMKV");
    }
  } catch {
    // No cached flags or parse error — use defaults
  }
}

// Restore immediately on module load (before any component renders)
restoreCachedFlags();

function useSyncFlags(data: unknown, isSuccess: boolean, source: string) {
  const updateFlags = useFeatureFlagsStore((s) => s.updateFlags);

  useEffect(() => {
    if (isSuccess && data) {
      updateFlags(data as Partial<FeatureFlags>);
      try {
        mmkvStorage.setItem(MMKV_FLAGS_KEY, JSON.stringify(data));
      } catch { /* non-fatal */ }
      logger.info("RemoteFlags", `Synced ${Object.keys(data as object).length} flags (${source})`);
    }
  }, [isSuccess, data, updateFlags, source]);
}

/**
 * Hook to fetch and sync remote feature flags.
 * Fetches global flags (public) ALWAYS, user-specific flags when authenticated.
 */
export function useRemoteFlags(options: { enabled: boolean }) {
  // Global flags — ALWAYS fetched, even for guests.
  // This ensures all users (guest/free/trial/premium) see the same
  // feature flags like halalEngineV2Enabled.
  const globalQuery = trpc.featureFlags.getGlobal.useQuery(flagInput, {
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 3000,
  });
  useSyncFlags(globalQuery.data, globalQuery.isSuccess, "global");

  // User-specific flags — fetched when authenticated (overrides global).
  const userQuery = trpc.featureFlags.getForUser.useQuery(flagInput, {
    enabled: options.enabled,
    staleTime: POLL_INTERVAL_MS,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 3000,
  });
  useSyncFlags(userQuery.data, userQuery.isSuccess, "user");
}
