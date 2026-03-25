/**
 * useRemoteFlags — Fetches feature flags from backend and syncs to Zustand store.
 *
 * Flow:
 * 1. On mount → read MMKV cached flags → update store immediately (0ms startup)
 * 2. When user is authenticated → fetch featureFlags.getForUser
 * 3. On success → update Zustand store + persist to MMKV
 * 4. Refetch every 5 minutes (poll interval)
 * 5. On error → keep current flags (MMKV cache or defaults)
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

/**
 * Restore cached flags from MMKV on app startup (synchronous, 0ms).
 * Called once before any network request.
 */
function restoreCachedFlags(): void {
  try {
    const cached = mmkvStorage.getItem(MMKV_FLAGS_KEY);
    // mmkvStorage.getItem may return string | Promise<string | null>
    // In practice it's synchronous (MMKV), but handle both cases
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

/**
 * Hook to fetch and sync remote feature flags.
 * Must be called inside a tRPC provider and when auth state is known.
 */
export function useRemoteFlags(options: { enabled: boolean }) {
  const updateFlags = useFeatureFlagsStore((s) => s.updateFlags);

  const { data, isSuccess } = trpc.featureFlags.getForUser.useQuery(
    {
      platform: Platform.OS,
      appVersion: Application.nativeApplicationVersion ?? undefined,
    },
    {
      enabled: options.enabled,
      staleTime: POLL_INTERVAL_MS,
      refetchInterval: POLL_INTERVAL_MS,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 3000,
    }
  );

  useEffect(() => {
    if (isSuccess && data) {
      // Merge remote flags into store
      updateFlags(data as Partial<FeatureFlags>);

      // Persist to MMKV for next cold start
      try {
        mmkvStorage.setItem(MMKV_FLAGS_KEY, JSON.stringify(data));
      } catch {
        // Non-fatal
      }

      logger.info("RemoteFlags", `Synced ${Object.keys(data).length} flags from backend`);
    }
  }, [isSuccess, data, updateFlags]);
}
