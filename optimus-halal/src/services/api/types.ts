/**
 * tRPC Client Types - Enterprise-grade Mobile App
 * 
 * Type definitions matching the API Gateway mobile router
 * These types are inferred from the server-side router
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

// ============================================
// PAGINATION
// ============================================

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationOutput {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface RegisterInput {
  email?: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  preferredLanguage?: 'fr' | 'en' | 'ar';
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  tokens?: AuthTokens;
}

// ============================================
// PROFILE TYPES
// ============================================

export type HalalStrictness = 'relaxed' | 'moderate' | 'strict' | 'very_strict';
export type Language = 'fr' | 'en' | 'ar';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  city?: string | null;
  preferredLanguage: Language;
  halalStrictness: HalalStrictness;
  dietaryRestrictions?: string[];
  allergens?: string[];
  level: number;
  experiencePoints: number;
  badges: Badge[];
  totalScans: number;
  currentStreak: number;
  longestStreak: number;
  notificationEnabled?: boolean;
  biometricEnabled?: boolean;
  darkMode?: boolean;
}

export interface UpdateProfileInput {
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  preferredLanguage?: Language;
  halalStrictness?: HalalStrictness;
  dietaryRestrictions?: string[];
  allergens?: string[];
  notificationEnabled?: boolean;
  biometricEnabled?: boolean;
  darkMode?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface GamificationStats {
  level: number;
  experiencePoints: number;
  xpForNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  totalScans: number;
  loyaltyPoints: number;
  loyaltyLevel: string;
}

// ============================================
// ADDRESS TYPES
// ============================================

export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  label?: string;
  addressType: AddressType;
  fullName: string;
  phone?: string;
  street: string;
  streetNumber?: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface CreateAddressInput {
  label?: string;
  addressType?: AddressType;
  fullName: string;
  phone?: string;
  street: string;
  streetNumber?: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country?: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// SCAN TYPES
// ============================================

export type HalalStatus = 'halal' | 'haram' | 'doubtful' | 'unknown';

export interface ScanBarcodeInput {
  barcode: string;
  latitude?: number;
  longitude?: number;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  halalStatus: HalalStatus;
  confidenceScore: number;
  imageUrl: string | null;
  brand: string | null;
  brandLogo?: string | null;
  category?: string | null;
  categoryId?: string | null;
  description?: string | null;
  ingredients: string[];
  nutritionFacts?: NutritionFacts | null;
  certifierId?: string | null;
  certifierName?: string | null;
  certifierLogo?: string | null;
  price?: number | null;
  currency?: string;
  inStock?: boolean;
}

export interface NutritionFacts {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface ProductAlternative {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: HalalStatus;
  confidenceScore: number;
  price?: number | null;
  similarityScore: number;
}

export interface CertifierInfo {
  id: string;
  name: string;
  logo: string | null;
  website?: string | null;
  country?: string | null;
  isVerified: boolean;
}

export interface ScanResult {
  product: Product | null;
  halalStatus: HalalStatus;
  confidenceScore: number;
  warnings: string[];
  alternatives: ProductAlternative[];
  certifierInfo: CertifierInfo | null;
}

export interface ScanHistoryItem {
  id: string;
  barcode: string;
  productId: string | null;
  productName: string | null;
  productImage: string | null;
  halalStatus: HalalStatus;
  scannedAt: string;
  latitude?: number;
  longitude?: number;
}

export interface ScanStats {
  totalScans: number;
  halalCount: number;
  haramCount: number;
  doubtfulCount: number;
  unknownCount: number;
  uniqueProducts: number;
}

export interface AnalysisRequestInput {
  barcode: string;
  productName?: string;
  brandName?: string;
  photoUrls?: string[];
  notes?: string;
}

// ============================================
// FAVORITES TYPES
// ============================================

export interface Favorite {
  id: string;
  productId: string;
  folderId?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: Product;
}

export interface FavoriteFolder {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  count: number;
}

export interface AddFavoriteInput {
  productId: string;
  folderId?: string;
  notes?: string;
}

export interface CreateFolderInput {
  name: string;
  color?: string;
  icon?: string;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
}

export interface CartCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  coupons: CartCoupon[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface AddToCartInput {
  productId: string;
  quantity?: number;
  notes?: string;
}

export interface UpdateCartItemInput {
  itemId: string;
  quantity: number;
}

export interface SavedForLaterItem {
  id: string;
  productId: string;
  product?: Product;
  savedAt: string;
}

// ============================================
// ORDER TYPES
// ============================================

export type DeliveryType = 'pickup' | 'delivery';
export type PaymentMethod = 'card' | 'cash_on_delivery' | 'apple_pay' | 'google_pay' | 'paypal';
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface CreateOrderInput {
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  shippingAddressId?: string;
  storeId?: string;
  notes?: string;
  scheduledTime?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  message?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  shippingAddress?: Address | null;
  store?: Store | null;
  notes?: string | null;
  scheduledTime?: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;
}

export interface OrderWithDetails {
  order: Order | null;
  items: OrderItem[];
  events: OrderEvent[];
  canCancel: boolean;
  canTrack: boolean;
}

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description?: string;
  completedAt?: string | null;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface DriverInfo {
  name: string;
  phone: string;
  photoUrl?: string | null;
  vehicleType: string;
  vehiclePlate?: string | null;
}

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  steps: TrackingStep[];
  estimatedTime?: string | null;
  driverInfo?: DriverInfo | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type Platform = 'ios' | 'android' | 'web';
export type NotificationType = 
  | 'alert'
  | 'order'
  | 'promotion'
  | 'loyalty'
  | 'system'
  | 'social'
  | 'reminder';

export interface RegisterPushTokenInput {
  token: string;
  platform: Platform;
  deviceId: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string | null;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled?: boolean;
  alertsPush: boolean;
  alertsEmail: boolean;
  ordersPush: boolean;
  ordersEmail: boolean;
  promotionsPush: boolean;
  promotionsEmail?: boolean;
  loyaltyPush: boolean;
  loyaltyEmail?: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface UpdateNotificationSettingsInput {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  alertsPush?: boolean;
  alertsEmail?: boolean;
  ordersPush?: boolean;
  ordersEmail?: boolean;
  promotionsPush?: boolean;
  promotionsEmail?: boolean;
  loyaltyPush?: boolean;
  loyaltyEmail?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// LOYALTY TYPES
// ============================================

export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type TransactionType = 'earned' | 'spent' | 'expired' | 'adjustment';

export interface LoyaltyAccount {
  currentPoints: number;
  lifetimePoints: number;
  currentLevel: LoyaltyLevel;
  rank: number;
  levelProgress: number;
  pointsToNextLevel: number;
  benefits: string[];
}

export interface LoyaltyTransaction {
  id: string;
  type: TransactionType;
  points: number;
  description: string;
  reference?: string | null;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  pointsCost: number;
  category: string;
  isAvailable: boolean;
  expiresAt?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  points: number;
  level: LoyaltyLevel;
  isCurrentUser: boolean;
}

// ============================================
// REPORT & REVIEW TYPES
// ============================================

export type ReportType = 
  | 'haram_content'
  | 'fake_certification'
  | 'ingredient_concern'
  | 'incorrect_info'
  | 'store_issue'
  | 'other';

export type ReportStatus = 'pending' | 'investigating' | 'approved' | 'rejected';

export interface CreateReportInput {
  reportType: ReportType;
  productId?: string;
  storeId?: string;
  title: string;
  description: string;
  evidenceUrls?: string[];
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface Report {
  id: string;
  reportType: ReportType;
  status: ReportStatus;
  title: string;
  description: string;
  productId?: string | null;
  storeId?: string | null;
  evidenceUrls: string[];
  adminResponse?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TargetType = 'product' | 'store';

export interface CreateReviewInput {
  targetType: TargetType;
  targetId: string;
  rating: number;
  title?: string;
  content?: string;
  photoUrls?: string[];
}

export interface Review {
  id: string;
  targetType: TargetType;
  targetId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  photoUrls: string[];
  helpfulCount: number;
  isMarkedHelpful?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistribution {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  pagination: PaginationOutput;
}

// ============================================
// STORE TYPES
// ============================================

export type StoreType = 
  | 'supermarket'
  | 'butcher'
  | 'restaurant'
  | 'bakery'
  | 'online'
  | 'other';

export interface StoreHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Store {
  id: string;
  name: string;
  description?: string | null;
  storeType: StoreType;
  imageUrl?: string | null;
  logoUrl?: string | null;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  halalCertified: boolean;
  certifierName?: string | null;
  averageRating: number;
  reviewCount: number;
  isOpen?: boolean;
  distance?: number;
}

export interface StoreWithDetails {
  store: Store | null;
  hours: StoreHours[];
  isOpen: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface NearbyStoresInput {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  storeType?: StoreType;
  halalCertifiedOnly?: boolean;
  limit?: number;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AlertCategory {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  color: string;
}

export interface Alert {
  id: string;
  title: string;
  summary: string;
  content: string;
  severity: AlertSeverity;
  priority: AlertPriority;
  categoryId: string;
  category?: AlertCategory;
  imageUrl?: string | null;
  productId?: string | null;
  storeId?: string | null;
  sourceUrl?: string | null;
  publishedAt: string;
  expiresAt?: string | null;
}

export interface AlertWithStatus extends Alert {
  isRead: boolean;
  isDismissed: boolean;
  readAt?: string | null;
}

export interface AlertSummary {
  totalUnread: number;
  criticalUnread: number;
  highUnread: number;
  latestAlert: Alert | null;
  hasCritical: boolean;
}

// ============================================
// GLOBAL STATS
// ============================================

export interface GlobalStats {
  totalScans: number;
  totalProducts: number;
  totalUsers: number;
  totalStores: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface CountResponse {
  count: number;
}

export interface DeleteResponse {
  success: boolean;
  deletedCount?: number;
}

export interface RedeemRewardResponse {
  success: boolean;
  rewardCode: string;
  newBalance: number;
}
