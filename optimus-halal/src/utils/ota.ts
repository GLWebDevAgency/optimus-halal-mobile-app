/**
 * OTA update utilities — safe wrapper around expo-updates.
 *
 * expo-updates requires a native module that is only available in EAS builds.
 * In dev clients / Expo Go, the module is absent and any top-level import
 * crashes every file in the import chain.
 *
 * This module centralises the problem: it lazy-loads expo-updates once,
 * caches the result, and exposes typed async functions that no-op in dev.
 * Consumers never need to know expo-updates is optional.
 *
 * Public API:
 *  - checkAndFetchOta()  — check + download OTA bundle
 *  - reloadApp()         — apply OTA or dev-reload
 *  - getOtaMetadata()    — current update ID, channel, creation time (for Sentry/PostHog)
 */

import type * as UpdatesType from "expo-updates";
import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata about the currently running OTA bundle (or null in dev). */
export interface OtaMetadata {
  /** EAS Update UUID — unique per published bundle */
  updateId: string | null;
  /** EAS channel name (e.g., "preview", "production") */
  channel: string | null;
  /** When this bundle was created on EAS servers */
  createdAt: Date | null;
  /** Whether the app is running an embedded (built-in) bundle vs OTA */
  isEmbeddedLaunch: boolean;
}

// ---------------------------------------------------------------------------
// Lazy singleton — loaded once, cached forever
// ---------------------------------------------------------------------------

let _updates: typeof UpdatesType | null = null;
let _resolved = false;

function getUpdates(): typeof UpdatesType | null {
  if (_resolved) return _updates;
  _resolved = true;

  if (__DEV__) return null;

  try {
    _updates = require("expo-updates") as typeof UpdatesType;
  } catch {
    // Native module missing (dev client without expo-updates linked)
  }
  return _updates;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if an OTA update is available, download it, and return whether
 * a new bundle is ready to apply.
 *
 * Returns `false` in dev or when the native module is unavailable.
 */
export async function checkAndFetchOta(): Promise<boolean> {
  const Updates = getUpdates();
  if (!Updates) return false;

  const check = await Updates.checkForUpdateAsync();
  if (!check.isAvailable) return false;

  const result = await Updates.fetchUpdateAsync();
  return result.isNew;
}

/**
 * Reload the app to apply a downloaded OTA update.
 *
 * In dev, falls back to DevSettings.reload(), then shows an alert
 * asking the user to manually restart.
 */
export async function reloadApp(): Promise<void> {
  const Updates = getUpdates();

  if (Updates) {
    await Updates.reloadAsync();
    return;
  }

  // Dev fallback chain
  try {
    const { DevSettings } = require("react-native");
    DevSettings.reload();
  } catch {
    Alert.alert(
      "Redémarrage manuel requis",
      "Veuillez fermer et rouvrir l'application.",
    );
  }
}

/**
 * Return metadata about the currently running OTA bundle.
 *
 * Use this for:
 *  - Sentry tags: `Sentry.setTag("ota.updateId", meta.updateId)`
 *  - PostHog props: `posthog.register({ ota_channel: meta.channel })`
 *  - Debug screens: show which bundle is active
 *
 * Returns sensible defaults when expo-updates is unavailable (dev mode).
 */
export function getOtaMetadata(): OtaMetadata {
  const Updates = getUpdates();

  if (!Updates) {
    return {
      updateId: null,
      channel: __DEV__ ? "development" : null,
      createdAt: null,
      isEmbeddedLaunch: true,
    };
  }

  return {
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
    createdAt: Updates.createdAt ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
