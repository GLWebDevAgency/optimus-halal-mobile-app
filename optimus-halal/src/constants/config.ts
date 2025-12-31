/**
 * Optimus Halal - Feature Flags Configuration
 * 
 * Système de feature flags pour activer/désactiver des fonctionnalités
 */

export interface FeatureFlags {
  // Marketplace (Phase 2 - désactivé par défaut)
  marketplaceEnabled: boolean;
  // Paiement dans l'app
  paymentsEnabled: boolean;
  // Mode hors ligne
  offlineMode: boolean;
  // Alertes push
  pushNotifications: boolean;
  // Scanner avancé avec AI
  aiScanner: boolean;
  // Gamification (badges, points)
  gamificationEnabled: boolean;
  // Social sharing
  socialSharing: boolean;
  // Analytics
  analyticsEnabled: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  marketplaceEnabled: true, // Activé pour le développement
  paymentsEnabled: false,
  offlineMode: true,
  pushNotifications: true,
  aiScanner: false,
  gamificationEnabled: false,
  socialSharing: true,
  analyticsEnabled: true,
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: "https://api-gateway-production-fce7.up.railway.app",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * App Constants
 */
export const APP_CONFIG = {
  APP_NAME: "Optimus Halal",
  TAGLINE: "Halal. Éthique. Vérifié.",
  VERSION: "1.0.0",
  MIN_VERSION_REQUIRED: "1.0.0",
  SUPPORT_EMAIL: "support@optimushalal.com",
  PRIVACY_POLICY_URL: "https://optimushalal.com/privacy",
  TERMS_URL: "https://optimushalal.com/terms",
} as const;

/**
 * Certification Authorities
 */
export const CERTIFICATION_AUTHORITIES = [
  { id: "avs", name: "AVS", fullName: "A Votre Service", trusted: true },
  { id: "achahada", name: "Achahada", fullName: "Achahada", trusted: true },
  { id: "argml", name: "ARGML", fullName: "Rassemblement des Grandes Mosquées de Lyon", trusted: true },
  { id: "mci", name: "MCI", fullName: "Mosquée de Paris", trusted: true },
] as const;

/**
 * Halal Status Types
 */
export enum HalalStatus {
  CERTIFIED = "certified",
  DOUBTFUL = "doubtful",
  NOT_HALAL = "not_halal",
  UNKNOWN = "unknown",
}

/**
 * Ethical Score Criteria
 */
export const ETHICAL_CRITERIA = [
  { id: "bio", label: "Bio", icon: "eco" },
  { id: "fair_trade", label: "Commerce équitable", icon: "handshake" },
  { id: "no_gmo", label: "Sans OGM", icon: "block" },
  { id: "local", label: "Local", icon: "location_on" },
  { id: "sustainable", label: "Durable", icon: "recycling" },
] as const;

/**
 * Store Categories
 */
export const STORE_CATEGORIES = [
  { id: "butcher", label: "Boucherie", icon: "restaurant" },
  { id: "grocery", label: "Épicerie", icon: "shopping_basket" },
  { id: "restaurant", label: "Restaurant", icon: "restaurant_menu" },
  { id: "bakery", label: "Boulangerie", icon: "bakery_dining" },
] as const;
