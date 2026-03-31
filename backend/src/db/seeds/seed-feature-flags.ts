/**
 * Feature Flags seed — called by run-all.ts
 *
 * Seeds all feature flags used by the mobile app into the feature_flags table.
 * Uses ON CONFLICT DO NOTHING on the unique `key` column — existing flags
 * are never overwritten (admin changes are preserved across deploys).
 *
 * Flag values here mirror defaultFeatureFlags in the mobile app's config.ts.
 * The admin dashboard is the source of truth for runtime values.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

interface FlagSeed {
  key: string;
  label: string;
  description: string;
  flagType: "boolean" | "percentage" | "variant";
  enabled: boolean;
  defaultValue: unknown;
  rolloutPercentage: number;
  variants: string[] | null;
}

const FLAGS: FlagSeed[] = [
  // ── Core Features ─────────────────────────────────────────
  {
    key: "paymentsEnabled",
    label: "Paiement in-app",
    description: "Active le paiement RevenueCat pour Naqiy+",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "paywallEnabled",
    label: "Paywall Naqiy+",
    description: "Gate premium (limite scans, favoris, etc.)",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "marketplaceEnabled",
    label: "Marketplace",
    description: "Marketplace produits halal certifiés (Coming Soon)",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Scan & Analysis ───────────────────────────────────────
  {
    key: "aiScanner",
    label: "Scanner IA",
    description: "Analyse ingrédients par Gemini AI",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "scanHistoryLimitEnabled",
    label: "Limite historique scans",
    description: "Limite l'historique de scans pour les utilisateurs free",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Social & Engagement ───────────────────────────────────
  {
    key: "gamificationEnabled",
    label: "Gamification",
    description: "XP, niveaux, badges, streak",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "socialSharing",
    label: "Partage social",
    description: "Partage de résultats de scan",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Content ───────────────────────────────────────────────
  {
    key: "alertsEnabled",
    label: "Alertes éthiques",
    description: "Veille éthique halal (alertes push)",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "featuredArticlesEnabled",
    label: "Articles à la une",
    description: "Section 'À la une' sur le home",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Premium Gates ─────────────────────────────────────────
  {
    key: "favoritesLimitEnabled",
    label: "Limite favoris",
    description: "Limite le nombre de favoris pour les utilisateurs free",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "offlineCacheEnabled",
    label: "Cache offline premium",
    description: "Cache offline pour les utilisateurs premium",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "premiumMapEnabled",
    label: "Carte enrichie premium",
    description: "Carte enrichie avec filtres avancés pour premium",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "healthProfileEnabled",
    label: "Profil santé",
    description: "Profil santé / allergènes personnalisé",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Infrastructure ────────────────────────────────────────
  {
    key: "offlineMode",
    label: "Mode hors-ligne",
    description: "Cache hors-ligne MMKV",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "pushNotifications",
    label: "Notifications push",
    description: "Notifications push (Expo Notifications)",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "analyticsEnabled",
    label: "Analytics",
    description: "PostHog + Sentry analytics",
    flagType: "boolean",
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Preferences ─────────────────────────────────────────
  {
    key: "certificationsPreferencesEnabled",
    label: "Certifications préférées",
    description: "Permet aux utilisateurs de sélectionner leurs certifieurs de confiance pour personnaliser les résultats de scan",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },

  // ── Auth ──────────────────────────────────────────────────
  {
    key: "socialAuthEnabled",
    label: "Auth sociale",
    description: "Google / Apple Sign-In (OAuth)",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "alternativesEnabled",
    label: "Alternatives halal",
    description: "Alternatives halal certifiées (V2)",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
  {
    key: "authMode",
    label: "Mode d'authentification",
    description: "Contrôle le flow d'auth: v1 (classique), v2 (magic link), hybrid (les deux)",
    flagType: "variant",
    enabled: true,
    defaultValue: "v1",
    rolloutPercentage: 100,
    variants: null,
  },
];

export async function seedFeatureFlags(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const flag of FLAGS) {
    // ON CONFLICT DO NOTHING — never overwrite admin changes
    const result = await db.execute(sql`
      INSERT INTO feature_flags (key, label, description, flag_type, enabled, default_value, rollout_percentage, variants, rules)
      VALUES (
        ${flag.key},
        ${flag.label},
        ${flag.description},
        ${flag.flagType},
        ${flag.enabled},
        ${JSON.stringify(flag.defaultValue)}::jsonb,
        ${flag.rolloutPercentage},
        ${flag.variants ? JSON.stringify(flag.variants) : null}::jsonb,
        '[]'::jsonb
      )
      ON CONFLICT (key) DO NOTHING
    `);

    // postgres.js returns rowCount for INSERT
    if ((result as unknown as { rowCount: number }).rowCount > 0) {
      count++;
    }
  }

  return count;
}
