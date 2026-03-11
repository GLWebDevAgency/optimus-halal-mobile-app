# Vanta Spatial UI — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the scan-result screen from vertical scroll into a Bento Grid dashboard with adaptive BottomSheets, compact hero (35%), sticky header, and fixed bottom bar.

**Architecture:** 8 new components (BentoTile, BentoGrid, 4 tile variants, CompactStickyHeader, ScanBottomBar), 2 modified (VerdictHero, scan-result.tsx), 2 removed (ScanActionBar, StickyVerdictHeader). Existing section components (HalalAnalysisSection, HealthNutritionSection, etc.) are reused as BottomSheet content. All data flows from `useScanBarcode()` tRPC mutation — zero backend changes.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, react-native-reanimated v4.1.6, @gorhom/bottom-sheet v5.2.8, react-native-svg, phosphor-react-native v3, Naqiy design tokens.

**Spec:** `docs/superpowers/specs/2026-03-11-vanta-spatial-ui-scan-result-design.md`

---

## Chunk 1: Foundation Components

### Task 1: BentoTile — Shared Glass Wrapper

**Files:**
- Create: `optimus-halal/src/components/scan/BentoTile.tsx`

**Context:** This is the shared pressable glass card used by all 4 tiles. It handles: glass background (dark/light), border, radius, shadow, inner glow gradient, PressableScale interaction, and stagger animation entry. Every tile component wraps its content in a BentoTile.

**Reference files to read first:**
- `optimus-halal/src/theme/colors.ts` — `glass`, `halalStatus` tokens
- `optimus-halal/src/theme/spacing.ts` — `spacing`, `radius` tokens
- `optimus-halal/src/components/ui/PressableScale.tsx` — existing pressable pattern

- [ ] **Step 1: Create BentoTile component**

```tsx
/**
 * BentoTile — Shared glass card wrapper for Bento Grid tiles.
 *
 * Provides: glass bg, border, radius, shadow, inner glow,
 * PressableScale on tap, stagger entry animation.
 *
 * @module components/scan/BentoTile
 */

import React from "react";
import { View, StyleSheet, Platform, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks";
import { glass } from "@/theme/colors";
import { radius } from "@/theme/spacing";

export interface BentoTileProps {
  /** Called when tile is tapped */
  onPress: () => void;
  /** Status color for inner glow (hex string, e.g. "#22c55e") */
  glowColor?: string;
  /** Stagger index for entry animation (0-3) */
  staggerIndex?: number;
  /** Additional style overrides */
  style?: ViewStyle;
  /** Accessibility label for the tile */
  accessibilityLabel: string;
  children: React.ReactNode;
}

const STAGGER_BASE = 60;
const ENTRY_DELAY_OFFSET = 500; // after hero animations

export function BentoTile({
  onPress,
  glowColor,
  staggerIndex = 0,
  style,
  accessibilityLabel,
  children,
}: BentoTileProps) {
  const { isDark } = useTheme();
  const { impact } = useHaptics();
  const reducedMotion = useReducedMotion();

  const entryDelay = ENTRY_DELAY_OFFSET + staggerIndex * STAGGER_BASE;

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInUp.delay(entryDelay)
              .duration(400)
              .springify()
              .damping(14)
              .stiffness(170)
              .mass(0.9)
      }
      style={style}
    >
      <PressableScale
        onPress={() => {
          impact();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? glass.dark.bg : "#ffffff",
            borderColor: isDark ? glass.dark.border : glass.light.borderStrong,
          },
        ]}
      >
        {/* Inner glow gradient (subtle diagonal) */}
        {glowColor && (
          <LinearGradient
            colors={[`${glowColor}${isDark ? "12" : "08"}`, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {children}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | grep -E "BentoTile|error" | head -20`
Expected: No errors related to BentoTile

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/BentoTile.tsx
git commit -m "feat(scan): add BentoTile glass wrapper component"
```

---

### Task 2: BentoGrid — Asymmetric Layout Container

**Files:**
- Create: `optimus-halal/src/components/scan/BentoGrid.tsx`

**Context:** 2-row grid. Row 1: 2/3 + 1/3 width. Row 2: 1/3 + 2/3 width (swappable via `prioritizeAlternatives`). Uses flexbox with `flex: 2` / `flex: 1` ratios. The grid receives all tile data and sheet callbacks from the orchestrator, but individual tile components are defined separately.

- [ ] **Step 1: Create BentoGrid component**

```tsx
/**
 * BentoGrid — 2-row asymmetric tile layout for scan result dashboard.
 *
 * Row 1: HalalMadhabTile (2/3) + HealthScoreTile (1/3)
 * Row 2: AlertsTile (1/3) + AlternativesTile (2/3)
 *   — Swaps when prioritizeAlternatives is true (haram/doubtful)
 *
 * @module components/scan/BentoGrid
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { HalalMadhabTile } from "./HalalMadhabTile";
import { HealthScoreTile } from "./HealthScoreTile";
import { AlertsTile } from "./AlertsTile";
import { AlternativesTile } from "./AlternativesTile";
import { spacing } from "@/theme/spacing";
import { halalStatus as halalStatusTokens } from "@/theme/colors";

// ── Types (from spec section 11) ──

interface MadhabVerdictItem {
  madhab: string;
  status: "halal" | "doubtful" | "haram" | "unknown";
  conflictingAdditives: Array<{
    code: string;
    name: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
  conflictingIngredients?: Array<{
    pattern: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
}

interface PersonalAlertItem {
  type: string;
  severity: "warning" | "info" | "danger";
  title: string;
  message: string;
}

interface AlternativeProductItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string;
}

export interface BentoGridProps {
  /** Swap Row 2 tiles (alternatives first) for haram/doubtful products */
  prioritizeAlternatives: boolean;
  /** Halal analysis result */
  halalAnalysis: {
    status: string;
    trustScore: number | null;
    analysisSource: string | null;
  } | null;
  /** Per-madhab verdicts */
  madhabVerdicts: MadhabVerdictItem[];
  /** Certifier data (null if no certifier) */
  certifierData: { name: string; id: string } | null;
  /** Product info for ingredient count */
  product: {
    ingredients: string | null;
    additives: Array<{ code: string; name: string }> | null;
  };
  /** User's preferred madhab */
  userMadhab: string;
  /** Effective halal status for hero */
  effectiveHeroStatus: string;
  /** Health score data */
  healthScore: {
    score: number;
    label: string;
  } | null;
  /** OFF extras (nutriscore, nova, ecoscore) */
  offExtras: {
    nutriscoreGrade: string | null;
    novaGroup: number | null;
    ecoscoreGrade: string | null;
  } | null;
  /** Personal alerts list */
  personalAlerts: PersonalAlertItem[];
  /** Alternative products */
  alternativesData: AlternativeProductItem[];
  /** Whether alternatives are still loading */
  alternativesLoading: boolean;
  /** Sheet open callbacks */
  onOpenHalalSheet: () => void;
  onOpenHealthSheet: () => void;
  onOpenAlertsSheet: () => void;
  onOpenAlternativesSheet: () => void;
}

export function BentoGrid({
  prioritizeAlternatives,
  halalAnalysis,
  madhabVerdicts,
  certifierData,
  product,
  userMadhab,
  effectiveHeroStatus,
  healthScore,
  offExtras,
  personalAlerts,
  alternativesData,
  alternativesLoading,
  onOpenHalalSheet,
  onOpenHealthSheet,
  onOpenAlertsSheet,
  onOpenAlternativesSheet,
}: BentoGridProps) {
  const reducedMotion = useReducedMotion();

  // Count ingredients (split by comma) and additives
  const ingredientCount = product.ingredients
    ? product.ingredients.split(",").length
    : 0;
  const additiveCount = product.additives?.length ?? 0;

  // Row 2 tile order depends on product status
  const alertsTile = (
    <AlertsTile
      alerts={personalAlerts}
      staggerIndex={prioritizeAlternatives ? 3 : 2}
      onPress={onOpenAlertsSheet}
    />
  );

  const alternativesTile = (
    <AlternativesTile
      alternatives={alternativesData}
      loading={alternativesLoading}
      isHaram={prioritizeAlternatives}
      staggerIndex={prioritizeAlternatives ? 2 : 3}
      onPress={onOpenAlternativesSheet}
    />
  );

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInUp.delay(500)
              .duration(400)
              .springify()
              .damping(14)
              .stiffness(170)
              .mass(0.9)
      }
      style={styles.container}
    >
      {/* Row 1: Halal (2/3) + Health (1/3) */}
      <View style={styles.row}>
        <View style={styles.twoThirds}>
          <HalalMadhabTile
            halalAnalysis={halalAnalysis}
            madhabVerdicts={madhabVerdicts}
            certifierData={certifierData}
            userMadhab={userMadhab}
            effectiveHeroStatus={effectiveHeroStatus}
            ingredientCount={ingredientCount}
            additiveCount={additiveCount}
            staggerIndex={0}
            onPress={onOpenHalalSheet}
          />
        </View>
        <View style={styles.oneThird}>
          <HealthScoreTile
            healthScore={healthScore}
            offExtras={offExtras}
            staggerIndex={1}
            onPress={onOpenHealthSheet}
          />
        </View>
      </View>

      {/* Row 2: Alerts (1/3) + Alternatives (2/3) — swappable */}
      <View style={styles.row}>
        {prioritizeAlternatives ? (
          <>
            <View style={styles.twoThirds}>{alternativesTile}</View>
            <View style={styles.oneThird}>{alertsTile}</View>
          </>
        ) : (
          <>
            <View style={styles.oneThird}>{alertsTile}</View>
            <View style={styles.twoThirds}>{alternativesTile}</View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  twoThirds: {
    flex: 2,
  },
  oneThird: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Commit** (will typecheck after all tiles exist)

```bash
git add optimus-halal/src/components/scan/BentoGrid.tsx
git commit -m "feat(scan): add BentoGrid asymmetric layout container"
```

---

### Task 3: HalalMadhabTile

**Files:**
- Create: `optimus-halal/src/components/scan/HalalMadhabTile.tsx`

**Context:** 2/3-width tile in Row 1. Shows: verdict icon (32px AppIcon with radial glow), verdict text, trust bar, 4 mini madhab dots, ingredient/additive count summary, consensus chip if unanimous, and "Voir detail" CTA. Uses `BentoTile` as wrapper.

**Reference files:**
- `optimus-halal/src/lib/icons.tsx` — `AppIcon` component, icon name mapping
- `optimus-halal/src/components/scan/scan-constants.ts` — `STATUS_CONFIG`, `MADHAB_LABEL_KEY`
- `optimus-halal/src/theme/colors.ts` — `halalStatus`, `gold` tokens

- [ ] **Step 1: Create HalalMadhabTile component**

```tsx
/**
 * HalalMadhabTile — Halal verdict + madhab summary tile (2/3 width).
 *
 * Shows verdict icon with glow, trust bar, 4 mini madhab dots,
 * ingredient/additive count, consensus chip, and detail CTA.
 *
 * @module components/scan/HalalMadhabTile
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { CheckCircleIcon } from "phosphor-react-native";
import { BentoTile } from "./BentoTile";
import { AppIcon } from "@/lib/icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  gold,
} from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { MADHAB_LABEL_KEY } from "./scan-constants";
import { useEffect } from "react";

// ── Verdict icon mapping (culturally appropriate — Al-Niyyah) ──

const VERDICT_ICONS: Record<string, { icon: "handshake" | "shield-warning" | "hand-palm" | "help-outline"; weight: "fill" | "regular" }> = {
  halal: { icon: "handshake", weight: "fill" },
  doubtful: { icon: "shield-warning", weight: "fill" },
  haram: { icon: "hand-palm", weight: "fill" },
  unknown: { icon: "help-outline", weight: "regular" },
};

const STATUS_COLORS: Record<string, string> = {
  halal: halalStatusTokens.halal.base,
  doubtful: halalStatusTokens.doubtful.base,
  haram: halalStatusTokens.haram.base,
  unknown: halalStatusTokens.unknown.base,
};

// ── Props ──

export interface HalalMadhabTileProps {
  halalAnalysis: {
    status: string;
    trustScore: number | null;
    analysisSource: string | null;
  } | null;
  madhabVerdicts: Array<{
    madhab: string;
    status: string;
    conflictingAdditives: any[];
    conflictingIngredients?: any[];
  }>;
  certifierData: { name: string; id: string } | null;
  userMadhab: string;
  effectiveHeroStatus: string;
  ingredientCount: number;
  additiveCount: number;
  staggerIndex: number;
  onPress: () => void;
}

export function HalalMadhabTile({
  halalAnalysis,
  madhabVerdicts,
  certifierData,
  userMadhab,
  effectiveHeroStatus,
  ingredientCount,
  additiveCount,
  staggerIndex,
  onPress,
}: HalalMadhabTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const status = effectiveHeroStatus || "unknown";
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
  const verdictIcon = VERDICT_ICONS[status] ?? VERDICT_ICONS.unknown;
  const trustScore = halalAnalysis?.trustScore ?? null;

  // Verdict label (informative — Al-Niyyah)
  const verdictLabels: Record<string, string> = {
    halal: t.scanResult.verdictHalal,
    doubtful: t.scanResult.verdictDoubtful,
    haram: t.scanResult.verdictHaram,
    unknown: t.scanResult.verdictUnknown,
  };
  const verdictLabel = verdictLabels[status] ?? verdictLabels.unknown;

  // Unanimous consensus
  const isUnanimous =
    madhabVerdicts.length > 0 &&
    madhabVerdicts.every((v) => v.status === madhabVerdicts[0].status);

  // Animated trust bar fill
  const barWidth = useSharedValue(0);
  useEffect(() => {
    if (trustScore !== null && !reducedMotion) {
      barWidth.value = withTiming(trustScore / 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    } else if (trustScore !== null) {
      barWidth.value = trustScore / 100;
    }
  }, [trustScore, reducedMotion, barWidth]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  return (
    <BentoTile
      onPress={onPress}
      glowColor={statusColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${verdictLabel}. ${isUnanimous ? t.scanResult.madhabUnanimousHalal : ""}`}
      style={styles.tileOuter}
    >
      <View style={styles.content}>
        {/* ── Verdict row: icon + text + trust ── */}
        <View style={styles.verdictRow}>
          {/* Icon with radial glow */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconGlow,
                {
                  backgroundColor: statusColor,
                  opacity: isDark ? 0.14 : 0.08,
                },
                Platform.OS === "ios" && {
                  shadowColor: statusColor,
                  shadowOpacity: isDark ? 0.25 : 0.12,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 10,
                },
              ]}
            />
            <AppIcon
              name={verdictIcon.icon}
              size={32}
              color={statusColor}
              weight={verdictIcon.weight}
            />
          </View>

          <View style={styles.verdictInfo}>
            <Text
              style={[styles.verdictText, { color: statusColor }]}
              numberOfLines={1}
            >
              {verdictLabel}
            </Text>

            {/* Trust bar (only if certifier exists) */}
            {trustScore !== null && (
              <View style={styles.trustBarContainer}>
                <View
                  style={[
                    styles.trustBarTrack,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.trustBarFill,
                      { backgroundColor: statusColor },
                      barAnimatedStyle,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.trustPercent,
                    { color: statusColor },
                  ]}
                >
                  {trustScore}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Mini madhab dots ── */}
        {madhabVerdicts.length > 0 && (
          <View style={styles.madhabRow}>
            {madhabVerdicts.map((v) => {
              const labelKey =
                MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
              const label = labelKey ? t.scanResult[labelKey] : v.madhab;
              const dotColor =
                STATUS_COLORS[v.status] ?? STATUS_COLORS.unknown;
              const isUser = userMadhab === v.madhab;

              return (
                <View key={v.madhab} style={styles.madhabItem}>
                  <View
                    style={[
                      styles.madhabDot,
                      {
                        backgroundColor: dotColor,
                        borderColor: isUser ? gold[500] : "transparent",
                        borderWidth: isUser ? 1.5 : 0,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.madhabLabel,
                      {
                        color: isUser
                          ? gold[500]
                          : colors.textSecondary,
                        fontWeight: isUser
                          ? fontWeightTokens.bold
                          : fontWeightTokens.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isUser ? `\u2605 ${label}` : label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Bottom row: ingredient count + consensus + CTA ── */}
        <View style={styles.bottomRow}>
          <Text style={[styles.ingredientCount, { color: colors.textMuted }]}>
            {ingredientCount} {t.scanResult.ingredients?.toLowerCase() ?? "ingr."} · {additiveCount} {t.scanResult.additives?.toLowerCase() ?? "add."}
          </Text>

          {isUnanimous && (
            <View
              style={[
                styles.consensusChip,
                {
                  backgroundColor: `${statusColor}${isDark ? "14" : "0C"}`,
                  borderColor: `${statusColor}${isDark ? "25" : "15"}`,
                },
              ]}
            >
              <CheckCircleIcon size={9} color={statusColor} weight="fill" />
              <Text style={[styles.consensusText, { color: statusColor }]}>
                {t.scanResult.madhabConsensus ?? "Unanime"}
              </Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <Text
          style={[
            styles.ctaText,
            { color: isDark ? gold[400] : gold[700] },
          ]}
        >
          {t.scanResult.viewDetail ?? "Voir detail"} →
        </Text>
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  verdictInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  verdictText: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
  },
  trustBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trustBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  trustBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  trustPercent: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  madhabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  madhabItem: {
    alignItems: "center",
    gap: 2,
  },
  madhabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  madhabLabel: {
    fontSize: fontSizeTokens.micro,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredientCount: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  consensusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  consensusText: {
    fontSize: 9,
    fontWeight: fontWeightTokens.bold,
  },
  ctaText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/HalalMadhabTile.tsx
git commit -m "feat(scan): add HalalMadhabTile verdict + madhab summary tile"
```

---

### Task 4: HealthScoreTile

**Files:**
- Create: `optimus-halal/src/components/scan/HealthScoreTile.tsx`

**Context:** 1/3-width tile in Row 1. Shows: health score number centered, 180deg SVG arc (colored by threshold), score label, NutriScore/NOVA/EcoScore mini badges, and CTA. Uses `react-native-svg` (already a dependency via `MadhabScoreRing`).

- [ ] **Step 1: Create HealthScoreTile component**

```tsx
/**
 * HealthScoreTile — Health score summary tile (1/3 width).
 *
 * Shows: score /100, 180deg SVG arc, label, NutriScore/NOVA/EcoScore
 * badges, and detail CTA.
 *
 * @module components/scan/HealthScoreTile
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { HEALTH_SCORE_LABEL_KEYS } from "./scan-constants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Arc constants (180deg half-circle)
const ARC_SIZE = 64;
const STROKE_WIDTH = 4;
const ARC_RADIUS = (ARC_SIZE - STROKE_WIDTH) / 2;
const HALF_CIRCUMFERENCE = Math.PI * ARC_RADIUS; // 180deg

function getScoreColor(score: number): string {
  if (score >= 70) return halalStatusTokens.halal.base;
  if (score >= 40) return halalStatusTokens.doubtful.base;
  return halalStatusTokens.haram.base;
}

export interface HealthScoreTileProps {
  healthScore: { score: number; label: string } | null;
  offExtras: {
    nutriscoreGrade: string | null;
    novaGroup: number | null;
    ecoscoreGrade: string | null;
  } | null;
  staggerIndex: number;
  onPress: () => void;
}

// ── Badge colors ──
const NUTRI_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

const NOVA_COLORS: Record<number, string> = {
  1: "#038141",
  2: "#85BB2F",
  3: "#FECB02",
  4: "#E63E11",
};

export function HealthScoreTile({
  healthScore,
  offExtras,
  staggerIndex,
  onPress,
}: HealthScoreTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const score = healthScore?.score ?? 0;
  const scoreColor = getScoreColor(score);
  const labelKey = healthScore?.label
    ? HEALTH_SCORE_LABEL_KEYS[healthScore.label]
    : null;
  const scoreLabel = labelKey ? t.scanResult[labelKey] : "—";

  // Animated arc fill
  const progress = useSharedValue(0);
  useEffect(() => {
    if (healthScore && !reducedMotion) {
      progress.value = withTiming(score / 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    } else if (healthScore) {
      progress.value = score / 100;
    }
  }, [score, healthScore, reducedMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: HALF_CIRCUMFERENCE * (1 - progress.value),
  }));

  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const nutriGrade = offExtras?.nutriscoreGrade?.toLowerCase() ?? null;
  const novaGroup = offExtras?.novaGroup ?? null;
  const ecoGrade = offExtras?.ecoscoreGrade?.toLowerCase() ?? null;

  return (
    <BentoTile
      onPress={onPress}
      glowColor={scoreColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${t.scanResult.healthScore ?? "Score santé"}: ${score}/100, ${scoreLabel}`}
      style={styles.tileOuter}
    >
      <View style={styles.content}>
        {/* SVG Arc + Score */}
        <View style={styles.arcContainer}>
          <Svg
            width={ARC_SIZE}
            height={ARC_SIZE / 2 + STROKE_WIDTH}
            viewBox={`0 0 ${ARC_SIZE} ${ARC_SIZE / 2 + STROKE_WIDTH}`}
          >
            {/* Track */}
            <Circle
              cx={ARC_SIZE / 2}
              cy={ARC_SIZE / 2}
              r={ARC_RADIUS}
              fill="none"
              stroke={trackColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform={`rotate(180 ${ARC_SIZE / 2} ${ARC_SIZE / 2})`}
            />
            {/* Fill */}
            <AnimatedCircle
              cx={ARC_SIZE / 2}
              cy={ARC_SIZE / 2}
              r={ARC_RADIUS}
              fill="none"
              stroke={scoreColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform={`rotate(180 ${ARC_SIZE / 2} ${ARC_SIZE / 2})`}
              animatedProps={animatedProps}
            />
          </Svg>

          {/* Score number centered below arc */}
          <View style={styles.scoreOverlay}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {healthScore ? score : "—"}
            </Text>
            <Text style={[styles.scoreOutOf, { color: colors.textMuted }]}>
              /100
            </Text>
          </View>
        </View>

        {/* Score label */}
        <Text
          style={[styles.scoreLabel, { color: scoreColor }]}
          numberOfLines={1}
        >
          {scoreLabel}
        </Text>

        {/* NutriScore / NOVA / EcoScore badges */}
        <View style={styles.badgeRow}>
          {nutriGrade && (
            <View
              style={[
                styles.badge,
                { backgroundColor: NUTRI_COLORS[nutriGrade] ?? colors.textMuted },
              ]}
            >
              <Text style={styles.badgeText}>
                {nutriGrade.toUpperCase()}
              </Text>
            </View>
          )}
          {novaGroup !== null && (
            <View
              style={[
                styles.badge,
                { backgroundColor: NOVA_COLORS[novaGroup] ?? colors.textMuted },
              ]}
            >
              <Text style={styles.badgeText}>{novaGroup}</Text>
            </View>
          )}
          {ecoGrade && (
            <View
              style={[
                styles.badge,
                { backgroundColor: NUTRI_COLORS[ecoGrade] ?? colors.textMuted },
              ]}
            >
              <Text style={styles.badgeText}>
                {ecoGrade.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <Text
          style={[
            styles.ctaText,
            { color: isDark ? gold[400] : gold[700] },
          ]}
        >
          {t.scanResult.viewDetail ?? "Voir"} →
        </Text>
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  arcContainer: {
    alignItems: "center",
  },
  scoreOverlay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: -4,
  },
  scoreNumber: {
    fontSize: fontSizeTokens.h2,
    fontWeight: fontWeightTokens.black,
    letterSpacing: -0.5,
  },
  scoreOutOf: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  scoreLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  ctaText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/HealthScoreTile.tsx
git commit -m "feat(scan): add HealthScoreTile with SVG arc and badges"
```

---

### Task 5: AlertsTile

**Files:**
- Create: `optimus-halal/src/components/scan/AlertsTile.tsx`

**Context:** 1/3-width tile in Row 2. Two states: alerts present (count + top 2 preview) or clean (CheckCircle + "Aucune alerte"). Background tint matches state color.

- [ ] **Step 1: Create AlertsTile component**

```tsx
/**
 * AlertsTile — Personal alerts summary tile (1/3 width).
 *
 * With alerts: count + icon + top 2 preview lines.
 * Zero alerts: CheckCircle + "Aucune alerte" + "Tout est bon".
 *
 * @module components/scan/AlertsTile
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircleIcon, WarningCircleIcon } from "phosphor-react-native";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing } from "@/theme/spacing";

interface AlertItem {
  type: string;
  severity: "warning" | "info" | "danger";
  title: string;
  message: string;
}

export interface AlertsTileProps {
  alerts: AlertItem[];
  staggerIndex: number;
  onPress: () => void;
}

export function AlertsTile({ alerts, staggerIndex, onPress }: AlertsTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const hasAlerts = alerts.length > 0;
  const glowColor = hasAlerts
    ? halalStatusTokens.doubtful.base
    : halalStatusTokens.halal.base;

  return (
    <BentoTile
      onPress={onPress}
      glowColor={glowColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={
        hasAlerts
          ? `${alerts.length} ${t.scanResult.personalAlertsTitle ?? "alertes"}`
          : t.scanResult.noAlerts ?? "Aucune alerte"
      }
      style={styles.tileOuter}
    >
      <View style={styles.content}>
        {hasAlerts ? (
          <>
            <View style={styles.headerRow}>
              <WarningCircleIcon
                size={20}
                color={halalStatusTokens.doubtful.base}
                weight="fill"
              />
              <Text
                style={[
                  styles.count,
                  { color: halalStatusTokens.doubtful.base },
                ]}
              >
                {alerts.length}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {alerts.length === 1
                ? t.scanResult.alertSingular ?? "alerte"
                : t.scanResult.alertPlural ?? "alertes"}
            </Text>
            {/* Top 2 alert previews */}
            {alerts.slice(0, 2).map((alert, i) => (
              <Text
                key={i}
                style={[styles.alertPreview, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                • {alert.title}
              </Text>
            ))}
          </>
        ) : (
          <>
            <CheckCircleIcon
              size={20}
              color={halalStatusTokens.halal.base}
              weight="fill"
            />
            <Text
              style={[
                styles.cleanTitle,
                { color: halalStatusTokens.halal.base },
              ]}
            >
              {t.scanResult.noAlerts ?? "Aucune alerte"}
            </Text>
            <Text style={[styles.cleanSubtitle, { color: colors.textMuted }]}>
              {t.scanResult.allGood ?? "Tout est bon"}
            </Text>
          </>
        )}

        {/* CTA */}
        {hasAlerts && (
          <Text
            style={[
              styles.ctaText,
              { color: isDark ? gold[400] : gold[700] },
            ]}
          >
            {t.scanResult.viewDetail ?? "Voir"} →
          </Text>
        )}
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  count: {
    fontSize: fontSizeTokens.h3,
    fontWeight: fontWeightTokens.bold,
  },
  subtitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  alertPreview: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  cleanTitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  cleanSubtitle: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  ctaText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/AlertsTile.tsx
git commit -m "feat(scan): add AlertsTile with alerts/clean states"
```

---

### Task 6: AlternativesTile

**Files:**
- Create: `optimus-halal/src/components/scan/AlternativesTile.tsx`

**Context:** 2/3-width tile in Row 2. Shows: header (contextual for haram vs halal), image deck (up to 3 overlapping images), first alternative name + halal badge, count, and CTA. Haram products get a green-accented border to encourage action.

- [ ] **Step 1: Create AlternativesTile component**

```tsx
/**
 * AlternativesTile — Alternatives summary tile (2/3 width).
 *
 * Shows image deck (3 stacked), first product preview,
 * count, and contextual header.
 * Haram/doubtful: "Des alternatives existent" + green accent border.
 *
 * @module components/scan/AlternativesTile
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold, glass } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

interface AlternativeItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string;
}

export interface AlternativesTileProps {
  alternatives: AlternativeItem[];
  loading: boolean;
  /** True when product is haram/doubtful → priority header + green accent */
  isHaram: boolean;
  staggerIndex: number;
  onPress: () => void;
}

export function AlternativesTile({
  alternatives,
  loading,
  isHaram,
  staggerIndex,
  onPress,
}: AlternativesTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const hasAlternatives = alternatives.length > 0;
  const first = alternatives[0] ?? null;
  const images = alternatives.slice(0, 3);

  const header = isHaram
    ? t.scanResult.alternativesPriority ?? "Des alternatives existent"
    : t.scanResult.alternativesDiscover ?? "Decouvrir aussi";

  return (
    <BentoTile
      onPress={onPress}
      glowColor={isHaram ? halalStatusTokens.halal.base : undefined}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${header}: ${alternatives.length} ${t.scanResult.products ?? "produits"}`}
      style={[
        styles.tileOuter,
        isHaram && {
          borderColor: `${halalStatusTokens.halal.base}30`,
          borderWidth: 1,
          borderRadius: radius.xl,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.header,
              { color: isDark ? gold[400] : gold[700] },
            ]}
          >
            {header.toUpperCase()}
          </Text>
          {hasAlternatives && (
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {alternatives.length} {t.scanResult.products ?? "produits"}
            </Text>
          )}
        </View>

        {hasAlternatives ? (
          <>
            {/* Image deck (up to 3 overlapping) */}
            <View style={styles.imageDeck}>
              {images.map((alt, i) => (
                <Image
                  key={alt.id}
                  source={alt.imageUrl ?? undefined}
                  style={[
                    styles.deckImage,
                    {
                      transform: [{ translateX: i * -8 }],
                      zIndex: 3 - i,
                      borderColor: isDark
                        ? glass.dark.border
                        : glass.light.borderStrong,
                    },
                  ]}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </View>

            {/* First alternative name + halal badge */}
            {first && (
              <View style={styles.previewRow}>
                <Text
                  style={[
                    styles.productName,
                    { color: colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {first.name}
                  {first.brand ? ` · ${first.brand}` : ""}
                </Text>
                {first.halalStatus === "halal" && (
                  <View
                    style={[
                      styles.halalBadge,
                      {
                        backgroundColor: `${halalStatusTokens.halal.base}${isDark ? "18" : "0E"}`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.halalBadgeText,
                        { color: halalStatusTokens.halal.base },
                      ]}
                    >
                      Halal
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* CTA */}
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? gold[400] : gold[700] },
              ]}
            >
              {t.scanResult.seeAll ?? "Voir tout"} →
            </Text>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {loading
              ? t.scanResult.loadingAlternatives ?? "Chargement..."
              : t.scanResult.noAlternatives ?? "Aucune alternative trouvee"}
          </Text>
        )}
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.8,
  },
  count: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  imageDeck: {
    flexDirection: "row",
    paddingLeft: 16, // offset for overlap
  },
  deckImage: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  productName: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  halalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  halalBadgeText: {
    fontSize: 9,
    fontWeight: fontWeightTokens.bold,
  },
  ctaText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
  },
  emptyText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/AlternativesTile.tsx
git commit -m "feat(scan): add AlternativesTile with image deck and contextual header"
```

---

### Task 7: Typecheck all new tile components

- [ ] **Step 1: Run typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: 0 errors (or only pre-existing errors unrelated to new files)

- [ ] **Step 2: Fix any type errors found**

Adjust imports, prop types, or i18n key access as needed. The i18n keys like `t.scanResult.viewDetail` may need to be added — check `src/i18n/translations/fr.ts` for exact key names and adjust tile code to use existing keys where available.

- [ ] **Step 3: Commit fixes**

```bash
git add -u
git commit -m "fix(scan): resolve typecheck errors in bento tile components"
```

---

## Chunk 2: Overlay & Bar Components

### Task 8: CompactStickyHeader

**Files:**
- Create: `optimus-halal/src/components/scan/CompactStickyHeader.tsx`

**Context:** Replaces `StickyVerdictHeader.tsx`. Key differences: scroll-interpolated opacity/translateY (not boolean toggle), product image 28x28, condensed certifier logo 16px, 52pt height. Uses `useAnimatedStyle` driven by a shared `scrollY` value.

**Reference:** `optimus-halal/src/components/scan/StickyVerdictHeader.tsx` (current implementation to replace)

- [ ] **Step 1: Create CompactStickyHeader component**

```tsx
/**
 * CompactStickyHeader — Scroll-interpolated glassmorphic header.
 *
 * Replaces StickyVerdictHeader. Instead of boolean toggle,
 * uses smooth opacity + translateY interpolation driven by
 * Reanimated shared scrollY value.
 *
 * 52pt height: [back] [image 28] name · brand [verdict pill] [certifier 16]
 *
 * @module components/scan/CompactStickyHeader
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens, glass } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";

export interface CompactStickyHeaderProps {
  /** Reanimated shared value for scroll position */
  scrollY: Animated.SharedValue<number>;
  /** Scroll threshold — HERO_HEIGHT */
  heroHeight: number;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
  certifierData: { name: string; logoUrl?: string | null } | null;
  onTrustScorePress?: () => void;
}

export function CompactStickyHeader({
  scrollY,
  heroHeight,
  productName,
  brand,
  imageUrl,
  effectiveHeroStatus,
  heroLabel,
  certifierData,
  onTrustScorePress,
}: CompactStickyHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  // Interpolation: fade in + slide down over last 60pt of hero scroll
  const animatedStyle = useAnimatedStyle(() => {
    const start = heroHeight - 60;
    const end = heroHeight;
    return {
      opacity: interpolate(
        scrollY.value,
        [start, end],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [start, end],
            [-52, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      {/* Glass background */}
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(12,12,12,0.85)"
                : "rgba(255,255,255,0.90)",
            },
          ]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(12,12,12,0.95)"
                : "rgba(255,255,255,0.95)",
            },
          ]}
        />
      )}

      {/* Border bottom */}
      <View
        style={[
          styles.borderBottom,
          {
            backgroundColor: isDark
              ? glass.dark.border
              : glass.light.borderStrong,
          },
        ]}
      />

      {/* Content */}
      <View style={styles.inner}>
        {/* Product image */}
        <Image
          source={imageUrl ?? undefined}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />

        {/* Name · Brand */}
        <Text
          style={[styles.productName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {productName}
          {brand ? ` · ${brand}` : ""}
        </Text>

        {/* Verdict pill */}
        <View
          style={[
            styles.verdictPill,
            { backgroundColor: `${statusConfig.color}18` },
          ]}
        >
          <View
            style={[
              styles.verdictDot,
              { backgroundColor: statusConfig.color },
            ]}
          />
          <Text
            style={[styles.verdictText, { color: statusConfig.color }]}
            numberOfLines={1}
          >
            {heroLabel}
          </Text>
        </View>

        {/* Certifier logo (condensed) */}
        {certifierData && (
          <CertifierLogo
            name={certifierData.name}
            logoUrl={certifierData.logoUrl ?? null}
            size={16}
            onPress={onTrustScorePress}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 52,
  },
  productImage: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  productName: {
    flex: 1,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  verdictPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verdictText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  borderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/CompactStickyHeader.tsx
git commit -m "feat(scan): add CompactStickyHeader with scroll interpolation"
```

---

### Task 9: ScanBottomBar

**Files:**
- Create: `optimus-halal/src/components/scan/ScanBottomBar.tsx`

**Context:** Replaces `ScanActionBar.tsx`. Fixed bottom bar (not floating), styled like `PremiumTabBar`. 4 slots: Favori (toggle), Partager, contextual CTA (Ou acheter? / Re-scanner based on status), Signaler. Glass background with blur on iOS.

**Reference:** `optimus-halal/src/components/scan/ScanActionBar.tsx` (current — to understand all props/callbacks)

- [ ] **Step 1: Create ScanBottomBar component**

```tsx
/**
 * ScanBottomBar — Fixed bottom action bar (PremiumTabBar style).
 *
 * Replaces ScanActionBar. Fixed position (not floating),
 * glassmorphic, 4 slots with contextual CTA.
 *
 * @module components/scan/ScanBottomBar
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import {
  BarcodeIcon,
  FlagIcon,
  HeartIcon,
  ShareNetworkIcon,
  StorefrontIcon,
} from "phosphor-react-native";
import Animated, {
  SlideInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { glass } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import type { HalalStatusKey } from "./scan-constants";

export interface ScanBottomBarProps {
  effectiveHeroStatus: HalalStatusKey;
  productIsFavorite: boolean;
  isFavMutating: boolean;
  marketplaceEnabled: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onFindStores: () => void;
  onGoBack: () => void;
  onReport: () => void;
}

export function ScanBottomBar({
  effectiveHeroStatus,
  productIsFavorite,
  isFavMutating,
  marketplaceEnabled,
  onToggleFavorite,
  onShare,
  onFindStores,
  onGoBack,
  onReport,
}: ScanBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, notification } = useHaptics();
  const reducedMotion = useReducedMotion();

  // Slot 3: contextual CTA
  const isPositive =
    effectiveHeroStatus === "halal" || effectiveHeroStatus === "doubtful";
  const ctaIcon = isPositive ? StorefrontIcon : BarcodeIcon;
  const ctaLabel = isPositive
    ? t.scanResult.whereToBuy ?? "Ou acheter ?"
    : t.scanResult.scanAnother ?? "Re-scanner";
  const ctaAction = isPositive ? onFindStores : onGoBack;

  const CtaIconComponent = ctaIcon;

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : SlideInDown.delay(850).duration(500).springify().damping(14).stiffness(170).mass(0.9)
      }
      style={[
        styles.container,
        { paddingBottom: insets.bottom || spacing.md },
      ]}
    >
      {/* Glass background */}
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(12,12,12,0.92)"
                : "rgba(255,255,255,0.95)",
            },
          ]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(12,12,12,0.97)"
                : "rgba(255,255,255,0.97)",
            },
          ]}
        />
      )}

      {/* Top border */}
      <View
        style={[
          styles.borderTop,
          {
            backgroundColor: isDark
              ? glass.dark.border
              : glass.light.borderStrong,
          },
        ]}
      />

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        {/* Favori */}
        <PressableScale
          onPress={() => {
            impact();
            onToggleFavorite();
          }}
          disabled={isFavMutating}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.favorite ?? "Favori"}
          style={styles.actionItem}
        >
          <HeartIcon
            size={22}
            color={productIsFavorite ? colors.primary : colors.textMuted}
            weight={productIsFavorite ? "fill" : "regular"}
          />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
            {t.scanResult.favorite ?? "Favori"}
          </Text>
        </PressableScale>

        {/* Partager */}
        <PressableScale
          onPress={() => {
            impact();
            onShare();
          }}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.share ?? "Partager"}
          style={styles.actionItem}
        >
          <ShareNetworkIcon size={22} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
            {t.scanResult.share ?? "Partager"}
          </Text>
        </PressableScale>

        {/* Contextual CTA */}
        <PressableScale
          onPress={() => {
            impact();
            ctaAction();
          }}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={styles.actionItem}
        >
          <CtaIconComponent size={22} color={colors.textMuted} />
          <Text
            style={[styles.actionLabel, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {ctaLabel}
          </Text>
        </PressableScale>

        {/* Signaler */}
        <PressableScale
          onPress={() => {
            notification("warning");
            onReport();
          }}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.report ?? "Signaler"}
          style={styles.actionItem}
        >
          <FlagIcon size={22} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
            {t.scanResult.report ?? "Signaler"}
          </Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 90,
    overflow: "hidden",
  },
  borderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  actionItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 60,
  },
  actionLabel: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/ScanBottomBar.tsx
git commit -m "feat(scan): add ScanBottomBar fixed bottom bar with contextual CTA"
```

---

## Chunk 3: Orchestrator Rewire

### Task 10: Modify VerdictHero — compact 35%

**Files:**
- Modify: `optimus-halal/src/components/scan/VerdictHero.tsx`

**Context:** Change `HERO_HEIGHT` from `0.50` to `0.35`. Switch from fixed height to `minHeight`. Tighten vertical spacing (marginBottom md → sm on verdict/trust sections). Shrink image 80→72. Community line font micro.

- [ ] **Step 1: Read current VerdictHero constants**

Read: `optimus-halal/src/components/scan/VerdictHero.tsx` — find `HERO_HEIGHT`, image size, and spacing values.

- [ ] **Step 2: Update HERO_HEIGHT and sizing**

Changes:
1. `HERO_HEIGHT = SCREEN_HEIGHT * 0.5` → `HERO_HEIGHT = SCREEN_HEIGHT * 0.35`
2. Image size: Find style with `width: 80` or similar → change to 72
3. Community line: find the `fontSize` used → change to `fontSizeTokens.micro` (10)
4. Tighten margins: find `marginBottom: spacing.md` blocks and change to `spacing.sm` where appropriate to compress vertical space

- [ ] **Step 3: Export HERO_HEIGHT** for use by CompactStickyHeader

Add: `export { HERO_HEIGHT };` so `scan-result.tsx` can import and pass to `CompactStickyHeader`.

- [ ] **Step 4: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | grep -i "error" | head -10`

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/components/scan/VerdictHero.tsx
git commit -m "feat(scan): compact VerdictHero to 35% viewport height"
```

---

### Task 11: Rewire scan-result.tsx — BentoGrid + Sheets + Bottom Bar

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

**Context:** This is the major orchestrator rewire. Steps:
1. Replace scroll sections (HalalAnalysisSection, HealthNutritionSection, AlternativesSection, AlertStrip) with BentoGrid component
2. Replace ScanActionBar with ScanBottomBar
3. Replace StickyVerdictHeader with CompactStickyHeader (scroll-interpolated)
4. Add 4 @gorhom/bottom-sheet refs for tile-triggered sheets
5. Update scroll handler to use shared value instead of state boolean
6. Keep all preserved features (vote, quota, disclaimer, image modal, level-up, share card)

**This task has many sub-steps. Take them one at a time.**

- [ ] **Step 1: Update imports**

Remove:
```tsx
import { ScanActionBar } from "@/components/scan/ScanActionBar";
import { StickyVerdictHeader } from "@/components/scan/StickyVerdictHeader";
import { HalalAnalysisSection } from "@/components/scan/HalalAnalysisSection";
import { HealthNutritionSection } from "@/components/scan/HealthNutritionSection";
import { AlternativesSection } from "@/components/scan/AlternativesSection";
import { AlertStrip } from "@/components/scan/AlertStrip";
```

Add:
```tsx
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSharedValue } from "react-native-reanimated";
import { BentoGrid } from "@/components/scan/BentoGrid";
import { ScanBottomBar } from "@/components/scan/ScanBottomBar";
import { CompactStickyHeader } from "@/components/scan/CompactStickyHeader";
import { HERO_HEIGHT } from "@/components/scan/VerdictHero";
// Re-import sections for sheet content:
import { HalalAnalysisSection } from "@/components/scan/HalalAnalysisSection";
import { HealthNutritionSection } from "@/components/scan/HealthNutritionSection";
import { AlternativesSection } from "@/components/scan/AlternativesSection";
import { AlertStrip } from "@/components/scan/AlertStrip";
import { MadhabVerdictCard } from "@/components/scan/MadhabVerdictCard";
```

- [ ] **Step 2: Add sheet refs and shared scroll value**

After existing refs, add:
```tsx
// @gorhom/bottom-sheet refs for tile-triggered detail sheets
const halalSheetRef = useRef<BottomSheet>(null);
const healthSheetRef = useRef<BottomSheet>(null);
const alertsSheetRef = useRef<BottomSheet>(null);
const alternativesSheetRef = useRef<BottomSheet>(null);

// Shared scroll value for CompactStickyHeader interpolation
const scrollY = useSharedValue(0);
```

- [ ] **Step 3: Update scroll handler**

Replace:
```tsx
const scrollHandler = useAnimatedScrollHandler({
  onScroll(event) {
    const y = event.contentOffset.y;
    const threshold = HERO_HEIGHT * 0.6;
    const pastHero = y > threshold;
    runOnJS(setScrolledPastHero)(pastHero);
  },
});
```

With:
```tsx
const scrollHandler = useAnimatedScrollHandler({
  onScroll(event) {
    scrollY.value = event.contentOffset.y;
  },
});
```

Remove the `scrolledPastHero` state (`useState(false)` and `setScrolledPastHero`).

- [ ] **Step 4: Add sheet open callbacks**

```tsx
const handleOpenHalalSheet = useCallback(() => {
  halalSheetRef.current?.snapToIndex(0);
}, []);
const handleOpenHealthSheet = useCallback(() => {
  healthSheetRef.current?.snapToIndex(0);
}, []);
const handleOpenAlertsSheet = useCallback(() => {
  alertsSheetRef.current?.snapToIndex(0);
}, []);
const handleOpenAlternativesSheet = useCallback(() => {
  alternativesSheetRef.current?.snapToIndex(0);
}, []);
```

- [ ] **Step 5: Replace scroll content JSX**

Remove the AlertStrip, MadhabVerdictCard, contentContainer (HalalAnalysisSection, AlternativesSection, HealthNutritionSection, disclaimer) from inside `Animated.ScrollView`.

Replace with:
```tsx
<Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}
  contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

  {/* Hero (compact 35%) */}
  <VerdictHero ... />

  {/* Bento Grid Dashboard */}
  <BentoGrid
    prioritizeAlternatives={effectiveHeroStatus === "haram" || effectiveHeroStatus === "doubtful"}
    halalAnalysis={halalAnalysis ? { status: halalAnalysis.status, trustScore: certifierTrustScore, analysisSource: halalAnalysis.analysisSource ?? null } : null}
    madhabVerdicts={madhabVerdicts}
    certifierData={certifierData ? { name: certifierData.name, id: certifierData.id } : null}
    product={{ ingredients: product?.ingredients ?? null, additives: product?.additives ?? null }}
    userMadhab={userMadhab}
    effectiveHeroStatus={effectiveHeroStatus}
    healthScore={healthScore}
    offExtras={offExtras}
    personalAlerts={personalAlerts}
    alternativesData={alternativesQuery.data ?? []}
    alternativesLoading={alternativesQuery.isLoading}
    onOpenHalalSheet={handleOpenHalalSheet}
    onOpenHealthSheet={handleOpenHealthSheet}
    onOpenAlertsSheet={handleOpenAlertsSheet}
    onOpenAlternativesSheet={handleOpenAlternativesSheet}
  />

  {/* Inline preserved: community vote + disclaimer */}
  {/* ... keep existing inline JSX for vote and disclaimer ... */}
</Animated.ScrollView>
```

- [ ] **Step 6: Replace StickyVerdictHeader with CompactStickyHeader**

Replace:
```tsx
<StickyVerdictHeader visible={scrolledPastHero} ... />
```

With:
```tsx
<CompactStickyHeader
  scrollY={scrollY}
  heroHeight={HERO_HEIGHT}
  productName={product?.name ?? ""}
  brand={product?.brand ?? null}
  imageUrl={product?.imageUrl ?? null}
  effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
  heroLabel={heroLabel}
  certifierData={certifierData}
  onTrustScorePress={() => setShowTrustScoreSheet(true)}
/>
```

- [ ] **Step 7: Replace ScanActionBar with ScanBottomBar**

Replace:
```tsx
<ScanActionBar halalStatus={halalStatus} effectiveHeroStatus={effectiveHeroStatus} ... />
```

With:
```tsx
<ScanBottomBar
  effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
  productIsFavorite={productIsFavorite}
  isFavMutating={isFavMutating}
  marketplaceEnabled={marketplaceEnabled}
  onToggleFavorite={handleToggleFavorite}
  onShare={handleShare}
  onFindStores={handleFindStores}
  onGoBack={handleGoBack}
  onReport={handleReport}
/>
```

- [ ] **Step 8: Add 4 @gorhom BottomSheets for tile content**

After the existing bottom sheets (TrustScore, ScoreDetail, Madhab, Nutrient), add:

```tsx
{/* ── Tile-triggered detail sheets (@gorhom/bottom-sheet) ── */}
<BottomSheet
  ref={halalSheetRef}
  index={-1}
  snapPoints={["70%", "95%"]}
  enableDynamicSizing={false}
  enablePanDownToClose
  backgroundStyle={{
    backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  }}
  handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  )}
>
  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
    <MadhabVerdictCard
      madhabVerdicts={madhabVerdicts}
      certifierData={certifierData}
      userMadhab={userMadhab}
      effectiveHeroStatus={effectiveHeroStatus}
      onSelectMadhab={(v) => { impact(); setSelectedMadhab(v); }}
    />
    <HalalAnalysisSection
      {/* pass existing props */}
    />
  </BottomSheetScrollView>
</BottomSheet>

<BottomSheet
  ref={healthSheetRef}
  index={-1}
  snapPoints={["60%", "90%"]}
  enableDynamicSizing={false}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
  handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  )}
>
  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
    <HealthNutritionSection
      {/* pass existing props */}
    />
  </BottomSheetScrollView>
</BottomSheet>

<BottomSheet
  ref={alertsSheetRef}
  index={-1}
  snapPoints={["45%"]}
  enableDynamicSizing={false}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
  handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  )}
>
  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
    <AlertStrip alerts={personalAlerts} boycott={boycott} />
  </BottomSheetScrollView>
</BottomSheet>

<BottomSheet
  ref={alternativesSheetRef}
  index={-1}
  snapPoints={["55%", "85%"]}
  enableDynamicSizing={false}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
  handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  )}
>
  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
    <AlternativesSection
      {/* pass existing props */}
    />
  </BottomSheetScrollView>
</BottomSheet>
```

**Important:** The `{/* pass existing props */}` placeholders must be filled with the EXACT same props that were previously passed to these section components in the scroll view. Copy them directly from the removed JSX.

- [ ] **Step 9: Remove old HERO_HEIGHT constant from scan-result.tsx**

Since HERO_HEIGHT is now imported from VerdictHero, remove the local declaration:
```tsx
// Remove these lines:
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.5;
```

If `SCREEN_HEIGHT` is used elsewhere, keep it but remove only the `HERO_HEIGHT` line.

- [ ] **Step 10: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: 0 new errors. Fix any type mismatches.

- [ ] **Step 11: Commit**

```bash
git add -u
git commit -m "feat(scan): rewire scan-result.tsx with BentoGrid, sheets, sticky header, and bottom bar"
```

---

### Task 12: Clean up removed components

**Files:**
- Delete: `optimus-halal/src/components/scan/ScanActionBar.tsx`
- Delete: `optimus-halal/src/components/scan/StickyVerdictHeader.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -rn "ScanActionBar\|StickyVerdictHeader" optimus-halal/src optimus-halal/app --include="*.tsx" --include="*.ts"`
Expected: No results (all imports replaced in Task 11)

- [ ] **Step 2: Delete files**

```bash
rm optimus-halal/src/components/scan/ScanActionBar.tsx
rm optimus-halal/src/components/scan/StickyVerdictHeader.tsx
```

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore(scan): remove ScanActionBar and StickyVerdictHeader (replaced)"
```

---

## Chunk 4: Final Verification

### Task 13: Full typecheck and verification

- [ ] **Step 1: Full typecheck**

Run: `cd optimus-halal && npx tsc --noEmit --pretty`
Expected: 0 errors

- [ ] **Step 2: Lint check**

Run: `cd optimus-halal && pnpm lint 2>&1 | tail -20`
Expected: 0 errors (warnings OK)

- [ ] **Step 3: Verify all new files exist**

Run: `ls -la optimus-halal/src/components/scan/Bento*.tsx optimus-halal/src/components/scan/*Tile.tsx optimus-halal/src/components/scan/CompactStickyHeader.tsx optimus-halal/src/components/scan/ScanBottomBar.tsx`
Expected: 8 files listed

- [ ] **Step 4: Verify removed files don't exist**

Run: `ls optimus-halal/src/components/scan/ScanActionBar.tsx optimus-halal/src/components/scan/StickyVerdictHeader.tsx 2>&1`
Expected: "No such file or directory" for both

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -u && git commit -m "fix(scan): final typecheck and lint fixes for Vanta UI"
```
