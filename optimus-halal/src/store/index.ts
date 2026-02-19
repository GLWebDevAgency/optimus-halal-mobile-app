/**
 * App Store - Zustand State Management
 * 
 * Store principal pour l'état global de l'application
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, ScanRecord, Store, EthicalAlert } from "@/types";
import type { Language } from "@/i18n";
import { defaultFeatureFlags, type FeatureFlags } from "@constants/config";
import { mmkvStorage } from "@/lib/storage";

/**
 * Auth State
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  _setLoading: (loading: boolean) => void;
}

export const useLocalAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      _setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[Store] useLocalAuthStore rehydration error:", error);
        }
      },
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
 * Par défaut en mode "light" pour l'application Optimus Halal
 */
interface ThemeState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system", // Respecte la preference systeme de l'utilisateur
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Feature Flags State
 */
interface FeatureFlagsState {
  flags: FeatureFlags;
  updateFlags: (flags: Partial<FeatureFlags>) => void;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
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
 * Alerts State
 */
interface AlertsState {
  alerts: EthicalAlert[];
  unreadCount: number;
  setAlerts: (alerts: EthicalAlert[]) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
}

export const useLocalAlertsStore = create<AlertsState>()((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) =>
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.expiresAt).length,
    }),
  markAsRead: (alertId) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () => set({ unreadCount: 0 }),
}));

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


