/**
 * Onboarding Slide Configuration
 *
 * Slim metadata — all display text lives in i18n.
 * Each slide has an ID (used as i18n key), a hero icon name,
 * and an accent color for glow / decorative elements.
 */

import { gold, primary } from "@/theme/colors";

export type OnboardingSlideId = "brand" | "scanner" | "madhab" | "map" | "cta";

export interface OnboardingSlideConfig {
  id: OnboardingSlideId;
  /** Icon name for the hero icon (ignored for 'brand' & 'cta' which use logo) */
  heroIcon: string;
  /** Accent color for glow ring / decorative elements */
  accentColor: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideConfig[] = [
  {
    id: "brand",
    heroIcon: "verified",
    accentColor: gold[500],
  },
  {
    id: "scanner",
    heroIcon: "qr-code-scanner",
    accentColor: primary[500],
  },
  {
    id: "madhab",
    heroIcon: "auto-stories",
    accentColor: gold[400],
  },
  {
    id: "map",
    heroIcon: "place",
    accentColor: primary[400],
  },
  {
    id: "cta",
    heroIcon: "star",
    accentColor: gold[500],
  },
];
