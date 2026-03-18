/**
 * useSyncLocalData — Guest -> Naqiy+ data merge (React hook version)
 *
 * Merges local MMKV data (favorites, store favorites, scan history,
 * preferences) into the authenticated user's cloud account.
 *
 * Architecture: idempotent upsert per category, atomic cleanup,
 * fire-and-forget with optional feedback.
 *
 * Use this hook from React components (e.g. settings manual sync).
 * For auth onSuccess handlers, use the standalone function in
 * @/services/sync-local-data instead.
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
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

interface SyncResult {
  favoritesSynced: number;
  storeFavoritesSynced: number;
  historySynced: number;
  preferencesSynced: boolean;
  errors: string[];
}

export function useSyncLocalData() {
  const syncFavoritesMutation = trpc.favorites.syncLocal.useMutation();
  const syncStoreFavoritesMutation = trpc.store.syncFavorites.useMutation();
  const importHistoryMutation = trpc.scan.importHistory.useMutation();
  const updateProfileMutation = trpc.profile.updateProfile.useMutation();

  const syncAll = useCallback(async (): Promise<SyncResult> => {
    const result: SyncResult = {
      favoritesSynced: 0,
      storeFavoritesSynced: 0,
      historySynced: 0,
      preferencesSynced: false,
      errors: [],
    };

    // -- 1. Product Favorites ---------------------------------
    const localFavorites = useLocalFavoritesStore.getState().favorites;
    if (localFavorites.length > 0) {
      try {
        const { synced } = await syncFavoritesMutation.mutateAsync({
          items: localFavorites.map((f) => ({ productId: f.productId })),
        });
        result.favoritesSynced = synced;
        useLocalFavoritesStore.getState().clear();
        logger.info("Sync", `Synced ${synced} product favorites`);
      } catch (e) {
        const msg = `Favorites sync failed: ${e}`;
        result.errors.push(msg);
        logger.warn("Sync", msg);
      }
    }

    // -- 2. Store Favorites -----------------------------------
    const localStoreFavs = useLocalStoreFavoritesStore.getState().favorites;
    if (localStoreFavs.length > 0) {
      try {
        const { synced } = await syncStoreFavoritesMutation.mutateAsync({
          storeIds: localStoreFavs.map((f) => f.storeId),
        });
        result.storeFavoritesSynced = synced;
        useLocalStoreFavoritesStore.getState().clear();
        logger.info("Sync", `Synced ${synced} store favorites`);
      } catch (e) {
        const msg = `Store favorites sync failed: ${e}`;
        result.errors.push(msg);
        logger.warn("Sync", msg);
      }
    }

    // -- 3. Scan History --------------------------------------
    const localScans = useLocalScanHistoryStore.getState().scans;
    if (localScans.length > 0) {
      try {
        const { imported } = await importHistoryMutation.mutateAsync({
          items: localScans.map((s) => ({
            barcode: s.barcode,
            productId: s.productId,
            halalStatus: s.halalStatus,
            confidenceScore: s.confidenceScore ?? undefined,
            scannedAt: s.scannedAt,
          })),
        });
        result.historySynced = imported;
        useLocalScanHistoryStore.getState().clear();
        logger.info("Sync", `Imported ${imported} scan history records`);
      } catch (e) {
        const msg = `Scan history sync failed: ${e}`;
        result.errors.push(msg);
        logger.warn("Sync", msg);
      }
    }

    // -- 4. User Preferences ----------------------------------
    try {
      const prefs = usePreferencesStore.getState();
      const dietary = useLocalDietaryPreferencesStore.getState();
      const nutritionProfile = useLocalNutritionProfileStore.getState();

      await updateProfileMutation.mutateAsync({
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
      result.preferencesSynced = true;
      logger.info("Sync", "Preferences synced to cloud");
    } catch (e) {
      const msg = `Preferences sync failed: ${e}`;
      result.errors.push(msg);
      logger.warn("Sync", msg);
    }

    // -- Analytics --------------------------------------------
    trackEvent("local_data_synced", {
      favorites: result.favoritesSynced,
      store_favorites: result.storeFavoritesSynced,
      history: result.historySynced,
      preferences: result.preferencesSynced,
      errors: result.errors.length,
    });

    return result;
  }, [syncFavoritesMutation, syncStoreFavoritesMutation, importHistoryMutation, updateProfileMutation]);

  return { syncAll };
}
