/**
 * Naqiy — Configuration & Feature Flags
 *
 * Système de feature flags pour activer/désactiver des fonctionnalités.
 * Toutes les flags sont définies dans `defaultFeatureFlags` ci-dessous.
 *
 * ┌─────────────────────────┬────────┬──────────────────────────────────────────────┐
 * │ Flag                    │ Actif  │ Description                                  │
 * ├─────────────────────────┼────────┼──────────────────────────────────────────────┤
 * │ marketplaceEnabled      │   ✗    │ Marketplace produits certifiés (Coming Soon) │
 * │ paymentsEnabled         │   ✓    │ Paiement in-app (RevenueCat)                 │
 * │ offlineMode             │   ✓    │ Cache hors-ligne MMKV                        │
 * │ pushNotifications       │   ✓    │ Notifications push (Expo Notifications)      │
 * │ aiScanner               │   ✗    │ Analyse ingrédients par Gemini AI            │
 * │ gamificationEnabled     │   ✓    │ XP, niveaux, badges, streak                  │
 * │ socialSharing           │   ✓    │ Partage de résultats de scan                 │
 * │ analyticsEnabled        │   ✓    │ PostHog + Sentry analytics                   │
 * │ socialAuthEnabled       │   ✗    │ Google / Apple Sign-In (OAuth)               │
 * │ alternativesEnabled     │   ✗    │ Alternatives halal certifiées (V2)           │
 * │ alertsEnabled           │   ✗    │ Veille éthique halal (alertes push)          │
 * │ featuredArticlesEnabled │   ✓    │ Section "À la une" sur le home               │
 * │ paywallEnabled          │   ✓    │ Gate Naqiy+ (paywall RevenueCat)             │
 * │ favoritesLimitEnabled   │   ✓    │ Limite favoris pour free tier                │
 * │ scanHistoryLimitEnabled │   ✗    │ Limite historique scans free tier             │
 * │ offlineCacheEnabled     │   ✗    │ Cache offline premium                        │
 * │ premiumMapEnabled       │   ✗    │ Carte enrichie premium                       │
 * │ healthProfileEnabled    │   ✗    │ Profil santé / allergènes personnalisé       │
 * │ authMode (variant)      │  "v1"  │ Mode auth: "v1" | "v2" | "hybrid"           │
 * └─────────────────────────┴────────┴──────────────────────────────────────────────┘
 *
 * Pour activer une flag : passer la valeur à `true` dans `defaultFeatureFlags`.
 * Écrans impactés notables :
 *   - socialAuthEnabled  → signup.tsx (boutons Google/Apple + divider)
 *   - alertsEnabled      → profile.tsx (onglet alertes), tabs/_layout
 *   - marketplaceEnabled → marketplace tab, product pages
 *   - authMode           → welcome.tsx (route vers login ou magic-link)
 */

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
export const POSTHOG_HOST = "https://eu.i.posthog.com";

/**
 * Authentication Mode
 *
 * Controlled via remote feature flag "authMode" (variant type):
 * - "v1": Classic email/password login
 * - "v2": Magic Link only (passwordless)
 * - "hybrid": Both options available on welcome screen
 */
export type AuthMode = "v1" | "v2" | "hybrid";

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
  // Halal alternatives (haram/doubtful scan results)
  alternativesEnabled: boolean;
  // Alertes éthiques (veille halal)
  alertsEnabled: boolean;
  // Section "À la une" (articles featured sur le home)
  featuredArticlesEnabled: boolean;
  // Authentification sociale (Google / Apple Sign-In)
  socialAuthEnabled: boolean;
  // Premium gates
  paywallEnabled: boolean;
  favoritesLimitEnabled: boolean;
  scanHistoryLimitEnabled: boolean;
  offlineCacheEnabled: boolean;
  premiumMapEnabled: boolean;
  healthProfileEnabled: boolean;
  // Certifications préférées (sélection certifieurs de confiance)
  certificationsPreferencesEnabled: boolean;
  // Auth mode (variant flag: "v1" | "v2" | "hybrid")
  authMode: AuthMode;
}

export const defaultFeatureFlags: FeatureFlags = {
  marketplaceEnabled: false, // Désactivé — pas de vrais produits, Coming Soon par défaut
  paymentsEnabled: true,
  offlineMode: true,
  pushNotifications: true,
  aiScanner: false,
  gamificationEnabled: false, // Désactivé — MVP, gamification différée
  socialSharing: true,
  analyticsEnabled: true,
  socialAuthEnabled: false, // Désactivé — Google/Apple Sign-In à intégrer (OAuth)
  alternativesEnabled: false, // Désactivé — V2, alternatives certifiées à venir
  alertsEnabled: false, // Désactivé — feature en cours de développement
  featuredArticlesEnabled: true,
  paywallEnabled: true,
  favoritesLimitEnabled: true,
  scanHistoryLimitEnabled: true,
  offlineCacheEnabled: false,
  premiumMapEnabled: false,
  healthProfileEnabled: true,
  certificationsPreferencesEnabled: false,
  authMode: "v1",
};

/**
 * App Constants
 */
export const APP_CONFIG = {
  APP_NAME: "Naqiy",
  TAGLINE: "Scanne. Comprends. Choisis.",
  VERSION: "1.0.0",
  MIN_VERSION_REQUIRED: "1.0.0",
  SUPPORT_EMAIL: "support@naqiy.app",
  PRIVACY_POLICY_URL: "https://naqiy.app/confidentialite",
  TERMS_URL: "https://naqiy.app/cgu",
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
