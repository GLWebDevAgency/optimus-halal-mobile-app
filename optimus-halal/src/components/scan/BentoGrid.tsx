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
import type { HalalStatusKey } from "./scan-constants";

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
            halalStatus={(halalAnalysis?.status ?? "unknown") as HalalStatusKey}
            effectiveHeroStatus={(effectiveHeroStatus ?? "unknown") as HalalStatusKey}
            trustScore={halalAnalysis?.trustScore ?? null}
            madhabVerdicts={madhabVerdicts}
            userMadhab={userMadhab}
            ingredientCount={ingredientCount}
            additiveCount={additiveCount}
            staggerIndex={0}
            onPress={onOpenHalalSheet}
          />
        </View>
        <View style={styles.oneThird}>
          <HealthScoreTile
            healthScore={healthScore?.score ?? null}
            nutriScore={offExtras?.nutriscoreGrade ?? null}
            novaGroup={offExtras?.novaGroup ?? null}
            ecoScore={offExtras?.ecoscoreGrade ?? null}
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
