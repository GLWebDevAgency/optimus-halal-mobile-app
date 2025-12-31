/**
 * Optimus Halal - Type Definitions
 */

import { HalalStatus } from "@constants/config";

/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  location?: {
    city: string;
    country: string;
  };
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  preferredCertifications: string[];
  dietaryExclusions: string[];
  pushNotificationsEnabled: boolean;
  darkModeEnabled: boolean | "system";
  language: string;
}

/**
 * Product Types
 */
export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  halalStatus: HalalStatus;
  certification?: Certification;
  ethicalScore: EthicalScore;
  ingredients: Ingredient[];
  allergens: string[];
  nutritionFacts?: NutritionFacts;
  origin?: string;
  category: string;
}

export interface Certification {
  id: string;
  authority: string;
  authorityLogo?: string;
  validUntil: string;
  certificateUrl?: string;
  verified: boolean;
}

export interface EthicalScore {
  overall: number; // 0-5
  criteria: {
    bio: boolean;
    fairTrade: boolean;
    noGmo: boolean;
    local: boolean;
    sustainable: boolean;
  };
  warnings: string[];
}

export interface Ingredient {
  name: string;
  status: "safe" | "caution" | "warning";
  origin?: string;
  details?: string;
}

export interface NutritionFacts {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  salt: number;
}

/**
 * Store/Retailer Types
 */
export interface Store {
  id: string;
  name: string;
  type: "butcher" | "grocery" | "restaurant" | "bakery";
  address: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  rating: number;
  reviewCount: number;
  certifications: string[];
  imageUrl?: string;
  phone?: string;
  website?: string;
  openingHours: OpeningHours;
  isOpen?: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

/**
 * Alert Types
 */
export interface EthicalAlert {
  id: string;
  type: "boycott" | "certification" | "health" | "policy";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
  affectedProducts?: string[];
  affectedBrands?: string[];
  createdAt: string;
  expiresAt?: string;
}

/**
 * Scan History Types
 */
export interface ScanRecord {
  id: string;
  productId: string;
  product: Product;
  scannedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Report Types
 */
export interface Report {
  id: string;
  type: "fake_certification" | "suspicious_ingredient" | "unethical_practice" | "other";
  productId?: string;
  brandName?: string;
  description: string;
  evidence?: string[];
  status: "pending" | "reviewing" | "resolved" | "rejected";
  createdAt: string;
}

/**
 * Navigation Types
 */
export type RootStackParamList = {
  "(onboarding)": undefined;
  "(auth)": undefined;
  "(tabs)": undefined;
  "scan-result": { productId: string };
  "store-detail": { storeId: string };
  "alert-detail": { alertId: string };
  "report": { productId?: string };
};

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
