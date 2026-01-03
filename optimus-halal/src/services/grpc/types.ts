/**
 * Generated Types from mobile.proto
 * 
 * Package: optimus.mobile.v1
 * 
 * NOTE: In production, these would be generated using:
 * - @bufbuild/protobuf + @bufbuild/connect for best React Native support
 * - Or protobuf.js with grpc-web
 * 
 * For now, we define TypeScript interfaces that match the proto definitions
 */

// ============================================
// COMMON TYPES
// ============================================

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum Language {
  UNSPECIFIED = 0,
  FR = 1,
  EN = 2,
  AR = 3,
}

export enum HalalStatus {
  UNSPECIFIED = 0,
  HALAL_CERTIFIED = 1,
  HALAL = 2,
  DOUBTFUL = 3,
  HARAM = 4,
  UNKNOWN = 5,
}

export enum HalalStrictness {
  UNSPECIFIED = 0,
  STRICT = 1,
  MODERATE = 2,
  LENIENT = 3,
}

// ============================================
// AUTH SERVICE TYPES
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  preferredLanguage: Language;
  deviceId?: string;
  pushToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  pushToken?: string;
}

export interface SocialLoginRequest {
  idToken: string;
  deviceId?: string;
  pushToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user?: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  deviceId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  language: Language;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  expiresAt?: string; // ISO timestamp
}

// ============================================
// PROFILE SERVICE TYPES
// ============================================

export interface DietaryRestrictions {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  shellfishFree: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country: string;
  language: Language;
  timezone: string;
  halalStrictness: HalalStrictness;
  dietaryRestrictions?: DietaryRestrictions;
  isOrganicPreferred: boolean;
  isEthicalPreferred: boolean;
  level: number;
  totalPoints: number;
  contributionScore: number;
  scansCount: number;
  favoritesCount: number;
  reportsCount: number;
  reviewsCount: number;
  isVerified: boolean;
  isActive: boolean;
  googleId?: string;
  appleId?: string;
  facebookId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

export interface GetProfileRequest {
  userId: string;
}

export interface UpdateProfileRequest {
  userId: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  language?: Language;
  timezone?: string;
  halalStrictness?: HalalStrictness;
  dietaryRestrictions?: DietaryRestrictions;
  isOrganicPreferred?: boolean;
  isEthicalPreferred?: boolean;
}

export interface DeleteProfileRequest {
  userId: string;
  hardDelete: boolean;
}

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  deliveryInstructions?: string;
  createdAt?: string;
}

export interface ListAddressesRequest {
  userId: string;
}

export interface ListAddressesResponse {
  addresses: UserAddress[];
}

export interface CreateAddressRequest {
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  deliveryInstructions?: string;
}

export interface UserStats {
  userId: string;
  totalScans: number;
  halalProductsFound: number;
  haramProductsAvoided: number;
  reportsSubmitted: number;
  reviewsWritten: number;
  helpfulVotesReceived: number;
  level: number;
  experiencePoints: number;
  nextLevelPoints: number;
  streakDays: number;
  longestStreak: number;
  lastActivityDate?: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
  category: string;
}

export interface GetUserStatsRequest {
  userId: string;
}

export interface ActivitySummary {
  userId: string;
  period: string;
  scansThisPeriod: number;
  productsDiscovered: number;
  reportsSubmitted: number;
  reviewsWritten: number;
  pointsEarned: number;
  streakMaintained: boolean;
}

export interface GetActivitySummaryRequest {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

// ============================================
// SCAN SERVICE TYPES
// ============================================

export interface ScanProductRequest {
  barcode: string;
  userId?: string;
  latitude?: number;
  longitude?: number;
}

export interface ScanResult {
  product?: ProductDetails;
  halalStatus: HalalStatus;
  confidence: number;
  certifications: Certification[];
  warnings: string[];
  alternatives: ProductSummary[];
  isNewProduct: boolean;
}

export interface ProductDetails {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
  description?: string;
  ingredients?: string[];
  allergens?: string[];
  nutritionFacts?: NutritionFacts;
  halalStatus: HalalStatus;
  certifications: Certification[];
  origin?: string;
  manufacturer?: string;
  averageRating: number;
  reviewCount: number;
  scanCount: number;
  lastUpdated?: string;
}

export interface ProductSummary {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  halalStatus: HalalStatus;
  averageRating: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  logoUrl?: string;
  validUntil?: string;
  isVerified: boolean;
}

export interface NutritionFacts {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrates?: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
}

// ============================================
// FAVORITES SERVICE TYPES
// ============================================

export interface AddFavoriteRequest {
  userId: string;
  productId: string;
}

export interface RemoveFavoriteRequest {
  userId: string;
  productId: string;
}

export interface ListFavoritesRequest {
  userId: string;
  pagination?: Pagination;
}

export interface ListFavoritesResponse {
  products: ProductSummary[];
  pagination: PaginatedResponse;
}

export interface CheckFavoriteRequest {
  userId: string;
  productId: string;
}

export interface CheckFavoriteResponse {
  isFavorite: boolean;
}

// ============================================
// STORE SERVICE TYPES
// ============================================

export interface Store {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  openingHours?: OpeningHours;
  halalCertified: boolean;
  certifications: Certification[];
  averageRating: number;
  reviewCount: number;
  distance?: number;
  imageUrl?: string;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface SearchStoresRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  type?: string;
  halalCertifiedOnly: boolean;
  pagination?: Pagination;
}

export interface SearchStoresResponse {
  stores: Store[];
  pagination: PaginatedResponse;
}

export interface GetStoreRequest {
  storeId: string;
}

// ============================================
// NOTIFICATION SERVICE TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsRequest {
  userId: string;
  pagination?: Pagination;
  unreadOnly?: boolean;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
  pagination: PaginatedResponse;
  unreadCount: number;
}

export interface MarkReadRequest {
  userId: string;
  notificationIds: string[];
}

export interface RegisterPushTokenRequest {
  userId: string;
  pushToken: string;
  deviceId: string;
  platform: 'ios' | 'android';
}

// ============================================
// ALERT SERVICE TYPES
// ============================================

export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedProducts?: string[];
  affectedBrands?: string[];
  source?: string;
  publishedAt: string;
  expiresAt?: string;
  actionUrl?: string;
}

export interface ListAlertsRequest {
  pagination?: Pagination;
  types?: string[];
  severities?: string[];
}

export interface ListAlertsResponse {
  alerts: Alert[];
  pagination: PaginatedResponse;
}

// ============================================
// REPORT SERVICE TYPES
// ============================================

export interface CreateReportRequest {
  userId: string;
  productId?: string;
  storeId?: string;
  type: 'incorrect_info' | 'halal_concern' | 'missing_product' | 'store_issue' | 'other';
  description: string;
  imageUrls?: string[];
}

export interface Report {
  id: string;
  userId: string;
  productId?: string;
  storeId?: string;
  type: string;
  description: string;
  imageUrls: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListReportsRequest {
  userId: string;
  pagination?: Pagination;
}

export interface ListReportsResponse {
  reports: Report[];
  pagination: PaginatedResponse;
}

// ============================================
// SERVICE DEFINITIONS
// ============================================

export const SERVICES = {
  AUTH: 'optimus.mobile.v1.AuthService',
  PROFILE: 'optimus.mobile.v1.ProfileService',
  SCAN: 'optimus.mobile.v1.ScanService',
  FAVORITES: 'optimus.mobile.v1.FavoritesService',
  STORE: 'optimus.mobile.v1.StoreService',
  NOTIFICATION: 'optimus.mobile.v1.NotificationService',
  ALERTS: 'optimus.mobile.v1.AlertsService',
  REPORT: 'optimus.mobile.v1.ReportService',
} as const;

// ============================================
// ADDITIONAL TYPES FOR SERVICE METHODS
// ============================================

// Profile Service
export interface GetPreferencesRequest {
  userId: string;
}

export interface UpdatePreferencesRequest {
  userId: string;
  language?: Language;
  halalStrictness?: HalalStrictness;
  dietaryRestrictions?: DietaryRestrictions;
  isOrganicPreferred?: boolean;
  isEthicalPreferred?: boolean;
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}

export interface UserPreferences {
  userId: string;
  language: Language;
  halalStrictness: HalalStrictness;
  dietaryRestrictions: DietaryRestrictions;
  isOrganicPreferred: boolean;
  isEthicalPreferred: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface GetAddressesRequest {
  userId: string;
}

export interface AddressListResponse {
  addresses: UserAddress[];
}

export interface UpdateAddressRequest {
  userId: string;
  id: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  deliveryInstructions?: string;
}

export interface DeleteAddressRequest {
  userId: string;
  id: string;
}

export interface SetDefaultAddressRequest {
  userId: string;
  addressId: string;
}

// Favorites Service
export interface GetFavoritesRequest {
  userId: string;
  folderId?: string;
  pagination?: Pagination;
}

export interface FavoritesListResponse {
  favorites: Favorite[];
  pagination: PaginatedResponse;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: ProductSummary;
  folderId?: string;
  notes?: string;
  addedAt: string;
}

export interface GetFoldersRequest {
  userId: string;
}

export interface FoldersListResponse {
  folders: FavoriteFolder[];
}

export interface FavoriteFolder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  iconName?: string;
  favoritesCount: number;
  createdAt: string;
}

export interface CreateFolderRequest {
  userId: string;
  name: string;
  color?: string;
  iconName?: string;
}

export interface UpdateFolderRequest {
  userId: string;
  id: string;
  name?: string;
  color?: string;
  iconName?: string;
}

export interface DeleteFolderRequest {
  userId: string;
  id: string;
  moveFavoritesToFolderId?: string;
}

export interface MoveFavoriteRequest {
  userId: string;
  favoriteId: string;
  targetFolderId?: string;
}

// Store Service
export interface GetNearbyStoresRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  storeType?: string;
  halalCertifiedOnly?: boolean;
  pagination?: Pagination;
}

export interface StoreListResponse {
  stores: Store[];
  pagination: PaginatedResponse;
}

export interface GetStoreReviewsRequest {
  storeId: string;
  pagination?: Pagination;
}

export interface ReviewListResponse {
  reviews: StoreReview[];
  pagination: PaginatedResponse;
}

export interface StoreReview {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  title?: string;
  content?: string;
  imageUrls: string[];
  helpfulCount: number;
  createdAt: string;
}

export interface CreateStoreReviewRequest {
  userId: string;
  storeId: string;
  rating: number;
  title?: string;
  content?: string;
  imageUrls?: string[];
}

// Notification Service
export interface UnregisterPushTokenRequest {
  userId: string;
  deviceId: string;
}

export interface GetNotificationSettingsRequest {
  userId: string;
}

export interface UpdateNotificationSettingsRequest {
  userId: string;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  alertsEnabled?: boolean;
  promotionsEnabled?: boolean;
  digestFrequency?: 'realtime' | 'daily' | 'weekly' | 'never';
}

export interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  alertsEnabled: boolean;
  promotionsEnabled: boolean;
  digestFrequency: 'realtime' | 'daily' | 'weekly' | 'never';
}

export interface GetNotificationsRequest {
  userId: string;
  unreadOnly?: boolean;
  pagination?: Pagination;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: PaginatedResponse;
  unreadCount: number;
}

export interface MarkNotificationReadRequest {
  userId: string;
  notificationId: string;
}

export interface MarkAllNotificationsReadRequest {
  userId: string;
}

export interface GetUnreadCountRequest {
  userId: string;
}

export interface UnreadCountResponse {
  count: number;
}

// Alert Service
export interface GetAlertsRequest {
  categoryId?: string;
  severity?: 'info' | 'warning' | 'critical';
  pagination?: Pagination;
}

export interface AlertsListResponse {
  alerts: Alert[];
  pagination: PaginatedResponse;
}

export interface GetAlertRequest {
  alertId: string;
}

export interface AlertCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  alertCount: number;
}

export interface GetAlertCategoriesRequest {}

export interface AlertCategoriesResponse {
  categories: AlertCategory[];
}

export interface SubscribeToCategoryRequest {
  userId: string;
  categoryId: string;
}

export interface UnsubscribeFromCategoryRequest {
  userId: string;
  categoryId: string;
}

export interface GetSubscribedCategoriesRequest {
  userId: string;
}

export interface SubscribedCategoriesResponse {
  categoryIds: string[];
}

// Report Service
export interface GetReportsRequest {
  userId: string;
  status?: 'pending' | 'investigating' | 'resolved' | 'rejected';
  pagination?: Pagination;
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: PaginatedResponse;
}

export interface GetReportRequest {
  reportId: string;
}
