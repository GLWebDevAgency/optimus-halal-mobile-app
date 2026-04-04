/**
 * App Store - Zustand State Management
 * 
 * Store principal pour l'état global de l'application
 */

import { Appearance } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ScanRecord, Store } from "@/types";
import type { Language } from "@/i18n";
import type { MadhabId } from "@/components/scan/scan-types";
import { defaultFeatureFlags, type FeatureFlags } from "@constants/config";
import { mmkvStorage } from "@/lib/storage";

/**
 * Auth Cleanup Store — Naqiy+ logout only
 *
 * Source of truth for auth state is AuthContext (useMe() in _layout.tsx).
 * This store exists ONLY to clear persisted MMKV data on logout/delete.
 * It persists nothing meaningful — the `logout()` action resets it.
 *
 * Why persist? So that if the app is killed mid-logout, the next rehydration
 * starts with a clean slate instead of stale user data.
 */
interface AuthCleanupState {
  logout: () => void;
}

export const useLocalAuthStore = create<AuthCleanupState>()(
  persist(
    (set) => ({
      logout: () => set({}),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Onboarding State
 */
interface OnboardingState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Theme State
 * Par défaut en mode "light" pour l'application Naqiy
 */
interface ThemeState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        // Sync native runtime for explicit choices only.
        // "system" → null resets to OS default (no forced override).
        // Must be called BEFORE set() to avoid render loop.
        Appearance.setColorScheme(theme === "system" ? null : theme);
        set({ theme });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        if (!state || state.theme === "system") return;
        // Restore explicit theme choice on app launch (light or dark only).
        // Skip for "system" — OS preference is already the default.
        Appearance.setColorScheme(state.theme);
      },
    }
  )
);

/**
 * Feature Flags State
 */
type BooleanFlagKeys = {
  [K in keyof FeatureFlags]: FeatureFlags[K] extends boolean ? K : never;
}[keyof FeatureFlags];

interface FeatureFlagsState {
  flags: FeatureFlags;
  updateFlags: (flags: Partial<FeatureFlags>) => void;
  isFeatureEnabled: (feature: BooleanFlagKeys) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()((set, get) => ({
  flags: defaultFeatureFlags,
  updateFlags: (newFlags) =>
    set((state) => ({
      flags: { ...state.flags, ...newFlags },
    })),
  isFeatureEnabled: (feature) => get().flags[feature],
}));

/**
 * Scan History State
 *
 * Favorites are managed exclusively via tRPC hooks (useFavorites.ts).
 * This store only handles local scan history.
 */
interface ScanHistoryState {
  history: ScanRecord[];
  addScan: (record: ScanRecord) => void;
  clearHistory: () => void;
}

export const useScanHistoryStore = create<ScanHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addScan: (record) =>
        set((state) => ({
          history: [record, ...state.history.filter((r) => r.id !== record.id)].slice(0, 100),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "scan-history-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Location State
 */
interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  nearbyStores: Store[];
  setLocation: (location: { latitude: number; longitude: number } | null) => void;
  setNearbyStores: (stores: Store[]) => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  currentLocation: null,
  nearbyStores: [],
  setLocation: (location) => set({ currentLocation: location }),
  setNearbyStores: (stores) => set({ nearbyStores: stores }),
}));

/**
 * Cart State for Marketplace
 */
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useLocalCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      total: 0,
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          let newItems: CartItem[];
          
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );
          } else {
            newItems = [...state.items, { ...item, quantity: 1 }];
          }
          
          const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          
          return { items: newItems, total: newTotal, itemCount: newItemCount };
        }),
      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId);
          const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          
          return { items: newItems, total: newTotal, itemCount: newItemCount };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.productId !== productId);
            const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
            return { items: newItems, total: newTotal, itemCount: newItemCount };
          }
          
          const newItems = state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
          const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          
          return { items: newItems, total: newTotal, itemCount: newItemCount };
        }),
      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Language State for i18n
 */

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "fr",
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * User Preferences State (Certifications, Exclusions, Notifications)
 */
interface UserPreferencesState {
  certifications: string[];
  exclusions: string[];
  hapticsEnabled: boolean;
  notifications: {
    boycotts: boolean;
    recalls: boolean;
    certifications: boolean;
    favorites: boolean;
    prices: boolean;
    orders: boolean;
    newProducts: boolean;
    tips: boolean;
    newsletter: boolean;
  };
  setCertifications: (certs: string[]) => void;
  toggleCertification: (cert: string) => void;
  setExclusions: (excl: string[]) => void;
  toggleExclusion: (excl: string) => void;
  setNotificationPref: (key: string, value: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  selectedMadhab: MadhabId;
  setMadhab: (madhab: MadhabId) => void;
}

export const usePreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      certifications: ["avs", "mci"],
      exclusions: ["porkFree", "alcoholFree"],
      hapticsEnabled: true,
      notifications: {
        boycotts: true,
        recalls: true,
        certifications: true,
        favorites: true,
        prices: false,
        orders: true,
        newProducts: false,
        tips: true,
        newsletter: false,
      },
      setCertifications: (certs) => set({ certifications: certs }),
      toggleCertification: (cert) =>
        set((state) => ({
          certifications: state.certifications.includes(cert)
            ? state.certifications.filter((c) => c !== cert)
            : [...state.certifications, cert],
        })),
      setExclusions: (excl) => set({ exclusions: excl }),
      toggleExclusion: (excl) =>
        set((state) => ({
          exclusions: state.exclusions.includes(excl)
            ? state.exclusions.filter((e) => e !== excl)
            : [...state.exclusions, excl],
        })),
      setNotificationPref: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      selectedMadhab: "hanafi",
      setMadhab: (madhab) => set({ selectedMadhab: madhab }),
    }),
    {
      name: "preferences-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Ramadan Mode State
 * null = auto-detect from date, true = forced on, false = forced off
 */
interface RamadanState {
  manualOverride: boolean | null;
  setManualOverride: (override: boolean | null) => void;
}

export const useRamadanStore = create<RamadanState>()(
  persist(
    (set) => ({
      manualOverride: null,
      setManualOverride: (override) => set({ manualOverride: override }),
    }),
    {
      name: "ramadan-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Scan Quota State (Anonymous users)
 *
 * Miroir local du quota Redis backend.
 * Permet un feedback UI instantané sans attendre le réseau.
 * Le backend reste la source de vérité.
 */
export const DAILY_SCAN_LIMIT = 15;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

interface QuotaState {
  dailyScansUsed: number;
  lastScanDate: string;
  incrementScan: () => void;
  getRemainingScans: () => number;
  resetIfNewDay: () => void;
  syncFromServer: (used: number) => void;
}

export const useQuotaStore = create<QuotaState>()(
  persist(
    (set, get) => ({
      dailyScansUsed: 0,
      lastScanDate: getToday(),

      incrementScan: () => {
        const state = get();
        const today = getToday();
        if (state.lastScanDate !== today) {
          set({ dailyScansUsed: 1, lastScanDate: today });
        } else {
          set({ dailyScansUsed: state.dailyScansUsed + 1 });
        }
      },

      getRemainingScans: () => {
        const state = get();
        if (state.lastScanDate !== getToday()) return DAILY_SCAN_LIMIT;
        return Math.max(0, DAILY_SCAN_LIMIT - state.dailyScansUsed);
      },

      resetIfNewDay: () => {
        const state = get();
        if (state.lastScanDate !== getToday()) {
          set({ dailyScansUsed: 0, lastScanDate: getToday() });
        }
      },

      syncFromServer: (used: number) => {
        set({ dailyScansUsed: used, lastScanDate: getToday() });
      },
    }),
    {
      name: "quota-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Local Favorites Store — Guest mode (10 max, MMKV)
 *
 * Allows anonymous users to save up to 10 favorites locally.
 * When they create a Naqiy+ account, these migrate to cloud.
 */
const LOCAL_FAVORITES_LIMIT = 10;

export interface LocalFavorite {
  productId: string;
  name: string;
  imageUrl: string | null;
  halalStatus: string;
  addedAt: string;
}

interface LocalFavoritesState {
  favorites: LocalFavorite[];
  addFavorite: (fav: Omit<LocalFavorite, "addedAt">) => boolean;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  isFull: () => boolean;
  clear: () => void;
}

export const useLocalFavoritesStore = create<LocalFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (fav) => {
        const state = get();
        const trialActive = useTrialStore.getState().isTrialActive();
        if (!trialActive && state.favorites.length >= LOCAL_FAVORITES_LIMIT) return false;
        if (state.favorites.some((f) => f.productId === fav.productId)) return true;
        set({
          favorites: [
            { ...fav, addedAt: new Date().toISOString() },
            ...state.favorites,
          ],
        });
        return true;
      },

      removeFavorite: (productId) => {
        set({ favorites: get().favorites.filter((f) => f.productId !== productId) });
      },

      isFavorite: (productId) => {
        return get().favorites.some((f) => f.productId === productId);
      },

      isFull: () => {
        if (useTrialStore.getState().isTrialActive()) return false;
        return get().favorites.length >= LOCAL_FAVORITES_LIMIT;
      },

      clear: () => set({ favorites: [] }),
    }),
    {
      name: "local-favorites-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Local Store Favorites Store — Guest mode (10 max, MMKV)
 *
 * Allows anonymous users to save up to 10 store favorites locally.
 * When they create a Naqiy+ account, these migrate to cloud.
 */
const LOCAL_STORE_FAVORITES_LIMIT = 10;

export interface LocalStoreFavorite {
  storeId: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
  certifier: string;
  city: string;
  addedAt: string;
}

interface LocalStoreFavoritesState {
  favorites: LocalStoreFavorite[];
  addFavorite: (fav: Omit<LocalStoreFavorite, "addedAt">) => boolean;
  removeFavorite: (storeId: string) => void;
  isFavorite: (storeId: string) => boolean;
  isFull: () => boolean;
  clear: () => void;
}

export const useLocalStoreFavoritesStore = create<LocalStoreFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (fav) => {
        const state = get();
        const trialActive = useTrialStore.getState().isTrialActive();
        if (!trialActive && state.favorites.length >= LOCAL_STORE_FAVORITES_LIMIT) return false;
        if (state.favorites.some((f) => f.storeId === fav.storeId)) return true;
        set({
          favorites: [
            { ...fav, addedAt: new Date().toISOString() },
            ...state.favorites,
          ],
        });
        return true;
      },

      removeFavorite: (storeId) => {
        set({ favorites: get().favorites.filter((f) => f.storeId !== storeId) });
      },

      isFavorite: (storeId) => {
        return get().favorites.some((f) => f.storeId === storeId);
      },

      isFull: () => {
        if (useTrialStore.getState().isTrialActive()) return false;
        return get().favorites.length >= LOCAL_STORE_FAVORITES_LIMIT;
      },

      clear: () => set({ favorites: [] }),
    }),
    {
      name: "local-store-favorites-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Local Scan History Store — Guest mode (10 derniers, MMKV)
 *
 * Stores last 10 scan results for anonymous users.
 * Naqiy+ users get unlimited cloud history.
 */
const LOCAL_HISTORY_LIMIT = 10;

export interface LocalScanHistoryItem {
  barcode: string;
  productId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string;
  confidenceScore: number | null;
  certifierId: string | null;
  certifierName: string | null;
  certifierTrustScore: number | null;
  scannedAt: string;
}

interface LocalScanHistoryState {
  scans: LocalScanHistoryItem[];
  addScan: (scan: Omit<LocalScanHistoryItem, "scannedAt">) => void;
  clear: () => void;
}

export const useLocalScanHistoryStore = create<LocalScanHistoryState>()(
  persist(
    (set, get) => ({
      scans: [],

      addScan: (scan) => {
        const state = get();
        const trialActive = useTrialStore.getState().isTrialActive();
        // Remove duplicate if same barcode was scanned before
        const filtered = state.scans.filter((s) => s.barcode !== scan.barcode);
        // Trial/premium: keep 50 locally as cache; free: keep only 3
        const limit = trialActive ? 50 : LOCAL_HISTORY_LIMIT;
        set({
          scans: [
            { ...scan, scannedAt: new Date().toISOString() },
            ...filtered,
          ].slice(0, limit),
        });
      },

      clear: () => set({ scans: [] }),
    }),
    {
      name: "local-scan-history-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Nutrition Profile State
 * Persisted user preference for Health Score V2 profile axis.
 * Sent to scanBarcode mutation as `nutritionProfile`.
 */
export type NutritionProfile = "standard" | "pregnant" | "child" | "athlete" | "elderly";

interface NutritionProfileState {
  profile: NutritionProfile;
  setProfile: (profile: NutritionProfile) => void;
}

export const useLocalNutritionProfileStore = create<NutritionProfileState>()(
  persist(
    (set) => ({
      profile: "standard",
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: "nutrition-profile-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Password Reset State (Ephemeral — NOT persisted)
 *
 * Transient store for passing email/code between reset screens.
 * Cleared automatically after successful reset or on timeout.
 * NEVER persisted to MMKV — sensitive data stays in memory only.
 */
interface PasswordResetState {
  email: string;
  maskedEmail: string;
  code: string;
  setEmail: (email: string, masked: string) => void;
  setCode: (code: string) => void;
  clear: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>()((set) => ({
  email: "",
  maskedEmail: "",
  code: "",
  setEmail: (email, masked) => set({ email, maskedEmail: masked }),
  setCode: (code) => set({ code }),
  clear: () => set({ email: "", maskedEmail: "", code: "" }),
}));

/**
 * Dietary Preferences State
 * Persisted user preferences for dietary restrictions and allergens.
 * Used by the alternatives engine to filter recommendations.
 */
export interface DietaryPreferences {
  glutenFree: boolean;
  lactoseFree: boolean;
  palmOilFree: boolean;
  vegetarian: boolean;
  vegan: boolean;
}

interface DietaryPreferencesState {
  preferences: DietaryPreferences;
  allergens: string[];
  setPreference: <K extends keyof DietaryPreferences>(key: K, value: boolean) => void;
  setAllergens: (allergens: string[]) => void;
  addAllergen: (allergen: string) => void;
  removeAllergen: (allergen: string) => void;
  resetPreferences: () => void;
}

const DEFAULT_DIETARY_PREFS: DietaryPreferences = {
  glutenFree: false,
  lactoseFree: false,
  palmOilFree: false,
  vegetarian: false,
  vegan: false,
};

export const useLocalDietaryPreferencesStore = create<DietaryPreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_DIETARY_PREFS,
      allergens: [],
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
      setAllergens: (allergens) => set({ allergens }),
      addAllergen: (allergen) =>
        set((state) => ({
          allergens: state.allergens.includes(allergen)
            ? state.allergens
            : [...state.allergens, allergen],
        })),
      removeAllergen: (allergen) =>
        set((state) => ({
          allergens: state.allergens.filter((a) => a !== allergen),
        })),
      resetPreferences: () =>
        set({ preferences: DEFAULT_DIETARY_PREFS, allergens: [] }),
    }),
    {
      name: "naqiy.dietary-preferences",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Trial State — 7-day full access for new users
 *
 * **Source of truth**: Backend `devices.trialExpiresAt` (server-side, reinstall-safe).
 * **MMKV cache**: Provides instant UX on startup; synced from server on each launch
 * via `device.getTrialStatus` tRPC query.
 *
 * Flow:
 * 1. First launch → backend upsertDevice() creates trial (7 days)
 * 2. Client calls `syncFromServer()` → writes server dates to MMKV
 * 3. `isTrialActive()` reads from MMKV cache (instant, no network)
 * 4. After 7 days → server says expired → MMKV synced → free tier
 *
 * Anti-fraud: Device ID is in SecureStore (Keychain/EncryptedSharedPrefs),
 * so reinstall doesn't generate a new trial. MMKV may reset, but
 * `syncFromServer()` immediately restores the server state.
 */

interface TrialState {
  /** ISO string — synced from server `devices.trialStartedAt` */
  trialStartDate: string | null;
  /** ISO string — synced from server `devices.trialExpiresAt` */
  trialExpiresAt: string | null;
  /** Server confirmed this trial has expired */
  serverConfirmedExpired: boolean;
  /** Seed local cache on first launch (before server sync) */
  startTrial: () => void;
  /** Sync from server response — the authoritative source */
  syncFromServer: (data: {
    isActive: boolean;
    hasExpired: boolean;
    daysRemaining: number;
    startsAt: string | null;
    expiresAt: string | null;
  }) => void;
  isTrialActive: () => boolean;
  getTrialDaysRemaining: () => number;
  hasTrialExpired: () => boolean;
  hasTrialStarted: () => boolean;
}

export const useTrialStore = create<TrialState>()(
  persist(
    (set, get) => ({
      trialStartDate: null,
      trialExpiresAt: null,
      serverConfirmedExpired: false,

      startTrial: () => {
        const state = get();
        if (!state.trialStartDate) {
          const now = new Date();
          const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          set({
            trialStartDate: now.toISOString(),
            trialExpiresAt: expires.toISOString(),
            serverConfirmedExpired: false,
          });
        }
      },

      syncFromServer: (data) => {
        set({
          trialStartDate: data.startsAt,
          trialExpiresAt: data.expiresAt,
          serverConfirmedExpired: data.hasExpired,
        });
      },

      hasTrialStarted: () => {
        return get().trialStartDate !== null;
      },

      isTrialActive: () => {
        const { trialExpiresAt, serverConfirmedExpired } = get();
        if (serverConfirmedExpired) return false;
        if (!trialExpiresAt) return false;
        return new Date(trialExpiresAt) > new Date();
      },

      getTrialDaysRemaining: () => {
        const { trialExpiresAt, serverConfirmedExpired } = get();
        if (serverConfirmedExpired || !trialExpiresAt) return 0;
        const remaining = new Date(trialExpiresAt).getTime() - Date.now();
        return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
      },

      hasTrialExpired: () => {
        const { trialExpiresAt, serverConfirmedExpired, trialStartDate } = get();
        if (serverConfirmedExpired) return true;
        if (!trialStartDate || !trialExpiresAt) return false;
        return new Date(trialExpiresAt) <= new Date();
      },
    }),
    {
      name: "naqiy.trial",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
