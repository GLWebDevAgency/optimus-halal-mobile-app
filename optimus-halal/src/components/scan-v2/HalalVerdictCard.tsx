/**
 * HalalVerdictCard — Main verdict card for scan V2.
 *
 * Handles both "analyzed" and "certified" tracks:
 * - Analyzed: shows substance signals inline
 * - Certified: shows certifier info + trust grade
 *
 * Design rules:
 * - 3px verdict-colored left accent border (the ONE exception to no-border rule)
 * - Background color shift instead of borders for card separation
 * - Typography: Nunito ExtraBold 24px verdict, Nunito Black 32px score
 * - Stagger entrance animation with springNaqiy
 *
 * @module components/scan-v2/HalalVerdictCard
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/hooks";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type {
  HalalReportV2,
  ModuleVerdictV2,
  MadhabId,
} from "./scan-v2-types";
import {
  scoreToVerdictLevel,
  getVerdictColor,
  getVerdictBgColor,
  getVerdictLabel,
} from "./scan-v2-utils";
import { MadhabChip } from "./MadhabChip";
import { SubstanceSignalRow } from "./SubstanceSignalRow";
import { NaqiyPlusUpsell } from "./NaqiyPlusUpsell";

interface HalalVerdictCardProps {
  report: HalalReportV2;
  onSignalPress: (signal: ModuleVerdictV2) => void;
  onMadhabPress: () => void;
  onFullAnalysisPress?: () => void;
}

export const HalalVerdictCard: React.FC<HalalVerdictCardProps> = ({
  report,
  onSignalPress,
  onMadhabPress,
  onFullAnalysisPress,
}) => {
  const { isDark, colors } = useTheme();
  const { isPremium } = usePremium();

  const level = scoreToVerdictLevel(report.score);
  const accentColor = getVerdictColor(level);
  const verdictLabel = getVerdictLabel(level);

  const isCertified = report.tier === "certified";
  const signalsToShow = isPremium ? report.signals : report.signals.slice(0, 2);

  const handleSignalPress = useCallback(
    (signal: ModuleVerdictV2) => {
      if (isPremium) {
        onSignalPress(signal);
      }
    },
    [isPremium, onSignalPress]
  );

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.card : colors.card,
            borderLeftColor: accentColor,
          },
        ]}
      >
        {/* Status Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.verdictRow}>
              <View
                style={[styles.verdictDot, { backgroundColor: accentColor }]}
              />
              <Text style={[styles.verdictLabel, { color: accentColor }]}>
                {verdictLabel}
              </Text>
            </View>
            <Text style={[styles.headline, { color: colors.textSecondary }]}>
              {report.headlineFr}
            </Text>
          </View>

          <View
            style={[
              styles.scoreContainer,
              { backgroundColor: getVerdictBgColor(level, isDark) },
            ]}
          >
            <Text style={[styles.scoreValue, { color: accentColor }]}>
              {Math.round(report.score)}
            </Text>
            <Text style={[styles.scoreLabel, { color: accentColor }]}>
              SCORE / 100
            </Text>
          </View>
        </View>

        {/* Madhab Selector — always visible regardless of tier */}
        <MadhabChip
          madhab={report.madhabApplied as MadhabId}
          onPress={onMadhabPress}
        />

        {/* Signals */}
        {report.signals.length > 0 && (
          <View style={styles.signalsSection}>
            {signalsToShow.map((signal, index) => (
              <SubstanceSignalRow
                key={signal.substanceId}
                signal={signal}
                index={index}
                isPremium={isPremium}
                onPress={handleSignalPress}
              />
            ))}

            {/* Signal count for free users */}
            {!isPremium && report.signals.length > 2 && (
              <Text style={[styles.moreSignals, { color: colors.textMuted }]}>
                +{report.signals.length - 2} signaux supplementaires
              </Text>
            )}
          </View>
        )}

        {/* No signals message */}
        {report.signals.length === 0 && (
          <View
            style={[
              styles.noSignals,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#f0fdf4" },
            ]}
          >
            <Text style={[styles.noSignalsText, { color: colors.textSecondary }]}>
              Analyse ingredients : 0 alerte
            </Text>
          </View>
        )}

        {/* Upsell for free users */}
        {!isPremium && report.signals.length > 0 && (
          <NaqiyPlusUpsell
            featureLabel="Analyse detaillee"
            description="Acces aux fatwas, sources scholarly et details par madhab."
          />
        )}

        {/* Madhab divergence notice */}
        {report.madhabDivergence && isPremium && (
          <View
            style={[
              styles.divergenceNotice,
              { backgroundColor: isDark ? colors.backgroundSecondary : colors.card },
            ]}
          >
            <Text style={[styles.divergenceText, { color: colors.textSecondary }]}>
              Les avis divergent entre les ecoles sur ce produit
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.engineLabel, { color: colors.textMuted }]}>
            {report.analysisSourceLabel} - v{report.engineVersion}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderLeftWidth: 3,
    padding: spacing["3xl"],
    gap: spacing["3xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    gap: spacing.xs,
    marginRight: spacing.xl,
  },
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  verdictDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verdictLabel: {
    fontFamily: headingFontFamily.extraBold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  scoreContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  scoreValue: {
    fontFamily: headingFontFamily.black,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  scoreLabel: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  signalsSection: {
    gap: spacing.md,
  },
  moreSignals: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    paddingTop: spacing.md,
  },
  noSignals: {
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  noSignalsText: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 13,
    fontWeight: "500",
  },
  divergenceNotice: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  divergenceText: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },
  footer: {
    paddingTop: spacing.md,
  },
  engineLabel: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

export default HalalVerdictCard;
