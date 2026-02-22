/**
 * Naqiy — Feature Flags Configuration
 *
 * Système de feature flags pour activer/désactiver des fonctionnalités
 */

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
export const POSTHOG_HOST = "https://eu.i.posthog.com";

/**
 * Authentication Mode Configuration
 * 
 * V1 = Classic (email/password) only
 * V2 = Magic Link only (passwordless) - DEFAULT
 * HYBRID = Both options available
 */
export type AuthMode = "v1" | "v2" | "hybrid";

export const AUTH_CONFIG = {
  /**
   * Mode d'authentification actif
   * - "v1": Authentification classique (email/password) - ACTIF pour V1
   * - "v2": Magic Link uniquement (sans mot de passe)
   * - "hybrid": Les deux options disponibles
   */
  mode: "hybrid" as AuthMode,
} as const;

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
  // Premium gates
  paywallEnabled: boolean;
  favoritesLimitEnabled: boolean;
  scanHistoryLimitEnabled: boolean;
  offlineCacheEnabled: boolean;
  premiumMapEnabled: boolean;
  healthProfileEnabled: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  marketplaceEnabled: false, // Désactivé — pas de vrais produits, Coming Soon par défaut
  paymentsEnabled: false,
  offlineMode: true,
  pushNotifications: true,
  aiScanner: false,
  gamificationEnabled: true,
  socialSharing: true,
  analyticsEnabled: true,
  paywallEnabled: false,
  favoritesLimitEnabled: false,
  scanHistoryLimitEnabled: false,
  offlineCacheEnabled: false,
  premiumMapEnabled: false,
  healthProfileEnabled: false,
};

/**
 * App Constants
 */
export const APP_CONFIG = {
  APP_NAME: "Naqiy",
  TAGLINE: "Ton halal, en toute clarté.",
  VERSION: "1.0.0",
  MIN_VERSION_REQUIRED: "1.0.0",
  SUPPORT_EMAIL: "support@naqiy.com",
  PRIVACY_POLICY_URL: "https://naqiy.com/privacy",
  TERMS_URL: "https://naqiy.com/terms",
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
  HALAL = "halal",
  DOUBTFUL = "doubtful",
  HARAM = "haram",
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
