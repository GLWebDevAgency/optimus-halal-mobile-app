/**
 * Scan Result — Shared TypeScript Types
 *
 * Interfaces used across all scan result section cards.
 * Keeps prop types DRY between components.
 *
 * @module components/scan/scan-types
 */

import type { HalalStatusKey } from "./scan-constants";

/** A single madhab's verdict on the product.
 * NOTE: Backend returns {madhab, status, conflictingAdditives, conflictingIngredients}
 * — there is NO numeric score per madhab. Trust bars are removed in favor of
 * status-only display (dot + label). */
export interface MadhabVerdict {
  madhab: "hanafi" | "shafii" | "maliki" | "hanbali";
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
  level: "low" | "moderate" | "high";
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
