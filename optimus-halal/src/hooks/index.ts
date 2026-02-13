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
