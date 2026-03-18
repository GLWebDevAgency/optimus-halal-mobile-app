# Naqiy Signature Scan Result — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign scan-result screen from BentoGrid/bottom-sheet architecture to Yuka-inspired clean card scroll continu with Score Ring, 4 madhab rows, nutrient bars, additive danger badges — ultra premium, pixel perfect.

**Architecture:** Replace BentoGrid dashboard + 4 bottom sheets with 7 inline section cards in a continuous scroll. ScoreRing SVG as visual anchor in hero. SectionCard wrapper for consistent surface system. springNaqiy on all animations.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, react-native-reanimated v4, react-native-svg, expo-blur, phosphor-react-native, @gorhom/bottom-sheet (kept for madhab/trust/score/nutrient detail sheets only)

**Spec:** `docs/superpowers/specs/2026-03-12-naqiy-signature-scan-result-design.md`

---

## File Structure

### Create (7 new files)

| File | Responsibility |
|------|----------------|
| `optimus-halal/src/components/scan/scan-types.ts` | Shared TypeScript interfaces: MadhabVerdict, NutrientItem, DietaryItem, AdditiveItem, HealthEffect, ScholarlyRef |
| `optimus-halal/src/components/scan/ScoreRing.tsx` | Animated SVG semi-arc (180°) score display with counter |
| `optimus-halal/src/components/scan/SectionCard.tsx` | Standard card wrapper: surface system + section header pattern |
| `optimus-halal/src/components/scan/AlertStripCard.tsx` | Personal alerts section card with severity-sorted sub-cards |
| `optimus-halal/src/components/scan/HalalVerdictCard.tsx` | 4 madhab rows + consensus badge + footer |
| `optimus-halal/src/components/scan/HealthNutritionCard.tsx` | Health dashboard: ScoreRing + badges + nutrient bars + allergens |
| `optimus-halal/src/components/scan/AdditivesCard.tsx` | Additive analysis with 4-level danger badges + madhab rulings |

### Modify (7 files)

| File | Changes |
|------|---------|
| `optimus-halal/src/components/scan/scan-constants.ts` | Add NUTRIENT_THRESHOLDS, ADDITIVE_RISK_LEVELS, NUTRISCORE_COLORS |
| `optimus-halal/src/components/scan/VerdictHero.tsx` | Add ScoreRing component, adjust layout for ring placement |
| `optimus-halal/src/components/scan/CompactStickyHeader.tsx` | Add favorite button |
| `optimus-halal/src/components/scan/ScanBottomBar.tsx` | Add gold gradient CTA pill, context-aware label |
| `optimus-halal/src/components/scan/AlternativesSection.tsx` | Wrap in SectionCard, use i18n keys for headers |
| `optimus-halal/src/components/scan/NutrientBar.tsx` | Rewrite to spec: single-row layout with inline level + % |
| `optimus-halal/app/scan-result.tsx` | Replace BentoGrid with direct section cards, remove 4 detail bottom sheets |

### Delete (16 files)

| File | Replaced by |
|------|-------------|
| `src/components/scan/AlertStrip.tsx` | AlertStripCard |
| `src/components/scan/AlertsTile.tsx` | AlertStripCard |
| `src/components/scan/AlternativesTile.tsx` | AlternativesSection (modified) |
| `src/components/scan/BentoGrid.tsx` | Direct cards in scan-result |
| `src/components/scan/BentoTile.tsx` | SectionCard |
| `src/components/scan/HalalActionCard.tsx` | HalalVerdictCard footer |
| `src/components/scan/HalalAnalysisSection.tsx` | AdditivesCard + HalalVerdictCard |
| `src/components/scan/HalalMadhabTile.tsx` | HalalVerdictCard |
| `src/components/scan/HealthNutritionSection.tsx` | HealthNutritionCard |
| `src/components/scan/HealthScoreTile.tsx` | HealthNutritionCard |
| `src/components/scan/KeyCharacteristicsGrid.tsx` | Inline in HealthNutritionCard |
| `src/components/scan/MadhabScoreRing.tsx` | Score rows in HalalVerdictCard |
| `src/components/scan/MadhabVerdictCard.tsx` | HalalVerdictCard (new file) |
| `src/components/scan/PersonalAlerts.tsx` | AlertStripCard |
| `src/components/scan/ScanResultTabBar.tsx` | Scroll continu (no tabs) |
| `src/components/scan/ScoreDashboardCard.tsx` | HealthNutritionCard |

### i18n (3 files)

| File | Changes |
|------|---------|
| `optimus-halal/src/i18n/translations/fr.ts` | Add ~45 new keys in scanResult section |
| `optimus-halal/src/i18n/translations/en.ts` | Same keys, English |
| `optimus-halal/src/i18n/translations/ar.ts` | Same keys, Arabic |

---

## Chunk 1: Foundation

### Task 1: Create scan-types.ts

**Files:**
- Create: `optimus-halal/src/components/scan/scan-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
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
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to scan-types.ts

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/scan-types.ts
git commit -m "feat(scan): add shared TypeScript types for scan result cards"
```

---

### Task 2: Add constants to scan-constants.ts

**Files:**
- Modify: `optimus-halal/src/components/scan/scan-constants.ts`

- [ ] **Step 1: Add nutrient thresholds, additive risk mappings, and NutriScore colors**

Append the following after the existing `HEALTH_SCORE_LABEL_KEYS` export (line 105):

```typescript
// ── Nutrient Thresholds (per 100g, Yuka-adapted) ──

export interface NutrientThreshold {
  low: number;
  high: number;
}

/** Negative nutrients: low=good, high=bad */
export const NEGATIVE_NUTRIENT_THRESHOLDS: Record<string, NutrientThreshold> = {
  fat: { low: 3, high: 20 },
  saturated_fat: { low: 1.5, high: 5 },
  sugar: { low: 5, high: 12.5 },
  salt: { low: 0.3, high: 1.5 },
};

/** Positive nutrients: low=bad, high=good */
export const POSITIVE_NUTRIENT_THRESHOLDS: Record<string, NutrientThreshold> = {
  fiber: { low: 1.5, high: 3 },
  protein: { low: 4, high: 8 },
};

/**
 * Get nutrient level from value and thresholds.
 * For negative nutrients: <low = "low", >high = "high", else "moderate"
 * For positive nutrients: same scale but interpretation is inverted in UI
 */
export function getNutrientLevel(
  value: number,
  thresholds: NutrientThreshold,
): "low" | "moderate" | "high" {
  if (value < thresholds.low) return "low";
  if (value > thresholds.high) return "high";
  return "moderate";
}

// ── Additive Risk Levels (Yuka 4-level system) ──

export const ADDITIVE_RISK_LEVELS = {
  1: { labelKey: "riskHigh" as const, color: "#ef4444" },    // haram.base
  2: { labelKey: "riskMedium" as const, color: "#f97316" },  // doubtful.base
  3: { labelKey: "riskLimited" as const, color: "#FECB02" }, // yellow
  4: { labelKey: "riskNone" as const, color: "#22c55e" },    // halal.base
} as const;

// ── NutriScore / NOVA / EcoScore Badge Colors ──

export const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

export const NOVA_COLORS: Record<number, string> = {
  1: "#038141",
  2: "#85BB2F",
  3: "#FECB02",
  4: "#E63E11",
};

// ── Nutrient Bar Colors (status-based) ──

export const NUTRIENT_BAR_COLORS = {
  negative: { low: "#22c55e", moderate: "#f97316", high: "#ef4444" },
  positive: { low: "#ef4444", moderate: "#f97316", high: "#22c55e" },
} as const;

// ── Letter Spacing Tokens ──

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
} as const;
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/scan-constants.ts
git commit -m "feat(scan): add nutrient thresholds, additive risk levels, badge colors to constants"
```

---

### Task 3: Add i18n keys (fr, en, ar)

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

- [ ] **Step 1: Add new keys to French translations**

Find the end of the existing `scanResult` section in `fr.ts` and add these keys before the closing brace. Add them after the last existing key (around `indicatorUnknown` or later):

```typescript
    // ── Naqiy Signature v2 keys ──
    // Section headers
    alertsPersonnelles: "ALERTES PERSONNELLES",
    avisEcoles: "AVIS DES 4 ÉCOLES",
    santeNutrition: "SANTÉ & NUTRITION",
    additifsDetectes: "ADDITIFS DÉTECTÉS",
    detailNutritionnel: "Détail nutritionnel",
    allergenesTitle: "Allergènes",
    tracesLabel: "Traces",
    decouvrirAussi: "DÉCOUVRIR AUSSI",
    alternativesPriority: "DES ALTERNATIVES EXISTENT",
    alternativesDiscover: "DÉCOUVRIR AUSSI",
    // Score labels
    scoreSante: "Score Santé",
    scoreExcellent: "Excellent",
    scoreBon: "Bon",
    scoreMediocre: "Médiocre",
    scoreInsuffisant: "Insuffisant",
    scoreTresInsuffisant: "Très insuffisant",
    donneesInsuffisantes: "Données insuffisantes",
    // Nutrient levels
    levelLow: "Bas",
    levelModerate: "Modéré",
    levelHigh: "Élevé",
    // Additive risk levels
    riskHigh: "Risque élevé",
    riskMedium: "Risque modéré",
    riskLimited: "Risque limité",
    riskNone: "Sans risque",
    // Additive categories
    additiveCategoryPreservative: "Conservateur",
    additiveCategoryColour: "Colorant",
    additiveCategoryEmulsifier: "Émulsifiant",
    additiveCategoryStabiliser: "Stabilisant",
    additiveCategoryThickener: "Épaississant",
    additiveCategoryAntioxidant: "Antioxydant",
    additiveCategoryAcidityRegulator: "Régulateur d'acidité",
    additiveCategoryFlavourEnhancer: "Exhausteur de goût",
    additiveCategorySweetener: "Édulcorant",
    additiveCategoryRaisingAgent: "Agent levant",
    additiveCategoryAntiCaking: "Anti-agglomérant",
    additiveCategoryGlazingAgent: "Agent d'enrobage",
    additiveCategoryHumectant: "Humectant",
    additiveCategorySequestrant: "Séquestrant",
    additiveCategoryFoamingAgent: "Agent moussant",
    additiveCategoryOther: "Autre",
    // Madhab
    unanime: "Unanime",
    decisionNote: "La décision vous appartient.",
    analyseAlgorithmique: "Analyse algorithmique",
    // Alternatives
    voirTout: "Voir tout ({{count}})",
    aucuneAlternative: "Aucune alternative trouvée",
    // Action bar
    ouAcheter: "Où acheter ?",
    alternativesHalal: "Alternatives halal",
    // Sticky header
    conforme: "Conforme",
    nonConforme: "Non Conforme",
    doubtfulLabel: "Douteux",
    // Misc
    voirDetail: "Voir le détail",
    donneesAnciennes: "Données anciennes",
    communityVerified: "Vérifié par {{count}} membres",
    disclaimer: "Les informations fournies le sont à titre informatif. Naqiy ne se substitue pas à un avis religieux qualifié. La décision vous appartient.",
    naqiyScore: "NAQIY SCORE",
```

- [ ] **Step 2: Add same keys to English translations**

Same position in `en.ts`:

```typescript
    // ── Naqiy Signature v2 keys ──
    alertsPersonnelles: "PERSONAL ALERTS",
    avisEcoles: "VERDICT BY 4 SCHOOLS",
    santeNutrition: "HEALTH & NUTRITION",
    additifsDetectes: "ADDITIVES DETECTED",
    detailNutritionnel: "Nutritional detail",
    allergenesTitle: "Allergens",
    tracesLabel: "Traces",
    decouvrirAussi: "DISCOVER MORE",
    alternativesPriority: "ALTERNATIVES AVAILABLE",
    alternativesDiscover: "DISCOVER MORE",
    scoreSante: "Health Score",
    scoreExcellent: "Excellent",
    scoreBon: "Good",
    scoreMediocre: "Poor",
    scoreInsuffisant: "Bad",
    scoreTresInsuffisant: "Very bad",
    donneesInsuffisantes: "Insufficient data",
    levelLow: "Low",
    levelModerate: "Moderate",
    levelHigh: "High",
    riskHigh: "High risk",
    riskMedium: "Moderate risk",
    riskLimited: "Limited risk",
    riskNone: "No risk",
    additiveCategoryPreservative: "Preservative",
    additiveCategoryColour: "Colour",
    additiveCategoryEmulsifier: "Emulsifier",
    additiveCategoryStabiliser: "Stabiliser",
    additiveCategoryThickener: "Thickener",
    additiveCategoryAntioxidant: "Antioxidant",
    additiveCategoryAcidityRegulator: "Acidity regulator",
    additiveCategoryFlavourEnhancer: "Flavour enhancer",
    additiveCategorySweetener: "Sweetener",
    additiveCategoryRaisingAgent: "Raising agent",
    additiveCategoryAntiCaking: "Anti-caking agent",
    additiveCategoryGlazingAgent: "Glazing agent",
    additiveCategoryHumectant: "Humectant",
    additiveCategorySequestrant: "Sequestrant",
    additiveCategoryFoamingAgent: "Foaming agent",
    additiveCategoryOther: "Other",
    unanime: "Unanimous",
    decisionNote: "The decision is yours.",
    analyseAlgorithmique: "Algorithmic analysis",
    voirTout: "See all ({{count}})",
    aucuneAlternative: "No alternatives found",
    ouAcheter: "Where to buy?",
    alternativesHalal: "Halal alternatives",
    conforme: "Compliant",
    nonConforme: "Non-Compliant",
    doubtfulLabel: "Doubtful",
    voirDetail: "See details",
    donneesAnciennes: "Stale data",
    communityVerified: "Verified by {{count}} members",
    disclaimer: "The information provided is for informational purposes only. Naqiy does not substitute for qualified religious advice. The decision is yours.",
    naqiyScore: "NAQIY SCORE",
```

- [ ] **Step 3: Add same keys to Arabic translations**

Same position in `ar.ts`:

```typescript
    // ── Naqiy Signature v2 keys ──
    alertsPersonnelles: "تنبيهات شخصية",
    avisEcoles: "رأي المذاهب الأربعة",
    santeNutrition: "الصحة والتغذية",
    additifsDetectes: "المضافات المكتشفة",
    detailNutritionnel: "التفاصيل الغذائية",
    allergenesTitle: "مسببات الحساسية",
    tracesLabel: "آثار",
    decouvrirAussi: "اكتشف أيضاً",
    alternativesPriority: "بدائل متوفرة",
    alternativesDiscover: "اكتشف أيضاً",
    scoreSante: "درجة الصحة",
    scoreExcellent: "ممتاز",
    scoreBon: "جيد",
    scoreMediocre: "متوسط",
    scoreInsuffisant: "ضعيف",
    scoreTresInsuffisant: "ضعيف جداً",
    donneesInsuffisantes: "بيانات غير كافية",
    levelLow: "منخفض",
    levelModerate: "معتدل",
    levelHigh: "مرتفع",
    riskHigh: "خطر مرتفع",
    riskMedium: "خطر معتدل",
    riskLimited: "خطر محدود",
    riskNone: "بدون خطر",
    additiveCategoryPreservative: "مادة حافظة",
    additiveCategoryColour: "ملوّن",
    additiveCategoryEmulsifier: "مستحلب",
    additiveCategoryStabiliser: "مثبّت",
    additiveCategoryThickener: "مكثّف",
    additiveCategoryAntioxidant: "مضاد أكسدة",
    additiveCategoryAcidityRegulator: "منظم حموضة",
    additiveCategoryFlavourEnhancer: "محسّن نكهة",
    additiveCategorySweetener: "مُحلّي",
    additiveCategoryRaisingAgent: "عامل رفع",
    additiveCategoryAntiCaking: "مضاد تكتل",
    additiveCategoryGlazingAgent: "عامل تلميع",
    additiveCategoryHumectant: "مرطّب",
    additiveCategorySequestrant: "عامل حبس",
    additiveCategoryFoamingAgent: "عامل رغوة",
    additiveCategoryOther: "أخرى",
    unanime: "إجماع",
    decisionNote: "القرار يعود لك.",
    analyseAlgorithmique: "تحليل خوارزمي",
    voirTout: "عرض الكل ({{count}})",
    aucuneAlternative: "لم يتم العثور على بدائل",
    ouAcheter: "أين تشتري؟",
    alternativesHalal: "بدائل حلال",
    conforme: "مطابق",
    nonConforme: "غير مطابق",
    doubtfulLabel: "مشكوك",
    voirDetail: "عرض التفاصيل",
    donneesAnciennes: "بيانات قديمة",
    communityVerified: "تم التحقق بواسطة {{count}} أعضاء",
    disclaimer: "المعلومات المقدمة هي لأغراض إعلامية فقط. نقيّ لا يغني عن استشارة دينية مؤهلة. القرار يعود لك.",
    naqiyScore: "نتيجة نقيّ",
```

- [ ] **Step 4: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): add Naqiy Signature v2 scan result keys (fr, en, ar)"
```

---

### Task 4: Create ScoreRing.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/ScoreRing.tsx`

- [ ] **Step 1: Create the ScoreRing component**

```tsx
/**
 * ScoreRing — Animated SVG Semi-Arc Score Display
 *
 * A 180° top-half arc that fills based on a 0-100 score.
 * Naqiy's signature visual anchor — more elegant than Yuka's solid circle.
 *
 * Uses react-native-svg for the arc and react-native-reanimated
 * for animated stroke-dashoffset fill + counter.
 *
 * @module components/scan/ScoreRing
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Types ──

export interface ScoreRingProps {
  /** Score 0-100, or null for no data */
  score: number | null;
  /** Container width (default 80) */
  size?: number;
  /** Arc stroke width (default 5) */
  strokeWidth?: number;
  /** Whether to animate on mount (default true) */
  animated?: boolean;
  /** Optional label below score number */
  label?: string;
  /** Label color override */
  labelColor?: string;
}

// ── Helpers ──

function getScoreColor(score: number | null): string {
  if (score === null) return "#6b7280"; // unknown.base
  if (score >= 70) return halalStatusTokens.halal.base;
  if (score >= 40) return halalStatusTokens.doubtful.base;
  return halalStatusTokens.haram.base;
}

/**
 * Describe a 180° arc (top half) as an SVG path.
 * Arc goes from left to right along the top semicircle.
 */
function describeArc(cx: number, cy: number, r: number): string {
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}

// ── Component ──

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 5,
  animated = true,
  label,
  labelColor,
}: ScoreRingProps) {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLength = Math.PI * r; // half circle circumference

  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(
    reducedMotion || !animated ? (score ?? 0) : 0,
  );

  const scoreColor = getScoreColor(score);
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    const target = score !== null ? score / 100 : 0;
    if (reducedMotion || !animated) {
      progress.value = target;
      setDisplayScore(score ?? 0);
    } else {
      progress.value = withTiming(target, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [score, animated, reducedMotion]);

  // Animate the counter
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (val) => {
      if (!reducedMotion && animated) {
        runOnJS(setDisplayScore)(val);
      }
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLength * (1 - progress.value),
  }));

  const arcPath = describeArc(cx, cy, r);
  const containerHeight = size / 2 + strokeWidth + 24; // half + stroke + text space

  return (
    <View style={[styles.container, { width: size, height: containerHeight }]}>
      <Svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {/* Track */}
        <Path
          d={arcPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {score !== null && (
          <AnimatedPath
            d={arcPath}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            animatedProps={animatedProps}
          />
        )}
      </Svg>

      {/* Score number */}
      <Text style={[styles.scoreNumber, { color: scoreColor }]}>
        {score !== null ? displayScore : "—"}
      </Text>

      {/* Label below */}
      {label && (
        <Text style={[styles.scoreLabel, { color: labelColor ?? scoreColor }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: fontSizeTokens.h2,
    fontWeight: fontWeightTokens.black,
    marginTop: -4,
  },
  scoreLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/ScoreRing.tsx
git commit -m "feat(scan): add ScoreRing animated SVG semi-arc component"
```

---

### Task 5: Create SectionCard.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/SectionCard.tsx`

- [ ] **Step 1: Create the SectionCard wrapper component**

```tsx
/**
 * SectionCard — Standard Card Wrapper for Scan Result Sections
 *
 * Applies the Naqiy Signature surface system:
 * - Light: white bg + lightShadows.card
 * - Dark: translucent rgba(255,255,255,0.04) + gold[800] hairline border + darkShadows.card
 *
 * Section header pattern: [icon 16px] TITLE uppercase      [rightElement]
 *
 * Usage: <SectionCard icon={<Icon />} title="SANTÉ">{content}</SectionCard>
 *
 * @module components/scan/SectionCard
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { gold, lightTheme } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens, fontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { lightShadows, darkShadows } from "@/theme/shadows";
import { letterSpacing } from "./scan-constants";

// ── Types ──

export interface SectionCardProps {
  /** Icon element (16px, same gold color) — rendered left of title */
  icon?: React.ReactNode;
  /** Section title (displayed uppercase) */
  title?: string;
  /** Right-side element (count badge, chip, etc.) */
  rightElement?: React.ReactNode;
  /** Stagger index for entry animation delay */
  staggerIndex?: number;
  /** Card content */
  children: React.ReactNode;
  /** Optional onPress for the whole card */
  onPress?: () => void;
}

// ── springNaqiy for entering animation ──
const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

// ── Component ──

export function SectionCard({
  icon,
  title,
  rightElement,
  staggerIndex = 0,
  children,
}: SectionCardProps) {
  const { isDark } = useTheme();

  const shadow = Platform.select({
    ios: isDark ? darkShadows.card : lightShadows.card,
    android: { elevation: isDark ? darkShadows.card.elevation : lightShadows.card.elevation },
  });

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : lightTheme.card,
          borderColor: isDark ? gold[800] : "transparent",
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
        shadow,
      ]}
    >
      {/* Section Header */}
      {title && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon}
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? gold[400] : gold[700] },
              ]}
            >
              {title}
            </Text>
          </View>
          {rightElement}
        </View>
      )}

      {/* Card Body */}
      {children}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing["3xl"],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizeTokens.micro,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/SectionCard.tsx
git commit -m "feat(scan): add SectionCard wrapper with Naqiy surface system"
```

---

## Chunk 2: Section Cards (Part 1)

### Task 6: Rewrite NutrientBar.tsx

**Files:**
- Modify: `optimus-halal/src/components/scan/NutrientBar.tsx`

- [ ] **Step 1: Rewrite NutrientBar to match Yuka spec**

The spec calls for a single-row layout: `[Name 80px] [Value 48px] [Bar flex:1] [Level 56px] [% 32px] [ⓘ 24px]`, 36px row height. Replace the entire file content:

```tsx
/**
 * NutrientBar — Yuka-Style Per-Nutrient Colored Bar
 *
 * Single-row layout with animated fill bar.
 * Negative nutrients (fat, sugar, salt): red = bad, green = good.
 * Positive nutrients (fiber, protein): green = good, red = bad.
 *
 * @module components/scan/NutrientBar
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { InfoIcon } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { NUTRIENT_BAR_COLORS } from "./scan-constants";

// ── Types ──

export interface NutrientBarProps {
  name: string;
  value: number;
  unit: string;
  percentage: number;         // 0-100 of daily value
  level: "low" | "moderate" | "high";
  isPositive: boolean;        // fiber/protein = positive
  indented?: boolean;         // "dont saturés" style
  staggerIndex: number;
  onInfoPress?: () => void;
}

// ── Level label keys ──

const LEVEL_LABEL_KEYS: Record<string, string> = {
  low: "levelLow",
  moderate: "levelModerate",
  high: "levelHigh",
};

// ── Component ──

export const NutrientBar = React.memo(function NutrientBar({
  name,
  value,
  unit,
  percentage,
  level,
  isPositive,
  indented = false,
  staggerIndex,
  onInfoPress,
}: NutrientBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const colorMap = isPositive ? NUTRIENT_BAR_COLORS.positive : NUTRIENT_BAR_COLORS.negative;
  const barColor = colorMap[level];

  // Animated bar fill
  const barWidth = useSharedValue(0);
  const targetWidth = Math.min(percentage, 100);

  useEffect(() => {
    if (reducedMotion) {
      barWidth.value = targetWidth;
    } else {
      barWidth.value = withTiming(targetWidth, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [targetWidth, reducedMotion]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const levelLabel = (t.scanResult as Record<string, string>)[LEVEL_LABEL_KEYS[level]] ?? level;

  return (
    <View
      style={[styles.row, indented && styles.indented]}
      accessibilityLabel={`${name}: ${value}${unit}, ${levelLabel}, ${percentage}% valeur quotidienne`}
    >
      {/* Name */}
      <Text
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Value */}
      <Text style={[styles.value, { color: colors.textSecondary }]}>
        {value}{unit}
      </Text>

      {/* Bar */}
      <View style={[styles.barTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: barColor }, barStyle]}
        />
      </View>

      {/* Level label */}
      <Text style={[styles.levelText, { color: barColor }]} numberOfLines={1}>
        {levelLabel}
      </Text>

      {/* % DV */}
      <Text style={[styles.percent, { color: colors.textMuted }]}>
        {percentage}%
      </Text>

      {/* Info icon */}
      {onInfoPress && (
        <Pressable
          onPress={onInfoPress}
          hitSlop={8}
          style={styles.infoButton}
          accessibilityRole="button"
          accessibilityLabel={`Détail ${name}`}
        >
          <InfoIcon size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    gap: spacing.sm,
  },
  indented: {
    paddingLeft: spacing.lg,
  },
  name: {
    width: 80,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
  },
  value: {
    width: 48,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  levelText: {
    width: 56,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    textAlign: "center",
  },
  percent: {
    width: 32,
    fontSize: fontSize.caption,
    textAlign: "right",
  },
  infoButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NutrientBar;
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/NutrientBar.tsx
git commit -m "feat(scan): rewrite NutrientBar to Yuka-style single-row layout"
```

---

### Task 7: Create AlertStripCard.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/AlertStripCard.tsx`

- [ ] **Step 1: Create AlertStripCard component**

```tsx
/**
 * AlertStripCard — Personal Alerts Section Card
 *
 * Severity-sorted alert sub-cards inside a SectionCard.
 * Conditional: only renders if alerts exist.
 * Max 3 visible, "Voir toutes (N)" CTA for overflow.
 *
 * @module components/scan/AlertStripCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { WarningCircleIcon, WarningIcon, InfoIcon } from "phosphor-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { semantic } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Types ──

export interface AlertItem {
  type: string;
  severity: "danger" | "warning" | "info";
  title: string;
  message: string;
}

export interface AlertStripCardProps {
  alerts: AlertItem[];
  staggerIndex?: number;
  onPress?: () => void;
}

// ── Helpers ──

const SEVERITY_ORDER: Record<string, number> = { danger: 0, warning: 1, info: 2 };
const SEVERITY_COLORS: Record<string, string> = {
  danger: halalStatusTokens.haram.base,
  warning: halalStatusTokens.doubtful.base,
  info: semantic.info.base,
};

function getSeverityIcon(severity: string, size: number, color: string) {
  switch (severity) {
    case "danger": return <WarningCircleIcon size={size} color={color} weight="fill" />;
    case "warning": return <WarningIcon size={size} color={color} weight="fill" />;
    default: return <InfoIcon size={size} color={color} weight="fill" />;
  }
}

const MAX_VISIBLE = 3;

// ── Component ──

export function AlertStripCard({ alerts, staggerIndex = 1, onPress }: AlertStripCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (alerts.length === 0) return null;

  // Sort by severity
  const sorted = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2),
  );

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hasMore = sorted.length > MAX_VISIBLE && !showAll;

  return (
    <SectionCard
      icon={<WarningCircleIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.alertsPersonnelles}
      rightElement={
        <Text style={[styles.countBadge, { color: isDark ? gold[400] : gold[700] }]}>
          {alerts.length}
        </Text>
      }
      staggerIndex={staggerIndex}
    >
      <View style={styles.alertList}>
        {visible.map((alert, idx) => {
          const color = SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.info;
          return (
            <Animated.View
              key={`${alert.type}-${idx}`}
              entering={FadeInUp.delay(idx * 60).duration(250)}
              style={[
                styles.alertSubCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                },
              ]}
            >
              <View style={styles.alertRow}>
                {getSeverityIcon(alert.severity, 18, color)}
                <View style={styles.alertContent}>
                  <Text
                    style={[styles.alertTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {alert.title}
                  </Text>
                  <Text
                    style={[styles.alertMessage, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {alert.message}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {hasMore && (
        <Pressable onPress={() => setShowAll(true)} style={styles.showMoreButton}>
          <Text style={[styles.showMoreText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirTout.replace("{{count}}", String(sorted.length))}
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  countBadge: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  alertList: {
    gap: spacing.md,
  },
  alertSubCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  alertRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  alertMessage: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.regular,
    lineHeight: 18,
  },
  showMoreButton: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  showMoreText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AlertStripCard.tsx
git commit -m "feat(scan): add AlertStripCard with severity-sorted sub-cards"
```

---

### Task 8: Create HalalVerdictCard.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/HalalVerdictCard.tsx`

- [ ] **Step 1: Create HalalVerdictCard component**

This is the killer differentiator — 4 madhab rows with equal visual weight. The user's madhab gets a subtle gold star but is NOT elevated above others (Al-Niyyah: neutralité confessionnelle).

```tsx
/**
 * HalalVerdictCard — 4 Madhab Verdict Rows
 *
 * Our killer differentiator: 4 schools displayed with equal visual weight.
 * User's madhab gets gold star but is NOT visually elevated (Al-Niyyah).
 * Consensus badge when all 4 agree. Conflict breathing animation when they differ.
 *
 * @module components/scan/HalalVerdictCard
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  MosqueIcon,
  StarIcon,
  CheckCircleIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  MADHAB_LABEL_KEY,
  type HalalStatusKey,
} from "./scan-constants";
import type { MadhabVerdict } from "./scan-types";

// ── Types ──

export interface HalalVerdictCardProps {
  madhabVerdicts: MadhabVerdict[];
  userMadhab: string;
  effectiveHeroStatus: HalalStatusKey;
  ingredientCount: number;
  additiveCount: number;
  onPressMadhab: (verdict: MadhabVerdict) => void;
  onPressCard: () => void;
  staggerIndex?: number;
}

// ── Status color helper ──

function getStatusColor(status: HalalStatusKey): string {
  return halalStatusTokens[status]?.base ?? halalStatusTokens.unknown.base;
}

function getStatusLabel(status: HalalStatusKey, t: any): string {
  const map: Record<string, string> = {
    halal: t.scanResult.halal,
    haram: t.scanResult.haram,
    doubtful: t.scanResult.doubtful,
    unknown: t.scanResult.unknown,
  };
  return map[status] ?? status;
}

// ── MadhabRow sub-component ──

function MadhabRow({
  verdict,
  isUserMadhab,
  isConflicting,
  majorityStatus,
  index,
  onPress,
}: {
  verdict: MadhabVerdict;
  isUserMadhab: boolean;
  isConflicting: boolean;
  majorityStatus: HalalStatusKey;
  index: number;
  onPress: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const statusColor = getStatusColor(verdict.status);
  const statusLabel = getStatusLabel(verdict.status, t);
  const madhabLabelKey = MADHAB_LABEL_KEY[verdict.madhab as keyof typeof MADHAB_LABEL_KEY];
  const madhabLabel = madhabLabelKey
    ? (t.scanResult as Record<string, string>)[madhabLabelKey] ?? verdict.madhab
    : verdict.madhab;

  // Conflict count (additives + ingredients)
  const conflictCount =
    (verdict.conflictingAdditives?.length ?? 0) +
    (verdict.conflictingIngredients?.length ?? 0);

  // Conflict breathing animation
  const breathOpacity = useSharedValue(1);
  useEffect(() => {
    if (isConflicting && !reducedMotion) {
      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
      );
    }
  }, [isConflicting, reducedMotion]);

  const rowAnimStyle = useAnimatedStyle(() => ({
    opacity: isConflicting ? breathOpacity.value : 1,
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${madhabLabel}: ${statusLabel}`}>
      <Animated.View
        entering={FadeInUp.delay(index * 80).duration(250)}
        style={[styles.madhabRow, rowAnimStyle]}
      >
        {/* Star for user madhab */}
        <View style={styles.starSlot}>
          {isUserMadhab && (
            <StarIcon size={14} color={gold[500]} weight="fill" />
          )}
        </View>

        {/* Madhab name */}
        <Text
          style={[
            styles.madhabName,
            {
              color: isUserMadhab
                ? (isDark ? gold[400] : gold[700])
                : colors.textPrimary,
              fontWeight: isUserMadhab ? fontWeightTokens.bold : fontWeightTokens.regular,
            },
          ]}
          numberOfLines={1}
        >
          {madhabLabel}
        </Text>

        {/* Status dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

        {/* Status label */}
        <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
          {statusLabel}
        </Text>

        {/* Conflict count (replaces trust bar — backend has no per-madhab score) */}
        {conflictCount > 0 && (
          <Text style={[styles.conflictCount, { color: colors.textMuted }]}>
            {conflictCount} conflit{conflictCount > 1 ? "s" : ""}
          </Text>
        )}

        {/* Caret */}
        <CaretRightIcon size={14} color={colors.textMuted} />
      </Animated.View>
    </Pressable>
  );
}

// ── Main Component ──

export function HalalVerdictCard({
  madhabVerdicts,
  userMadhab,
  effectiveHeroStatus,
  ingredientCount,
  additiveCount,
  onPressMadhab,
  onPressCard,
  staggerIndex = 2,
}: HalalVerdictCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  // Check consensus
  const allStatuses = madhabVerdicts.map((v) => v.status);
  const isConsensus = allStatuses.length > 0 && allStatuses.every((s) => s === allStatuses[0]);
  const majorityStatus = isConsensus ? allStatuses[0] : effectiveHeroStatus;
  const consensusColor = getStatusColor(majorityStatus);

  // Sort: user madhab first
  const sortedVerdicts = [...madhabVerdicts].sort((a, b) => {
    if (a.madhab === userMadhab) return -1;
    if (b.madhab === userMadhab) return 1;
    return 0;
  });

  // Consensus badge
  const consensusBadge = isConsensus ? (
    <View style={[styles.consensusBadge, {
      backgroundColor: isDark
        ? halalStatusTokens[majorityStatus]?.bgDark ?? "rgba(107,114,128,0.20)"
        : halalStatusTokens[majorityStatus]?.bg ?? "rgba(107,114,128,0.12)",
    }]}>
      <CheckCircleIcon size={12} color={consensusColor} weight="fill" />
      <Text style={[styles.consensusText, { color: consensusColor }]}>
        {t.scanResult.unanime}
      </Text>
    </View>
  ) : null;

  // Empty state: no verdicts
  if (madhabVerdicts.length === 0) {
    return (
      <SectionCard
        icon={<MosqueIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
        title={t.scanResult.avisEcoles}
        staggerIndex={staggerIndex}
      >
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {t.scanResult.analyseAlgorithmique}
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<MosqueIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.avisEcoles}
      rightElement={consensusBadge}
      staggerIndex={staggerIndex}
    >
      {/* Madhab Rows */}
      <View style={styles.madhabList}>
        {sortedVerdicts.map((verdict, idx) => (
          <MadhabRow
            key={verdict.madhab}
            verdict={verdict}
            isUserMadhab={verdict.madhab === userMadhab}
            isConflicting={!isConsensus && verdict.status !== majorityStatus}
            majorityStatus={majorityStatus}
            index={idx}
            onPress={() => {
              impact();
              onPressMadhab(verdict);
            }}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerMeta, { color: colors.textMuted }]}>
            {ingredientCount > 0 || additiveCount > 0
              ? `${ingredientCount} ingr. · ${additiveCount} add.`
              : t.scanResult.unverified}
          </Text>
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            {t.scanResult.decisionNote}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            impact();
            onPressCard();
          }}
          style={styles.footerCTA}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.voirDetail}
        >
          <Text style={[styles.footerCTAText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirDetail}
          </Text>
          <CaretRightIcon size={14} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  madhabList: {
    gap: spacing.sm,
  },
  madhabRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    gap: spacing.md,
  },
  starSlot: {
    width: 14,
    alignItems: "center",
  },
  madhabName: {
    width: 72,
    fontSize: fontSizeTokens.bodySmall,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    width: 56,
    fontSize: fontSizeTokens.caption,
  },
  conflictCount: {
    flex: 1,
    fontSize: fontSizeTokens.micro,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
    gap: 2,
  },
  footerMeta: {
    fontSize: fontSizeTokens.caption,
  },
  footerNote: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
  },
  footerCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerCTAText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  consensusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  consensusText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  emptyText: {
    fontSize: fontSizeTokens.bodySmall,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/HalalVerdictCard.tsx
git commit -m "feat(scan): add HalalVerdictCard with 4 madhab rows, consensus badge, conflict animation"
```

---

## Chunk 3: Dashboard Cards

### Task 9: Create HealthNutritionCard.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/HealthNutritionCard.tsx`

- [ ] **Step 1: Create HealthNutritionCard component**

This is the largest card — combines ScoreRing, NutriScore/NOVA/Eco badges, DietaryChips, NutrientBars, and allergens. All inline in one card.

```tsx
/**
 * HealthNutritionCard — Health & Nutrition Dashboard
 *
 * Yuka's strongest pattern: ScoreRing + badges + per-nutrient colored bars.
 * NutriScore/NOVA/Eco badges with proper grade colors.
 * Dietary chips (Vegan, Bio, etc.) as horizontal scroll.
 * Allergens + traces separated.
 *
 * @module components/scan/HealthNutritionCard
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { HeartIcon, CaretRightIcon } from "phosphor-react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { ScoreRing } from "./ScoreRing";
import { NutrientBar } from "./NutrientBar";
import { DietaryChip } from "./DietaryChip";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { NUTRISCORE_COLORS, NOVA_COLORS, letterSpacing } from "./scan-constants";
import type { NutrientItem, DietaryItem } from "./scan-types";

// ── Types ──

export interface HealthNutritionCardProps {
  healthScore: { score: number; label: string } | null;
  nutriScore: string | null;
  novaGroup: number | null;
  ecoScore: string | null;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis: DietaryItem[];
  allergens: string[];
  traces: string[];
  onNutrientPress: (nutrient: NutrientItem) => void;
  onPress: () => void;
  staggerIndex?: number;
}

// ── Score label helper ──

function getScoreLabel(score: number, t: any): string {
  if (score >= 80) return t.scanResult.scoreExcellent;
  if (score >= 60) return t.scanResult.scoreBon;
  if (score >= 40) return t.scanResult.scoreMediocre;
  if (score >= 20) return t.scanResult.scoreInsuffisant;
  return t.scanResult.scoreTresInsuffisant;
}

// ── Badge sub-component ──

function GradeBadge({ label, grade, colorMap }: {
  label: string;
  grade: string;
  colorMap: Record<string, string>;
}) {
  const { isDark } = useTheme();
  const color = colorMap[grade.toLowerCase()] ?? "#6b7280";

  return (
    <View style={[styles.badge, {
      backgroundColor: isDark ? `${color}33` : `${color}1F`,
      borderColor: isDark ? `${color}66` : `${color}40`,
    }]}>
      <Text style={[styles.badgeText, { color }]}>
        {label} {grade.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Component ──

export function HealthNutritionCard({
  healthScore,
  nutriScore,
  novaGroup,
  ecoScore,
  nutrientBreakdown,
  dietaryAnalysis,
  allergens,
  traces,
  onNutrientPress,
  onPress,
  staggerIndex = 4,
}: HealthNutritionCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const scoreLabel = healthScore
    ? getScoreLabel(healthScore.score, t)
    : t.scanResult.donneesInsuffisantes;

  return (
    <SectionCard
      icon={<HeartIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.santeNutrition}
      staggerIndex={staggerIndex}
    >
      {/* Score row: ScoreRing + score bar + label */}
      <View style={styles.scoreRow}>
        <ScoreRing
          score={healthScore?.score ?? null}
          size={80}
          label={scoreLabel}
        />

        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreSanteLabel, { color: colors.textMuted }]}>
            {t.scanResult.scoreSante}
          </Text>

          {/* Score progress bar */}
          <View style={[styles.scoreBarTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
            <View style={[
              styles.scoreBarFill,
              {
                width: `${healthScore?.score ?? 0}%`,
                backgroundColor: healthScore
                  ? (healthScore.score >= 70 ? halalStatusTokens.halal.base : healthScore.score >= 40 ? halalStatusTokens.doubtful.base : halalStatusTokens.haram.base)
                  : "#6b7280",
              },
            ]} />
          </View>

          {/* NutriScore / NOVA / Eco badges */}
          <View style={styles.badgeRow}>
            {nutriScore && (
              <GradeBadge label="Nutri" grade={nutriScore} colorMap={NUTRISCORE_COLORS} />
            )}
            {novaGroup !== null && (
              <GradeBadge label="NOVA" grade={String(novaGroup)} colorMap={
                Object.fromEntries(Object.entries(NOVA_COLORS).map(([k, v]) => [k, v]))
              } />
            )}
            {ecoScore && (
              <GradeBadge label="Eco" grade={ecoScore} colorMap={NUTRISCORE_COLORS} />
            )}
          </View>
        </View>
      </View>

      {/* Dietary chips */}
      {dietaryAnalysis.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dietaryScroll}
          contentContainerStyle={styles.dietaryContent}
        >
          {dietaryAnalysis.map((item, idx) => (
            <DietaryChip
              key={item.key}
              label={item.label}
              status={item.status}
              icon={item.icon as any}
              index={idx}
            />
          ))}
        </ScrollView>
      )}

      {/* Nutrient bars sub-section */}
      {nutrientBreakdown.length > 0 && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.detailNutritionnel}
          </Text>
          <View style={styles.nutrientList}>
            {nutrientBreakdown.map((nb, idx) => (
              <NutrientBar
                key={nb.key}
                name={nb.name}
                value={nb.value}
                unit={nb.unit}
                percentage={nb.percentage}
                level={nb.level}
                isPositive={nb.isPositive}
                indented={nb.indented}
                staggerIndex={idx}
                onInfoPress={() => onNutrientPress(nb)}
              />
            ))}
          </View>
        </>
      )}

      {/* Allergens */}
      {(allergens.length > 0 || traces.length > 0) && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.allergenesTitle}
          </Text>
          <View style={styles.allergenRow}>
            {allergens.map((a) => (
              <View key={a} style={[styles.allergenChip, {
                backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
              }]}>
                <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.haram.base }]} />
                <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{a}</Text>
              </View>
            ))}
          </View>
          {traces.length > 0 && (
            <>
              <Text style={[styles.tracesLabel, { color: colors.textMuted }]}>
                {t.scanResult.tracesLabel}
              </Text>
              <View style={styles.allergenRow}>
                {traces.map((tr) => (
                  <View key={tr} style={[styles.allergenChip, styles.traceChip, {
                    borderColor: isDark ? "rgba(249,115,22,0.30)" : "rgba(249,115,22,0.20)",
                  }]}>
                    <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.doubtful.base }]} />
                    <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{tr}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* Footer CTA */}
      <View style={styles.footerCTA}>
        <Pressable
          onPress={onPress}
          style={styles.footerCTARow}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.voirDetail}
        >
          <Text style={[styles.footerCTAText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirDetail}
          </Text>
          <CaretRightIcon size={14} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: "row",
    gap: spacing.xl,
    alignItems: "flex-start",
  },
  scoreInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  scoreSanteLabel: {
    fontSize: fontSizeTokens.micro,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
  scoreBarTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 52,
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  dietaryScroll: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing["3xl"],
  },
  dietaryContent: {
    paddingHorizontal: spacing["3xl"],
    gap: spacing.sm,
  },
  subDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  subHeader: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
    marginBottom: spacing.md,
  },
  nutrientList: {
    gap: 0,
  },
  allergenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  allergenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  traceChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  allergenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allergenText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  tracesLabel: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  footerCTA: {
    alignItems: "flex-end",
    marginTop: spacing.lg,
  },
  footerCTARow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerCTAText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/HealthNutritionCard.tsx
git commit -m "feat(scan): add HealthNutritionCard with ScoreRing, badges, nutrient bars, allergens"
```

---

### Task 10: Create AdditivesCard.tsx

**Files:**
- Create: `optimus-halal/src/components/scan/AdditivesCard.tsx`

- [ ] **Step 1: Create AdditivesCard component**

```tsx
/**
 * AdditivesCard — Additive Analysis with 4-Level Danger Badges
 *
 * Yuka's 4-level danger system enriched with Naqiy's madhab rulings
 * and scholarly references inline.
 *
 * HIGH/MEDIUM: expanded by default. LIMITED/NONE: collapsed.
 * Each additive shows: code + name, category + risk, madhab rulings,
 * health effects, scholarly refs.
 *
 * @module components/scan/AdditivesCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlaskIcon, BookOpenIcon, CaretRightIcon, CaretDownIcon } from "phosphor-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { HealthEffectBadge } from "./HealthEffectBadge";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { ADDITIVE_RISK_LEVELS, type HalalStatusKey } from "./scan-constants";
import type { AdditiveItem } from "./scan-types";

// ── Types ──

export interface AdditivesCardProps {
  additives: AdditiveItem[];
  onPressCard: () => void;
  staggerIndex?: number;
}

// ── Sub-component: AdditiveSubCard ──

function AdditiveSubCard({ additive, index }: { additive: AdditiveItem; index: number }) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Expand high/medium by default
  const [expanded, setExpanded] = useState(additive.dangerLevel <= 2);

  const riskConfig = ADDITIVE_RISK_LEVELS[additive.dangerLevel];
  const riskLabel = (t.scanResult as Record<string, string>)[riskConfig.labelKey] ?? "";
  const dotColor = riskConfig.color;

  const hasMadhabRulings = additive.madhabRulings && Object.keys(additive.madhabRulings).length > 0;
  const hasHealthEffects = additive.healthEffects && additive.healthEffects.length > 0;
  const hasScholarlyRefs = additive.scholarlyRefs && additive.scholarlyRefs.length > 0;
  const hasDetails = hasMadhabRulings || hasHealthEffects || hasScholarlyRefs;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(250)}
    >
      <Pressable
        onPress={() => hasDetails && setExpanded(!expanded)}
        style={[styles.subCard, {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }]}
      >
        {/* Header row */}
        <View style={styles.additiveHeader}>
          <View style={[styles.dangerDot, { backgroundColor: dotColor }]} />
          <View style={styles.additiveInfo}>
            <Text style={[styles.additiveName, { color: colors.textPrimary }]} numberOfLines={1}>
              {additive.code} · {additive.name}
            </Text>
            <Text style={[styles.additiveCategory, { color: colors.textSecondary }]}>
              {additive.category} · <Text style={{ color: dotColor }}>{riskLabel}</Text>
            </Text>
          </View>
          {hasDetails && (
            expanded
              ? <CaretDownIcon size={16} color={colors.textMuted} />
              : <CaretRightIcon size={16} color={colors.textMuted} />
          )}
        </View>

        {/* Expanded details */}
        {expanded && hasDetails && (
          <View style={styles.additiveDetails}>
            {/* Madhab rulings — colored inline text */}
            {hasMadhabRulings && (
              <Text style={[styles.madhabRulings, { color: colors.textMuted }]}>
                {Object.entries(additive.madhabRulings!).map(([madhab, status], idx, arr) => (
                  <Text key={madhab}>
                    <Text style={{ color: colors.textMuted }}>{madhab}: </Text>
                    <Text style={{ color: halalStatusTokens[status as HalalStatusKey]?.base ?? colors.textMuted }}>
                      {(t.scanResult as Record<string, string>)[status] ?? status}
                    </Text>
                    {idx < arr.length - 1 ? " │ " : ""}
                  </Text>
                ))}
              </Text>
            )}

            {/* Health effects */}
            {hasHealthEffects && (
              <View style={styles.healthEffects}>
                {additive.healthEffects!.map((effect, idx) => (
                  <HealthEffectBadge
                    key={`${effect.type}-${idx}`}
                    type={effect.type}
                    confirmed={!effect.potential}
                    compact
                  />
                ))}
              </View>
            )}

            {/* Scholarly refs */}
            {hasScholarlyRefs && (
              <View style={styles.scholarlyRefs}>
                {additive.scholarlyRefs!.map((ref, idx) => (
                  <Text
                    key={idx}
                    style={[styles.scholarlyText, { color: isDark ? gold[300] : gold[700] }]}
                  >
                    📖 {ref.source}{ref.detail ? ` — ${ref.detail}` : ""}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Main Component ──

export function AdditivesCard({ additives, onPressCard, staggerIndex = 5 }: AdditivesCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  if (additives.length === 0) return null;

  // Sort by danger level (most dangerous first)
  const sorted = [...additives].sort((a, b) => a.dangerLevel - b.dangerLevel);

  return (
    <SectionCard
      icon={<FlaskIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.additifsDetectes}
      rightElement={
        <Text style={[styles.countBadge, { color: isDark ? gold[400] : gold[700] }]}>
          {additives.length}
        </Text>
      }
      staggerIndex={staggerIndex}
    >
      <View style={styles.additiveList}>
        {sorted.map((additive, idx) => (
          <AdditiveSubCard key={additive.code} additive={additive} index={idx} />
        ))}
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  countBadge: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  additiveList: {
    gap: spacing.md,
  },
  subCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  additiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dangerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  additiveInfo: {
    flex: 1,
    gap: 2,
  },
  additiveName: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  additiveCategory: {
    fontSize: fontSizeTokens.caption,
  },
  additiveDetails: {
    marginTop: spacing.md,
    paddingLeft: 24, // align with content after dot
    gap: spacing.sm,
  },
  madhabRulings: {
    fontSize: fontSizeTokens.micro,
    lineHeight: 16,
  },
  healthEffects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  scholarlyRefs: {
    gap: 4,
  },
  scholarlyText: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AdditivesCard.tsx
git commit -m "feat(scan): add AdditivesCard with 4-level danger badges, madhab rulings, scholarly refs"
```

---

## Chunk 4: Modified Components

### Task 11: Modify VerdictHero.tsx — Add ScoreRing

**Files:**
- Modify: `optimus-halal/src/components/scan/VerdictHero.tsx`

- [ ] **Step 1: Add ScoreRing import and integrate into hero layout**

Add import at top (after existing imports):
```typescript
import { ScoreRing } from "./ScoreRing";
```

Add `onTrustScorePress` to the existing `VerdictHeroProps` interface:
```typescript
onTrustScorePress?: () => void;
```

In the render, find the info section (right side of the row with product image) and add the ScoreRing between the "NAQIY SCORE" label and the verdict text. The exact changes depend on the current structure but the key addition is:

```tsx
{/* Score Ring — Naqiy Signature */}
<ScoreRing
  score={certifierTrustScore}
  size={80}
  label={heroLabel}
  labelColor={statusConfig.color}
/>
```

The ScoreRing should be placed in the right column of the hero row (next to the product image), replacing or augmenting the existing verdict text area.

**Key points:**
- Add a "NAQIY SCORE · {MADHAB}" micro label above the ring
- The ScoreRing replaces the large verdict text as the primary visual anchor
- Keep the existing certifier bar, product info section, and community badge
- The hero label is now shown as the ScoreRing's label prop

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/VerdictHero.tsx
git commit -m "feat(scan): add ScoreRing to VerdictHero as primary visual anchor"
```

---

### Task 12: Modify CompactStickyHeader — Add favorite button

**Files:**
- Modify: `optimus-halal/src/components/scan/CompactStickyHeader.tsx`

- [ ] **Step 1: Add favorite props and heart icon**

Add to `CompactStickyHeaderProps`:
```typescript
productIsFavorite?: boolean;
onToggleFavorite?: () => void;
```

Add import:
```typescript
import { HeartIcon } from "phosphor-react-native";
import { halalStatus as halalStatusTokens } from "@/theme/colors";
```

After the verdictPill in the render, add the favorite button:
```tsx
{onToggleFavorite && (
  <Pressable
    onPress={onToggleFavorite}
    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    accessibilityRole="button"
    accessibilityLabel={productIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
  >
    <HeartIcon
      size={22}
      color={productIsFavorite ? halalStatusTokens.haram.base : colors.textMuted}
      weight={productIsFavorite ? "fill" : "regular"}
    />
  </Pressable>
)}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/CompactStickyHeader.tsx
git commit -m "feat(scan): add favorite button to CompactStickyHeader"
```

---

### Task 13: Modify ScanBottomBar — Gold gradient CTA

**Files:**
- Modify: `optimus-halal/src/components/scan/ScanBottomBar.tsx`

- [ ] **Step 1: Update CTA to gold gradient pill with context-aware label**

The spec calls for a gold gradient pill CTA instead of the current icon+text slot. Add import:
```typescript
import { LinearGradient } from "expo-linear-gradient";
import { gold } from "@/theme/colors";
```

Replace the contextual CTA slot (slot 3) with:
```tsx
{/* 3. Gold Gradient CTA */}
<PressableScale
  onPress={handleCTA}
  accessibilityRole="button"
  accessibilityLabel={ctaLabel}
>
  <LinearGradient
    colors={[gold[400], gold[600]]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.ctaPill}
  >
    <Text style={styles.ctaPillText}>{ctaLabel}</Text>
  </LinearGradient>
</PressableScale>
```

Update `ctaLabel` to use new i18n keys:
```typescript
const ctaLabel = isPositiveStatus
  ? t.scanResult.ouAcheter
  : t.scanResult.alternativesHalal;
```

Add styles:
```typescript
ctaPill: {
  minWidth: 160,
  height: 40,
  borderRadius: 9999,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.xl,
},
ctaPillText: {
  fontSize: fontSizeTokens.bodySmall,
  fontWeight: fontWeightTokens.bold,
  color: "#FFFFFF",
},
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/ScanBottomBar.tsx
git commit -m "feat(scan): add gold gradient CTA pill to ScanBottomBar"
```

---

### Task 14: Modify AlternativesSection — SectionCard wrapper + i18n

**Files:**
- Modify: `optimus-halal/src/components/scan/AlternativesSection.tsx`

- [ ] **Step 1: Wrap in SectionCard and use i18n keys**

Add imports:
```typescript
import { SectionCard } from "./SectionCard";
import { SparkleIcon } from "phosphor-react-native";
import { gold } from "@/theme/colors";
```

Replace the outer `Animated.View` with `SectionCard`. Update the title to use i18n keys:
```tsx
const title = variant === "priority"
  ? t.scanResult.alternativesPriority
  : t.scanResult.alternativesDiscover;
```

The SectionCard handles the card surface, header pattern, and entry animation. The icon should be SparkleIcon 16px gold.

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AlternativesSection.tsx
git commit -m "feat(scan): wrap AlternativesSection in SectionCard, use i18n keys"
```

---

## Chunk 5: Integration & Cleanup

### Task 15: Rewrite scan-result.tsx — Replace BentoGrid with direct section cards

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

This is the most critical task. The orchestrator needs to be rewritten from BentoGrid + 4 bottom sheets to direct inline section cards.

- [ ] **Step 1: Update imports**

Remove:
```typescript
import { BentoGrid } from "@/components/scan/BentoGrid";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { HalalAnalysisSection } from "@/components/scan/HalalAnalysisSection";
import { HealthNutritionSection } from "@/components/scan/HealthNutritionSection";
```

Add:
```typescript
import { AlertStripCard, type AlertItem } from "@/components/scan/AlertStripCard";
import { HalalVerdictCard } from "@/components/scan/HalalVerdictCard";
import { HealthNutritionCard } from "@/components/scan/HealthNutritionCard";
import { AdditivesCard } from "@/components/scan/AdditivesCard";
import type { NutrientItem, DietaryItem, AdditiveItem } from "@/components/scan/scan-types";
```

Keep: `AlertStrip` → remove (replaced by `AlertStripCard`), `MadhabVerdictCard` → remove (replaced by `HalalVerdictCard`).

- [ ] **Step 2: Remove BentoGrid sheet refs and handlers**

Remove these refs and their handlers (keeping `madhabSheetRef` and `handleOpenMadhabSheet` which are still used for the MadhabBottomSheet):
```
healthSheetRef, alertsSheetRef, alternativesSheetRef
handleOpenHealthSheet, handleOpenAlertsSheet, handleOpenAlternativesSheet
```

Rename `halalSheetRef` → `madhabSheetRef` and `handleOpenHalalSheet` → `handleOpenMadhabSheet` for clarity.

- [ ] **Step 3: Build derived data for new cards**

Add data transformations for the new card props. Key transformations:

```typescript
// Alert items for AlertStripCard
const alertItems: AlertItem[] = personalAlerts.map((a) => ({
  type: a.type,
  severity: a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "info",
  title: a.title,
  message: a.description,
}));

// Whether to show alternatives before health (haram/doubtful)
const isNonHalal = effectiveHeroStatus === "haram" || effectiveHeroStatus === "doubtful";

// Nutrient breakdown for HealthNutritionCard
const nutrientItems: NutrientItem[] = (nutrientBreakdown ?? []).map((nb: any) => ({
  key: nb.nutrient,
  name: nb.nutrient,
  value: nb.value,
  unit: nb.unit ?? "g",
  percentage: nb.dailyValuePercent ?? 0,
  level: nb.level ?? "moderate",
  isPositive: !nb.isNegative,
  indented: false,
}));

// Dietary items — transform flat DietaryAnalysis object (5 booleans) into DietaryItem[]
// Backend returns: { containsGluten: bool|null, containsLactose: bool|null,
//   containsPalmOil: bool|null, isVegetarian: bool|null, isVegan: bool|null }
const dietaryItems: DietaryItem[] = (() => {
  if (!dietaryAnalysis) return [];
  const da = dietaryAnalysis as any;
  const items: DietaryItem[] = [];
  const DIETARY_MAP: Array<{ key: string; field: string; label: string; icon: string; invert: boolean }> = [
    { key: "gluten", field: "containsGluten", label: "Gluten", icon: "grain", invert: true },
    { key: "lactose", field: "containsLactose", label: "Lactose", icon: "local-drink", invert: true },
    { key: "palm_oil", field: "containsPalmOil", label: "Huile de palme", icon: "eco", invert: true },
    { key: "vegetarian", field: "isVegetarian", label: "Végétarien", icon: "spa", invert: false },
    { key: "vegan", field: "isVegan", label: "Végan", icon: "nature", invert: false },
  ];
  for (const { key, field, label, icon, invert } of DIETARY_MAP) {
    const val = da[field];
    if (val === null || val === undefined) {
      items.push({ key, label, status: "unknown", icon });
    } else if (invert) {
      // containsGluten=true → "contains", containsGluten=false → "safe"
      items.push({ key, label, status: val ? "contains" : "safe", icon });
    } else {
      // isVegan=true → "safe", isVegan=false → "contains"
      items.push({ key, label, status: val ? "safe" : "contains", icon });
    }
  }
  return items;
})();

// Additives for AdditivesCard — built from halalAnalysis.reasons (NOT product.additives which doesn't exist)
// Backend returns additiveHealthEffects as Record<string, { type: string; confirmed: boolean }>
const additiveItems: AdditiveItem[] = (halalAnalysis?.reasons ?? [])
  .filter((r: any) => r.type === "additive")
  .map((r: any) => {
    const code = r.name?.split(" ")[0] ?? "";
    const healthEffect = additiveHealthEffects?.[code];
    // Build madhab rulings from madhabVerdicts conflicting additives
    const madhabRulings: Record<string, string> = {};
    for (const mv of madhabVerdicts ?? []) {
      const match = mv.conflictingAdditives?.find((ca: any) => ca.code === code);
      if (match) madhabRulings[mv.madhab] = match.ruling;
    }
    return {
      code,
      name: r.name?.replace(/^E\d+[a-z]?\s*/i, "") ?? "",
      category: r.category ?? "",
      dangerLevel: (r.status === "haram" ? 1 : r.status === "doubtful" ? 2 : r.status === "halal" ? 4 : 3) as 1 | 2 | 3 | 4,
      madhabRulings: Object.keys(madhabRulings).length > 0 ? madhabRulings : undefined,
      healthEffects: healthEffect ? [{
        type: healthEffect.type as any,
        label: healthEffect.type,
        potential: !healthEffect.confirmed,
      }] : undefined,
      scholarlyRefs: r.scholarlyReference ? [{ source: r.scholarlyReference }] : undefined,
    };
  });
```

- [ ] **Step 4: Replace BentoGrid render with direct section cards**

Replace the BentoGrid JSX and the 4 detail BottomSheet instances with:

```tsx
{/* Content cards — padded container */}
<View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing["6xl"] }}>

  {/* 2. ALERT STRIP (conditional) */}
  {alertItems.length > 0 && (
    <AlertStripCard alerts={alertItems} staggerIndex={1} />
  )}

  {/* 3. HALAL VERDICT CARD */}
  <HalalVerdictCard
    madhabVerdicts={madhabVerdicts}
    userMadhab={userMadhab}
    effectiveHeroStatus={effectiveHeroStatus}
    ingredientCount={ingredients.length}
    additiveCount={additiveItems.length}
    onPressMadhab={(verdict) => {
      impact();
      setSelectedMadhab({
        madhab: verdict.madhab,
        status: verdict.status,
        conflictingAdditives: verdict.conflictingAdditives ?? [],
        conflictingIngredients: verdict.conflictingIngredients ?? [],
      });
    }}
    onPressCard={handleOpenMadhabSheet}
    staggerIndex={2}
  />

  {/* Haram/Doubtful: alternatives BEFORE health (Al-Taqwa) */}
  {isNonHalal && (
    <AlternativesSection
      variant="priority"
      alternativesQuery={alternativesQuery}
      onAlternativePress={(_id, bc) => {
        if (bc) router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
      }}
    />
  )}

  {/* 4. HEALTH & NUTRITION */}
  <HealthNutritionCard
    healthScore={healthScore ? { score: healthScore.score ?? 0, label: healthScore.label ?? "unknown" } : null}
    nutriScore={offExtras?.nutriscoreGrade ?? null}
    novaGroup={offExtras?.novaGroup ?? null}
    ecoScore={offExtras?.ecoscoreGrade ?? null}
    nutrientBreakdown={nutrientItems}
    dietaryAnalysis={dietaryItems}
    allergens={allergensTags}
    traces={offExtras?.tracesTags ?? []}
    onNutrientPress={(nb) => setSelectedNutrient({
      nutrient: nb.key, value: nb.value, unit: nb.unit,
      level: nb.level as any, dailyValuePercent: nb.percentage, isNegative: !nb.isPositive,
    })}
    onPress={() => {}}
    staggerIndex={4}
  />

  {/* 5. ADDITIVES */}
  {additiveItems.length > 0 && (
    <AdditivesCard
      additives={additiveItems}
      onPressCard={() => {}}
      staggerIndex={5}
    />
  )}

  {/* Halal/Unknown: alternatives AFTER additives */}
  {!isNonHalal && (
    <AlternativesSection
      variant="discover"
      alternativesQuery={alternativesQuery}
      onAlternativePress={(_id, bc) => {
        if (bc) router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
      }}
    />
  )}

  {/* DISCLAIMER — inline */}
  <View style={styles.disclaimerRow}>
    <InfoIcon size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
    <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
      {t.scanResult.disclaimer}
    </Text>
  </View>
</View>
```

- [ ] **Step 5: Remove the 4 BentoGrid detail BottomSheet instances**

Delete the `<BottomSheet ref={halalSheetRef}...>`, `<BottomSheet ref={healthSheetRef}...>`, `<BottomSheet ref={alertsSheetRef}...>`, and `<BottomSheet ref={alternativesSheetRef}...>` blocks. Keep the madhab, trust score, score detail, and nutrient detail bottom sheets.

- [ ] **Step 6: Pass favorite props to CompactStickyHeader**

```tsx
<CompactStickyHeader
  scrollY={scrollY}
  heroHeight={HERO_HEIGHT}
  productName={product?.name ?? ""}
  brand={product?.brand ?? null}
  imageUrl={product?.imageUrl ?? null}
  effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
  heroLabel={heroLabel}
  certifierData={certifierData ? { name: certifierData.name } : null}
  onTrustScorePress={certifierData ? () => {
    impact();
    setShowTrustScoreSheet(true);
  } : undefined}
  productIsFavorite={productIsFavorite}
  onToggleFavorite={handleToggleFavorite}
/>
```

- [ ] **Step 7: Clean up unused imports and variables**

Remove imports for: `BentoGrid`, `BottomSheet`, `BottomSheetScrollView`, `BottomSheetBackdrop`, `HalalAnalysisSection`, `HealthNutritionSection`, `AlertStrip`, `MadhabVerdictCard` (old), `AlternativesSection` (if renamed import).

Remove variables: `halalSheetRef`, `healthSheetRef`, `alertsSheetRef`, `alternativesSheetRef`, and their handler functions.

- [ ] **Step 8: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors (or only unrelated errors from other files)

- [ ] **Step 9: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "feat(scan): replace BentoGrid with direct section cards in continuous scroll"
```

---

### Task 16: Delete old files

**Files:**
- Delete: 16 files listed in File Structure section

- [ ] **Step 1: Delete all superseded files**

```bash
cd optimus-halal
rm -f src/components/scan/AlertStrip.tsx
rm -f src/components/scan/AlertsTile.tsx
rm -f src/components/scan/AlternativesTile.tsx
rm -f src/components/scan/BentoGrid.tsx
rm -f src/components/scan/BentoTile.tsx
rm -f src/components/scan/HalalActionCard.tsx
rm -f src/components/scan/HalalAnalysisSection.tsx
rm -f src/components/scan/HalalMadhabTile.tsx
rm -f src/components/scan/HealthNutritionSection.tsx
rm -f src/components/scan/HealthScoreTile.tsx
rm -f src/components/scan/KeyCharacteristicsGrid.tsx
rm -f src/components/scan/MadhabScoreRing.tsx
rm -f src/components/scan/MadhabVerdictCard.tsx
rm -f src/components/scan/PersonalAlerts.tsx
rm -f src/components/scan/ScanResultTabBar.tsx
rm -f src/components/scan/ScoreDashboardCard.tsx
```

- [ ] **Step 2: Verify no remaining imports reference deleted files**

Run: `cd optimus-halal && grep -r "AlertStrip\b\|AlertsTile\|AlternativesTile\|BentoGrid\|BentoTile\|HalalActionCard\|HalalAnalysisSection\|HalalMadhabTile\|HealthNutritionSection\|HealthScoreTile\|KeyCharacteristicsGrid\|MadhabScoreRing\|MadhabVerdictCard\|PersonalAlerts\|ScanResultTabBar\|ScoreDashboardCard" src/ app/ --include="*.ts" --include="*.tsx" -l 2>/dev/null || echo "Clean"`

Expected: No files (or only the old file paths themselves which are now deleted)

- [ ] **Step 3: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors from deleted imports

- [ ] **Step 4: Commit**

```bash
cd optimus-halal
git add -A src/components/scan/
git commit -m "chore(scan): remove 16 superseded BentoGrid components"
```

---

### Task 17: Final typecheck + lint

- [ ] **Step 1: Full typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `cd optimus-halal && npx eslint app/scan-result.tsx src/components/scan/ --ext .ts,.tsx --max-warnings=0`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Fix any issues found**

If typecheck or lint reports errors, fix them.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(scan): fix typecheck and lint for Naqiy Signature scan result"
```

---

## Verification Checklist

After all tasks complete:

1. **Typecheck**: `cd optimus-halal && pnpm tsc --noEmit` — 0 errors
2. **Lint**: `pnpm lint` — 0 errors
3. **Visual iOS**: Simulateur iPhone 15 — produit certifié + haram + unknown
4. **Dark mode**: Gold accents, card borders, shadows gold tint
5. **Reduced motion**: All animations skip, final states instant
6. **Neutralité madhab**: 4 schools visually equal
7. **Zero dark pattern**: No counter, no upsell, no false urgency
8. **Performance**: 60fps scroll
9. **Accessibility**: 44×44 targets, screen reader labels
