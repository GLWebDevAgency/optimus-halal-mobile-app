/**
 * Hooks Index - Enterprise-grade Mobile App
 * 
 * Central export for all custom hooks
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

// ============================================
// API HOOKS
// ============================================

export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useDebouncedValue,
  usePrevious,
  useInterval,
  useRefreshOnFocus,
} from './useApi';

// ============================================
// THEME HOOKS
// ============================================

export { useTheme } from './useTheme';

// ============================================
// TRANSLATION HOOKS
// ============================================

export { useTranslation, useLanguage } from './useTranslation';

// ============================================
// AUTH HOOKS (tRPC)
// ============================================

export {
  useMe,
  useLogin,
  useRegister,
  useLogout,
  useRequestPasswordReset,
  useResetPassword,
} from './useAuth';

// ============================================
// SCAN HOOKS (tRPC)
// ============================================

export {
  useScanBarcode,
  useScanHistory,
  useScanStats,
  useRequestAnalysis,
} from './useScan';

// ============================================
// FAVORITES HOOKS (tRPC)
// ============================================

export {
  useFavoritesList,
  useAddFavorite,
  useRemoveFavorite,
  useFavoriteFolders,
  useCreateFavoriteFolder,
  useMoveFavoriteToFolder,
} from './useFavorites';

// ============================================
// LOYALTY HOOKS (tRPC)
// ============================================

export {
  useLoyaltyBalance,
  useAchievements,
  useLeaderboard,
  useLoyaltyHistory,
  useRewards,
  useClaimReward,
  useMyRewards,
} from './useLoyalty';

// ============================================
// REVIEWS HOOKS (tRPC)
// ============================================

export {
  useCreateReview,
  useProductReviews,
  useMarkHelpful,
} from './useReviews';

// ============================================
// HAPTICS HOOK
// ============================================

export { useHaptics } from './useHaptics';

// ============================================
// RAMADAN MODE HOOK
// ============================================

export { useRamadanMode } from './useRamadanMode';

// ============================================
// MAP HOOKS
// ============================================

export { useUserLocation } from './useUserLocation';
export { useMapStores } from './useMapStores';
export { useGeocode } from './useGeocode';
export type { GeocodeSuggestion } from './useGeocode';
export { useMapSearch } from './useMapSearch';
export type { StoreSearchResult, AddressSearchResult, SearchResult } from './useMapSearch';

// ============================================
// PREMIUM HOOK
// ============================================

export { usePremium } from './usePremium';

// ============================================
// IMAGE UPLOAD HOOK (R2)
// ============================================
// NOT barrel-exported: expo-image-manipulator requires native module.
// Import directly: import { useImageUpload } from '@/hooks/useImageUpload'
