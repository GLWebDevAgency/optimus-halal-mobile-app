/**
 * App Store - Zustand State Management
 * 
 * Store principal pour l'état global de l'application
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, ScanRecord, Store, EthicalAlert, Product } from "@/types";
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

export const useAuthStore = create<AuthState>()(
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
      onRehydrateStorage: () => (state, error) => {
        // Set isLoading to false after rehydration using the store's setState
        useAuthStore.setState({ isLoading: false });
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
      theme: "light", // Light mode par défaut
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
 */
interface ScanHistoryState {
  history: ScanRecord[];
  favorites: string[]; // Product IDs
  addScan: (record: ScanRecord) => void;
  clearHistory: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useScanHistoryStore = create<ScanHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      favorites: [],
      addScan: (record) =>
        set((state) => ({
          history: [record, ...state.history.filter((r) => r.id !== record.id)].slice(0, 100),
        })),
      clearHistory: () => set({ history: [] }),
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      isFavorite: (productId) => get().favorites.includes(productId),
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

export const useAlertsStore = create<AlertsState>()((set) => ({
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

export const useCartStore = create<CartState>()(
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
import type { Language } from "@/i18n";

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
}

export const usePreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      certifications: ["avs", "mci"],
      exclusions: ["porkFree", "alcoholFree"],
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
    }),
    {
      name: "preferences-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Favorites Store - Produits favoris avec données complètes
 * Partagé entre le Dashboard et l'écran Favoris
 */
export interface FavoriteProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  status: "excellent" | "bon" | "moyen" | "mauvais";
  category: "food" | "cosmetic" | "halal";
  addedAt: string;
}

interface FavoritesState {
  favorites: FavoriteProduct[];
  addFavorite: (product: Omit<FavoriteProduct, "addedAt">) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (product: Omit<FavoriteProduct, "addedAt">) => void;
  isFavorite: (productId: string) => boolean;
  getFavoriteById: (productId: string) => FavoriteProduct | undefined;
  clearFavorites: () => void;
}

// Données initiales pour la démo (produits favoris par défaut)
const DEFAULT_FAVORITES: FavoriteProduct[] = [
  {
    id: "1",
    name: "Miel d'Acacia Bio",
    brand: "Ruche d'Or",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtxMnAlTfjVJBFwD6YetTmUam4oYp6PkDhy16DDP4FTjQCKDqwshRDyh27jtCc09KbmA9s9C-FStSP9p5yaxvM3Dh7F8N-sMZRrK67395MgUmMTSZnoRA-kQJYOhZuv128AMCBI8LfbPoEqgIaWlnZkmMfJ-KI3QYiP7VvtcO7jgAcV8zhs5GbddiZIObB10oLHdUKRyl8hWxrsMS0sn2fr2sCp9YZGVj9ItdWRu48Hxw_5uyihW2GQBDymNlccfZHM-vwm36xOZeJ",
    status: "excellent",
    category: "food",
    addedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Blancs de Poulet",
    brand: "Volaille Française",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCW0gWt8LFaevg92ySgKmzP00hy5qihmtG1gs7FQsbq4VE873Sj24JWnxCfYNakX6BsUgk8_TundOWUUH48-7ds1ggH8JIaLAI20u-3OovoFy66BYwbytWRQEjIqfyU057Eq6_KXRRjhYKPNulXdyUXDTeWC3-tu2ec8dCHbcSsZFIUpSkJd_C-s6GZUxn0GEYWrPSFY0eq4hGfSPbs7WoAlh56KzvZdXLPAq2kRg0GcivKacHjlHbumucjYRdJE9BePZn1K1UX1kyW",
    status: "bon",
    category: "food",
    addedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Huile d'Olive Vierge",
    brand: "Bio Provence",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJnrDBKWrspy7fdl5R7QyCwsom5KP71lD25JK3tzOrOdcjzSK2MRg7UIc6_5wvJGTwflPGI4DpktN9KvPUkQ5J5aB4p6yJ7iZ_Emz4LXJ-uVbDyyXonKrlx7R7MbeWC_DHGqzEE-alV2dLE7fNLlXE4mpSrijDWRyRuDMurX-ZYXyIKljubQ-vGzkIvAj7Pg59Qvc4pSCW1QiLKVlR63iqHTrhhGbSDWbq9tTdx-TLHdNPo1JLBwo5Wa3pSETiZK-oqoBwtFCJL-6j",
    status: "excellent",
    category: "food",
    addedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Dattes Majhoul",
    brand: "Délice d'Orient",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4m35jbV38n3NIkY8ZOHKsQAs_cnFj_jt55v4ZxSrpVIaY5ObsvVz0LcBa0CIoA-oUuB0T8VfU9HuP1T9ns7AdDd3fDXH4YynSEi3P6vmmbB8BE13265EV9Jk4jnZR4R0oHBvZXic6FRUnDcH2ZeRsdreMxemciz1VM8ImikGYMF5Q7FZ4SU9nXY1IteWJK5k8mi6wole88ZmjYnSp0F10GW9Z9HAfGqNHHNoomH2sU7o3O9RLZz3E6lEsZk1svGL1wcvuY6svibIW",
    status: "moyen",
    category: "food",
    addedAt: new Date().toISOString(),
  },
];

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: DEFAULT_FAVORITES,
      addFavorite: (product) =>
        set((state) => {
          // Ne pas ajouter si déjà présent
          if (state.favorites.some((f) => f.id === product.id)) {
            return state;
          }
          return {
            favorites: [
              { ...product, addedAt: new Date().toISOString() },
              ...state.favorites,
            ],
          };
        }),
      removeFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== productId),
        })),
      toggleFavorite: (product) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.id === product.id);
          if (exists) {
            return {
              favorites: state.favorites.filter((f) => f.id !== product.id),
            };
          } else {
            return {
              favorites: [
                { ...product, addedAt: new Date().toISOString() },
                ...state.favorites,
              ],
            };
          }
        }),
      isFavorite: (productId) => get().favorites.some((f) => f.id === productId),
      getFavoriteById: (productId) =>
        get().favorites.find((f) => f.id === productId),
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

