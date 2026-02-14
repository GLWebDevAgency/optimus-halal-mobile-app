/**
 * API-Connected Stores — Optimus Halal Mobile App
 *
 * Zustand stores integrated with tRPC API services.
 * These are the CANONICAL stores — prefer these over store/index.ts.
 */

import { create } from "zustand";
import { Alert } from "react-native";
import {
  api,
  initializeTokens,
  clearTokens,
  isAuthenticated,
  setApiLanguage,
  safeApiCall,
  OptimusApiError,
} from "@/services/api";
import type * as ApiTypes from "@/services/api/types";

// ============================================
// AUTH STORE
// ============================================

interface AuthStoreState {
  user: ApiTypes.AuthUser | null;
  profile: ApiTypes.UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: ApiTypes.RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  updateProfile: (input: ApiTypes.UpdateProfileInput) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>()((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true });

    try {
      await initializeTokens();
    } catch {
      // Token init failed — proceed as unauthenticated
    }

    if (isAuthenticated()) {
      try {
        const profile = await api.profile.getProfile();
        set({
          isAuthenticated: true,
          profile,
          user: {
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName,
          },
          isLoading: false,
        });
      } catch {
        // Token invalid, clear
        await clearTokens();
        set({
          isAuthenticated: false,
          user: null,
          profile: null,
          isLoading: false,
        });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() =>
      api.auth.login(email, password)
    );

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    if (data?.success && data.user) {
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      // Fetch full profile - MUST await to ensure token is fully propagated
      await get().fetchProfile();
      return true;
    }

    set({ isLoading: false, error: "Login failed" });
    return false;
  },

  register: async (input) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() => api.auth.register(input));

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    if (data?.success && data.user) {
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      get().fetchProfile();
      return true;
    }

    set({ isLoading: false, error: "Registration failed" });
    return false;
  },

  logout: async () => {
    set({ isLoading: true });
    await api.auth.logout();
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  requestPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() =>
      api.auth.requestPasswordReset(email)
    );

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    set({ isLoading: false });
    return data?.success ?? false;
  },

  confirmPasswordReset: async (email, code, newPassword) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() =>
      api.auth.confirmPasswordReset(email, code, newPassword)
    );

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    set({ isLoading: false });
    return data?.success ?? false;
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() => api.profile.getProfile(), {
      suppressLog: true, // Suppress console.error for profile fetch to avoid noise, we handle it
    });

    if (data) {
      set({ profile: data, isLoading: false, error: null });
    } else if (error) {
      // Handle Unauthorized specifically
      if (error.code === "UNAUTHORIZED") {
        Alert.alert(
          "Session expirée",
          "Votre session a expiré. Veuillez vous reconnecter.",
          [
            {
              text: "OK",
              onPress: async () => {
                await get().logout();
              },
            },
          ]
        );
      } else {
        set({
          isLoading: false,
          error: error.message || "Failed to load profile",
        });
      }
    } else {
      set({ isLoading: false });
    }
  },

  updateProfile: async (input) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() =>
      api.profile.updateProfile(input)
    );

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    if (data?.success) {
      // Update local profile
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...input } : null,
        isLoading: false,
      }));
      return true;
    }

    set({ isLoading: false });
    return false;
  },

  clearError: () => set({ error: null }),
}));

// ============================================
// SCAN STORE
// ============================================

interface ScanStoreState {
  currentScan: ApiTypes.ScanResult | null;
  scanHistory: ApiTypes.ScanHistoryItem[];
  scanStats: ApiTypes.ScanStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  scanBarcode: (
    barcode: string,
    location?: { latitude: number; longitude: number }
  ) => Promise<ApiTypes.ScanResult | null>;
  fetchScanHistory: (pagination?: ApiTypes.PaginationInput) => Promise<void>;
  fetchScanStats: () => Promise<void>;
  clearScanHistory: () => Promise<boolean>;
  submitAnalysisRequest: (
    input: ApiTypes.AnalysisRequestInput
  ) => Promise<boolean>;
  clearCurrentScan: () => void;
}

export const useScanStore = create<ScanStoreState>()((set, get) => ({
  currentScan: null,
  scanHistory: [],
  scanStats: null,
  isLoading: false,
  error: null,

  scanBarcode: async (barcode, location) => {
    set({ isLoading: true, error: null });
    const { data, error } = await safeApiCall(() =>
      api.scan.scanBarcode({ barcode, ...location })
    );

    if (error) {
      set({ isLoading: false, error: error.message });
      return null;
    }

    if (data) {
      set({ currentScan: data, isLoading: false });
      // Refresh history
      get().fetchScanHistory();
      return data;
    }

    set({ isLoading: false });
    return null;
  },

  fetchScanHistory: async (pagination) => {
    const { data } = await safeApiCall(() =>
      api.scan.getScanHistory(pagination)
    );
    if (data) {
      set({ scanHistory: data.scans });
    }
  },

  fetchScanStats: async () => {
    const { data } = await safeApiCall(() => api.scan.getScanStats());
    if (data) {
      set({ scanStats: data });
    }
  },

  clearScanHistory: async () => {
    const { data } = await safeApiCall(() => api.scan.clearScanHistory());
    if (data?.success) {
      set({ scanHistory: [] });
      return true;
    }
    return false;
  },

  submitAnalysisRequest: async (input) => {
    set({ isLoading: true });
    const { data, error } = await safeApiCall(() =>
      api.scan.submitAnalysisRequest(input)
    );
    set({ isLoading: false });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return data?.status === "pending";
  },

  clearCurrentScan: () => set({ currentScan: null }),
}));

// ============================================
// FAVORITES STORE
// ============================================

interface FavoritesStoreState {
  favorites: ApiTypes.Favorite[];
  folders: ApiTypes.FavoriteFolder[];
  isLoading: boolean;

  // Actions
  fetchFavorites: (folderId?: string) => Promise<void>;
  addFavorite: (productId: string, folderId?: string) => Promise<boolean>;
  removeFavorite: (favoriteId: string) => Promise<boolean>;
  isFavorite: (productId: string) => Promise<boolean>;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, color?: string) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<boolean>;
}

export const useFavoritesStore = create<FavoritesStoreState>()((set, get) => ({
  favorites: [],
  folders: [],
  isLoading: false,

  fetchFavorites: async (folderId) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() =>
      api.favorites.getFavorites(undefined, folderId)
    );
    if (data) {
      set({ favorites: data.favorites });
    }
    set({ isLoading: false });
  },

  addFavorite: async (productId, folderId) => {
    const { data } = await safeApiCall(() =>
      api.favorites.addFavorite({ productId, folderId })
    );
    if (data) {
      set((state) => ({ favorites: [data, ...state.favorites] }));
      return true;
    }
    return false;
  },

  removeFavorite: async (favoriteId) => {
    const { data } = await safeApiCall(() =>
      api.favorites.removeFavorite(favoriteId)
    );
    if (data?.success) {
      set((state) => ({
        favorites: state.favorites.filter((f) => f.id !== favoriteId),
      }));
      return true;
    }
    return false;
  },

  isFavorite: async (productId) => {
    const { data } = await safeApiCall(() =>
      api.favorites.isFavorite(productId)
    );
    return data?.isFavorite ?? false;
  },

  fetchFolders: async () => {
    const { data } = await safeApiCall(() => api.favorites.getFolders());
    if (data) {
      set({ folders: data.folders });
    }
  },

  createFolder: async (name, color) => {
    const { data } = await safeApiCall(() =>
      api.favorites.createFolder({ name, color })
    );
    if (data) {
      set((state) => ({ folders: [...state.folders, data] }));
      return true;
    }
    return false;
  },

  deleteFolder: async (folderId) => {
    const { data } = await safeApiCall(() =>
      api.favorites.deleteFolder(folderId)
    );
    if (data?.success) {
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== folderId),
      }));
      return true;
    }
    return false;
  },
}));

// ============================================
// CART STORE
// ============================================

interface CartStoreState {
  cart: ApiTypes.Cart | null;
  savedForLater: ApiTypes.SavedForLaterItem[];
  isLoading: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (
    code: string
  ) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: (couponId: string) => Promise<boolean>;
  saveForLater: (itemId: string) => Promise<boolean>;
  fetchSavedForLater: () => Promise<void>;
  moveToCart: (savedId: string) => Promise<boolean>;
}

export const useCartStore = create<CartStoreState>()((set, get) => ({
  cart: null,
  savedForLater: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.cart.getCart());
    if (data) {
      set({ cart: data });
    }
    set({ isLoading: false });
  },

  addToCart: async (productId, quantity = 1) => {
    const { data } = await safeApiCall(() =>
      api.cart.addToCart({ productId, quantity })
    );
    if (data) {
      get().fetchCart(); // Refresh cart
      return true;
    }
    return false;
  },

  updateQuantity: async (itemId, quantity) => {
    const { data } = await safeApiCall(() =>
      api.cart.updateCartItem({ itemId, quantity })
    );
    if (data?.success) {
      get().fetchCart();
      return true;
    }
    return false;
  },

  removeFromCart: async (itemId) => {
    const { data } = await safeApiCall(() => api.cart.removeFromCart(itemId));
    if (data?.success) {
      set((state) => ({
        cart: state.cart
          ? {
              ...state.cart,
              items: state.cart.items.filter((i) => i.id !== itemId),
            }
          : null,
      }));
      get().fetchCart(); // Refresh for totals
      return true;
    }
    return false;
  },

  clearCart: async () => {
    const { data } = await safeApiCall(() => api.cart.clearCart());
    if (data?.success) {
      set({ cart: null });
      return true;
    }
    return false;
  },

  applyCoupon: async (code) => {
    const { data, error } = await safeApiCall(() => api.cart.applyCoupon(code));
    if (error) {
      return { success: false, message: error.message };
    }
    if (data?.success) {
      get().fetchCart();
      return { success: true };
    }
    return { success: false };
  },

  removeCoupon: async (couponId) => {
    const { data } = await safeApiCall(() => api.cart.removeCoupon(couponId));
    if (data?.success) {
      get().fetchCart();
      return true;
    }
    return false;
  },

  saveForLater: async (itemId) => {
    const { data } = await safeApiCall(() => api.cart.saveForLater(itemId));
    if (data?.success) {
      get().fetchCart();
      get().fetchSavedForLater();
      return true;
    }
    return false;
  },

  fetchSavedForLater: async () => {
    const { data } = await safeApiCall(() => api.cart.getSavedForLater());
    if (data) {
      set({ savedForLater: data.items });
    }
  },

  moveToCart: async (savedId) => {
    const { data } = await safeApiCall(() => api.cart.moveToCart(savedId));
    if (data?.success) {
      get().fetchCart();
      get().fetchSavedForLater();
      return true;
    }
    return false;
  },
}));

// ============================================
// ORDERS STORE
// ============================================

interface OrdersStoreState {
  orders: ApiTypes.Order[];
  currentOrder: ApiTypes.OrderWithDetails | null;
  orderTracking: ApiTypes.OrderTracking | null;
  isLoading: boolean;

  // Actions
  fetchOrders: (
    pagination?: ApiTypes.PaginationInput,
    status?: ApiTypes.OrderStatus
  ) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (
    input: ApiTypes.CreateOrderInput
  ) => Promise<{ success: boolean; orderId?: string; message?: string }>;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
  reorder: (orderId: string) => Promise<boolean>;
  fetchOrderTracking: (orderId: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersStoreState>()((set, get) => ({
  orders: [],
  currentOrder: null,
  orderTracking: null,
  isLoading: false,

  fetchOrders: async (pagination, status) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() =>
      api.order.getOrders(pagination, { status })
    );
    if (data) {
      set({ orders: data.orders });
    }
    set({ isLoading: false });
  },

  fetchOrder: async (orderId) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.order.getOrder(orderId));
    if (data) {
      set({ currentOrder: data });
    }
    set({ isLoading: false });
  },

  createOrder: async (input) => {
    set({ isLoading: true });
    const { data, error } = await safeApiCall(() =>
      api.order.createOrder(input)
    );
    set({ isLoading: false });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data) {
      get().fetchOrders();
      return { success: true, orderId: data.id, message: data.message };
    }

    return { success: false };
  },

  cancelOrder: async (orderId, reason) => {
    const { data } = await safeApiCall(() =>
      api.order.cancelOrder(orderId, reason)
    );
    if (data?.success) {
      get().fetchOrders();
      return true;
    }
    return false;
  },

  reorder: async (orderId) => {
    const { data } = await safeApiCall(() => api.order.reorder(orderId));
    return data?.success ?? false;
  },

  fetchOrderTracking: async (orderId) => {
    const { data } = await safeApiCall(() =>
      api.order.getOrderTracking(orderId)
    );
    if (data) {
      set({ orderTracking: data });
    }
  },
}));

// ============================================
// NOTIFICATIONS STORE
// ============================================

interface NotificationsStoreState {
  notifications: ApiTypes.Notification[];
  unreadCount: number;
  settings: ApiTypes.NotificationSettings | null;
  isLoading: boolean;

  // Actions
  fetchNotifications: (pagination?: ApiTypes.PaginationInput) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (
    input: ApiTypes.UpdateNotificationSettingsInput
  ) => Promise<boolean>;
  fetchUnreadCount: () => Promise<void>;
  registerPushToken: (
    token: string,
    platform: ApiTypes.Platform
  ) => Promise<boolean>;
}

export const useNotificationsStore = create<NotificationsStoreState>()(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    settings: null,
    isLoading: false,

    fetchNotifications: async (pagination) => {
      set({ isLoading: true });
      const { data } = await safeApiCall(() =>
        api.notification.getNotifications(pagination)
      );
      if (data) {
        set({
          notifications: data.notifications,
          unreadCount: data.unreadCount,
        });
      }
      set({ isLoading: false });
    },

    markAsRead: async (notificationIds) => {
      await api.notification.markNotificationsRead(notificationIds);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - notificationIds.length),
      }));
    },

    markAllAsRead: async () => {
      await api.notification.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    },

    fetchSettings: async () => {
      const { data } = await safeApiCall(() =>
        api.notification.getNotificationSettings()
      );
      if (data) {
        set({ settings: data });
      }
    },

    updateSettings: async (input) => {
      const { data } = await safeApiCall(() =>
        api.notification.updateNotificationSettings(input)
      );
      if (data?.success) {
        set((state) => ({
          settings: state.settings ? { ...state.settings, ...input } : null,
        }));
        return true;
      }
      return false;
    },

    fetchUnreadCount: async () => {
      const { data } = await safeApiCall(() =>
        api.notification.getUnreadCount()
      );
      if (data) {
        set({ unreadCount: data.count });
      }
    },

    registerPushToken: async (token, platform) => {
      const { data } = await safeApiCall(() =>
        api.notification.registerPushToken(token, platform)
      );
      return data?.success ?? false;
    },
  })
);

// ============================================
// LOYALTY STORE
// ============================================

interface LoyaltyStoreState {
  account: ApiTypes.LoyaltyAccount | null;
  transactions: ApiTypes.LoyaltyTransaction[];
  rewards: ApiTypes.LoyaltyReward[];
  leaderboard: ApiTypes.LeaderboardEntry[];
  isLoading: boolean;

  // Actions
  fetchAccount: () => Promise<void>;
  fetchTransactions: (pagination?: ApiTypes.PaginationInput) => Promise<void>;
  fetchRewards: () => Promise<void>;
  redeemReward: (
    rewardId: string
  ) => Promise<{ success: boolean; code?: string }>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyStoreState>()((set, get) => ({
  account: null,
  transactions: [],
  rewards: [],
  leaderboard: [],
  isLoading: false,

  fetchAccount: async () => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.loyalty.getLoyaltyAccount());
    if (data) {
      set({ account: data });
    }
    set({ isLoading: false });
  },

  fetchTransactions: async (pagination) => {
    const { data } = await safeApiCall(() =>
      api.loyalty.getLoyaltyTransactions(pagination)
    );
    if (data) {
      set({ transactions: data.transactions });
    }
  },

  fetchRewards: async () => {
    const { data } = await safeApiCall(() => api.loyalty.getAvailableRewards());
    if (data) {
      set({ rewards: data.rewards });
    }
  },

  redeemReward: async (rewardId) => {
    set({ isLoading: true });
    const { data, error } = await safeApiCall(() =>
      api.loyalty.redeemReward(rewardId)
    );
    set({ isLoading: false });

    if (error) {
      return { success: false };
    }

    if (data?.success) {
      get().fetchAccount(); // Refresh balance
      return { success: true, code: data.rewardCode };
    }

    return { success: false };
  },

  fetchLeaderboard: async (limit) => {
    const { data } = await safeApiCall(() => api.loyalty.getLeaderboard(limit));
    if (data) {
      set({ leaderboard: data.entries });
    }
  },
}));

// ============================================
// ALERTS STORE
// ============================================

interface AlertsStoreState {
  alerts: ApiTypes.AlertWithStatus[];
  summary: ApiTypes.AlertSummary | null;
  categories: ApiTypes.AlertCategory[];
  isLoading: boolean;

  // Actions
  fetchAlerts: (
    pagination?: ApiTypes.PaginationInput,
    filters?: { categoryId?: string; severity?: ApiTypes.AlertSeverity }
  ) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAlertsStore = create<AlertsStoreState>()((set, get) => ({
  alerts: [],
  summary: null,
  categories: [],
  isLoading: false,

  fetchAlerts: async (pagination, filters) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() =>
      api.alert.getAlerts(pagination, filters)
    );
    if (data) {
      set({ alerts: data.alerts });
    }
    set({ isLoading: false });
  },

  markAsRead: async (alertId) => {
    await api.alert.markAlertRead(alertId);
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    }));
    get().fetchSummary();
  },

  markAllAsRead: async () => {
    await api.alert.markAllAlertsRead();
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, isRead: true })),
    }));
    get().fetchSummary();
  },

  dismissAlert: async (alertId) => {
    await api.alert.dismissAlert(alertId);
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, isDismissed: true } : a
      ),
    }));
  },

  fetchSummary: async () => {
    const { data } = await safeApiCall(() => api.alert.getAlertSummary());
    if (data) {
      set({ summary: data });
    }
  },

  fetchCategories: async () => {
    const { data } = await safeApiCall(() => api.alert.getAlertCategories());
    if (data) {
      set({ categories: data.categories });
    }
  },
}));

// ============================================
// STORES (POINTS OF SALE) STORE
// ============================================

interface StoresStoreState {
  stores: ApiTypes.Store[];
  nearbyStores: (ApiTypes.Store & { distance: number })[];
  subscribedStores: ApiTypes.Store[];
  currentStore: ApiTypes.StoreWithDetails | null;
  isLoading: boolean;

  // Actions
  searchStores: (
    query: string,
    filters?: { storeType?: ApiTypes.StoreType; halalCertifiedOnly?: boolean }
  ) => Promise<void>;
  fetchNearbyStores: (input: ApiTypes.NearbyStoresInput) => Promise<void>;
  fetchStore: (storeId: string) => Promise<void>;
  subscribeToStore: (storeId: string) => Promise<boolean>;
  unsubscribeFromStore: (storeId: string) => Promise<boolean>;
  fetchSubscribedStores: () => Promise<void>;
}

export const useStoresStore = create<StoresStoreState>()((set, get) => ({
  stores: [],
  nearbyStores: [],
  subscribedStores: [],
  currentStore: null,
  isLoading: false,

  searchStores: async (query, filters) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() =>
      api.store.searchStores(query, undefined, filters)
    );
    if (data) {
      set({ stores: data.stores });
    }
    set({ isLoading: false });
  },

  fetchNearbyStores: async (input) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.store.getNearbyStores(input));
    if (data) {
      set({ nearbyStores: data.stores });
    }
    set({ isLoading: false });
  },

  fetchStore: async (storeId) => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.store.getStore(storeId));
    if (data) {
      set({ currentStore: data });
    }
    set({ isLoading: false });
  },

  subscribeToStore: async (storeId) => {
    const { data } = await safeApiCall(() =>
      api.store.subscribeToStore(storeId)
    );
    if (data?.success) {
      get().fetchSubscribedStores();
      return true;
    }
    return false;
  },

  unsubscribeFromStore: async (storeId) => {
    const { data } = await safeApiCall(() =>
      api.store.unsubscribeFromStore(storeId)
    );
    if (data?.success) {
      set((state) => ({
        subscribedStores: state.subscribedStores.filter(
          (s) => s.id !== storeId
        ),
      }));
      return true;
    }
    return false;
  },

  fetchSubscribedStores: async () => {
    const { data } = await safeApiCall(() => api.store.getSubscribedStores());
    if (data) {
      set({ subscribedStores: data.stores });
    }
  },
}));

// ============================================
// GLOBAL STATS STORE
// ============================================

interface GlobalStatsStoreState {
  stats: ApiTypes.GlobalStats | null;
  isLoading: boolean;

  fetchStats: () => Promise<void>;
}

export const useGlobalStatsStore = create<GlobalStatsStoreState>()((set) => ({
  stats: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    const { data } = await safeApiCall(() => api.globalStats.getGlobalStats());
    if (data) {
      set({ stats: data });
    }
    set({ isLoading: false });
  },
}));
