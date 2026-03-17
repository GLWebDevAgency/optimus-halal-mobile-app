/**
 * Scan Result — Shared TypeScript Types
 *
 * Interfaces used across all scan result section cards.
 * Keeps prop types DRY between components.
 *
 * @module components/scan/scan-types
 */

import type { HalalStatusKey } from "./scan-constants";

// ─── Madhab ────────────────────────────────
export type MadhabId = "hanafi" | "maliki" | "shafii" | "hanbali" | "general";

/** A single madhab's verdict on the product.
 * NOTE: Backend returns {madhab, status, conflictingAdditives, conflictingIngredients}
 * — there is NO numeric score per madhab. Trust bars are removed in favor of
 * status-only display (dot + label). */
export interface MadhabVerdict {
  madhab: MadhabId;
  status: HalalStatusKey;
  conflictingAdditives: Array<{
    code: string;
    name: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
  conflictingIngredients: Array<{
    pattern: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
}

/** A single nutrient's data for the nutrient bar */
export interface NutrientItem {
  key: string;
  name: string;
  value: number;
  unit: "g" | "mg";
  percentage: number;
  level: "very_low" | "low" | "moderate" | "high" | "very_high";
  isPositive: boolean;
  indented?: boolean;
}

/** Dietary label from product analysis.
 * DietaryChip requires `status` and `icon` — not just `label`. */
export interface DietaryItem {
  key: string;
  label: string;
  status: "safe" | "contains" | "unknown";
  icon: string;
}

/** Additive with Yuka-style danger level */
export interface AdditiveItem {
  code: string;
  name: string;
  category: string;
  dangerLevel: 1 | 2 | 3 | 4;
  madhabRulings?: Record<string, HalalStatusKey>;
  healthEffects?: HealthEffect[];
  scholarlyRefs?: ScholarlyRef[];
}

/** Health effect on an additive */
export interface HealthEffect {
  type: "endocrine_disruptor" | "allergen" | "irritant" | "carcinogenic";
  label: string;
  potential: boolean;
}

/** Scholarly reference for halal ruling */
export interface ScholarlyRef {
  source: string;
  detail?: string;
}

/** Detected additive from OFF additives_tags, enriched with DB data */
export interface DetectedAdditive {
  code: string;
  nameFr: string;
  nameEn: string | null;
  category: string;
  origin: string;
  halalStatusDefault: string;
  toxicityLevel: string;
  healthEffectType: string | null;
  healthEffectConfirmed: boolean;
  riskPregnant: boolean;
  riskChildren: boolean;
  healthEffectsFr: string | null;
}

/** Personal alert from user profile (allergens, health, boycott) */
export interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  icon?: string;  // Phosphor icon name override (optional)
}

// ─── Certifier Badge ───────────────────────
// Note: VerdictHero.tsx has a LOCAL CertifierInfo with different shape ({id, name, trustScore, lastVerifiedAt}).
// This exported type is for the reusable CertifierBadge component. Consider renaming VerdictHero's local type
// to avoid confusion if you work on both files.
export interface CertifierInfo {
  /** Certifier slug for CertifierLogo lookup (e.g. "argml-mosquee-de-lyon") */
  id?: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  trustScore: number;
}

// ─── Alternatives UI ───────────────────────
export interface AlternativeProductUI {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  quantity?: string;
  healthScore: number | null;
  halalStatus: HalalStatusKey;
  certifier: CertifierInfo | null;
  matchReason: string;
  matchType: "exact" | "category" | "similar";
  price?: number;
  availableAt?: string[];
}
