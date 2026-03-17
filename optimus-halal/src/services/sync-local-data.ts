/**
 * syncLocalDataToCloud — Standalone function (not a hook)
 *
 * Called from useAuth onSuccess handlers to merge guest data.
 * Uses the tRPC vanilla client (apiClient) for direct calls,
 * avoiding React hook dependency constraints.
 *
 * Architecture:
 * - Idempotent: safe to call multiple times (upsert semantics)
 * - Atomic per-category: each data type syncs independently
 * - Cleanup: clears local stores ONLY after successful sync
 * - Fire-and-forget: non-blocking, errors logged but not thrown
 */

import { apiClient } from "@services/api/client";
import {
  useLocalFavoritesStore,
  useLocalStoreFavoritesStore,
  useLocalScanHistoryStore,
  usePreferencesStore,
  useLocalDietaryPreferencesStore,
  useLocalNutritionProfileStore,
} from "@/store";
import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export async function syncLocalDataToCloud(): Promise<void> {
  const results = { favorites: 0, stores: 0, scans: 0, prefs: false, errors: 0 };

  // -- 1. Product Favorites ---------------------------------
  const localFavorites = useLocalFavoritesStore.getState().favorites;
  if (localFavorites.length > 0) {
    try {
      const { synced } = await apiClient.favorites.syncLocal.mutate({
        items: localFavorites.map((f) => ({ productId: f.productId })),
      });
      results.favorites = synced;
      useLocalFavoritesStore.getState().clear();
    } catch (e) {
      results.errors++;
      logger.warn("Sync", `Favorites sync failed: ${e}`);
    }
  }

  // -- 2. Store Favorites -----------------------------------
  const localStoreFavs = useLocalStoreFavoritesStore.getState().favorites;
  if (localStoreFavs.length > 0) {
    try {
      const { synced } = await apiClient.store.syncFavorites.mutate({
        storeIds: localStoreFavs.map((f) => f.storeId),
      });
      results.stores = synced;
      useLocalStoreFavoritesStore.getState().clear();
    } catch (e) {
      results.errors++;
      logger.warn("Sync", `Store favorites sync failed: ${e}`);
    }
  }

  // -- 3. Scan History --------------------------------------
  const localScans = useLocalScanHistoryStore.getState().scans;
  if (localScans.length > 0) {
    try {
      const { imported } = await apiClient.scan.importHistory.mutate({
        items: localScans.map((s) => ({
          barcode: s.barcode,
          productId: s.productId,
          halalStatus: s.halalStatus,
          confidenceScore: s.confidenceScore ?? undefined,
          scannedAt: s.scannedAt,
        })),
      });
      results.scans = imported;
      useLocalScanHistoryStore.getState().clear();
    } catch (e) {
      results.errors++;
      logger.warn("Sync", `Scan history sync failed: ${e}`);
    }
  }

  // -- 4. Preferences ---------------------------------------
  try {
    const prefs = usePreferencesStore.getState();
    const dietary = useLocalDietaryPreferencesStore.getState();
    const nutritionProfile = useLocalNutritionProfileStore.getState();

    await apiClient.profile.updateProfile.mutate({
      madhab: prefs.selectedMadhab,
      dietaryRestrictions: [
        ...prefs.exclusions,
        ...(dietary.preferences.glutenFree ? ["glutenFree"] : []),
        ...(dietary.preferences.lactoseFree ? ["lactoseFree"] : []),
        ...(dietary.preferences.palmOilFree ? ["palmOilFree"] : []),
        ...(dietary.preferences.vegetarian ? ["vegetarian"] : []),
        ...(dietary.preferences.vegan ? ["vegan"] : []),
      ],
      allergens: dietary.allergens,
      isPregnant: nutritionProfile.profile === "pregnant",
      hasChildren: nutritionProfile.profile === "child",
    });
    results.prefs = true;
  } catch (e) {
    results.errors++;
    logger.warn("Sync", `Preferences sync failed: ${e}`);
  }

  // -- Analytics --------------------------------------------
  const totalSynced = results.favorites + results.stores + results.scans;
  if (totalSynced > 0 || results.prefs) {
    trackEvent("local_data_synced", results);
    logger.info("Sync", `Guest->Cloud merge complete: ${totalSynced} items, prefs=${results.prefs}`);
  }
}
