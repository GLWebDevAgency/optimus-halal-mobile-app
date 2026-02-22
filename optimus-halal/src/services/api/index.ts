/**
 * API Services Index - Enterprise-grade Mobile App
 *
 * Central export for all API services
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { authService } from './auth.service';
import { profileService } from './profile.service';
import { scanService } from './scan.service';
import { favoritesService } from './favorites.service';
import { productService } from './product.service';
import { cartService } from './cart.service';
import { orderService } from './order.service';
import { notificationService } from './notification.service';
import { loyaltyService } from './loyalty.service';
import { reportService } from './report.service';
import { storeService } from './store.service';
import { alertService } from './alert.service';
import { globalStatsService } from './globalStats.service';

// ============================================
// CLIENT & CONFIGURATION
// ============================================

export {
  apiClient,
  initializeTokens,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  getDeviceId,
  setApiLanguage,
  safeApiCall,
  checkApiHealth,
  performTokenRefresh,
  setOnAuthFailure,
  NaqiyApiError,
} from './client';

export { API_CONFIG, STORAGE_KEYS, HTTP_STATUS, ERROR_CODES } from './config';

// ============================================
// SERVICES
// ============================================

export { authService } from './auth.service';
export { profileService } from './profile.service';
export { scanService } from './scan.service';
export { favoritesService } from './favorites.service';
export { productService } from './product.service';
export { cartService } from './cart.service';
export { orderService } from './order.service';
export { notificationService } from './notification.service';
export { loyaltyService } from './loyalty.service';
export { reportService } from './report.service';
export { storeService } from './store.service';
export { alertService } from './alert.service';
export { globalStatsService } from './globalStats.service';

// ============================================
// TYPES
// ============================================

export type * from './types';

// ============================================
// CONVENIENCE OBJECT
// ============================================

/**
 * All API services in a single object
 */
export const api = {
  auth: authService,
  profile: profileService,
  scan: scanService,
  favorites: favoritesService,
  product: productService,
  cart: cartService,
  order: orderService,
  notification: notificationService,
  loyalty: loyaltyService,
  report: reportService,
  store: storeService,
  alert: alertService,
  globalStats: globalStatsService,
} as const;

export default api;
