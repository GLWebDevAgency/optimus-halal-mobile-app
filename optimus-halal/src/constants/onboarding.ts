/**
 * Onboarding Slide Configuration
 *
 * Slim metadata — all display text lives in i18n.
 * Each slide has an ID (used as i18n key), a hero icon name,
 * and an accent color for glow / decorative elements.
 */

import { gold, primary } from "@/theme/colors";

export type OnboardingSlideId = "brand" | "scanner" | "trust" | "map" | "cta";

export interface OnboardingSlideConfig {
  id: OnboardingSlideId;
  /** Accent color for glow ring / decorative elements */
  accentColor: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideConfig[] = [
  { id: "brand", accentColor: gold[500] },
  { id: "scanner", accentColor: primary[500] },
  { id: "trust", accentColor: gold[500] },
  { id: "map", accentColor: primary[400] },
  { id: "cta", accentColor: gold[500] },
];
