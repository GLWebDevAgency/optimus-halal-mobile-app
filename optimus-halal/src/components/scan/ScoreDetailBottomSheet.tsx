/**
 * ScoreDetailBottomSheet — Per-theme breakdown of a certifier's trust score.
 *
 * Shows the actual indicator-level compliance for the scanned product's certifier,
 * organized into 3 themes aligned with trust-score-complete.md:
 *   1. Rigueur du contrôle (الأمانة — Al-Amanah) — 3 positive indicators
 *   2. Conformité de l'abattage (الذبيحة — Al-Dhabiha) — 5 negative indicators (inverted)
 *   3. Transparence organisationnelle (الشفافية — Al-Shafafiyya) — 3 transparency indicators
 *
 * This sheet shows FACTS (met/not-met), NOT a fatwa or halal/haram verdict.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus, darkTheme, lightTheme, getTrustScoreColor } from "@/theme/colors";
import { CertifierLogo } from "./CertifierLogo";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface CertifierPracticesUI {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalSlaughter: boolean | null;
  acceptsElectronarcosis: boolean | null;
  acceptsPostSlaughterElectrocution: boolean | null;
  acceptsStunning: boolean | null;
  acceptsVsm: boolean | null;
  transparencyPublicCharter: boolean | null;
  transparencyAuditReports: boolean | null;
  transparencyCompanyList: boolean | null;
}

interface ScoreDetailBottomSheetProps {
  visible: boolean;
  certifierId: string | null;
  certifierName: string | null;
  trustScore: number | null;
  practices: CertifierPracticesUI | null;
  onClose: () => void;
}

type IndicatorStatus = "met" | "notMet" | "unknown";

function getPositiveStatus(value: boolean | null): IndicatorStatus {
  if (value === true) return "met";
  if (value === false) return "notMet";
  return "unknown";
}

/** Negative indicators are INVERTED: false = conforme (met), true = non-conforme */
function getNegativeStatus(value: boolean | null): IndicatorStatus {
  if (value === false) return "met";
  if (value === true) return "notMet";
  return "unknown";
}

function countMet(statuses: IndicatorStatus[]): number {
  return statuses.filter((s) => s === "met").length;
}

export const ScoreDetailBottomSheet = React.memo(function ScoreDetailBottomSheet({
  visible,
  certifierId,
  certifierName,
  trustScore,
  practices,
  onClose,
}: ScoreDetailBottomSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 20, stiffness: 200 });
    } else if (isMounted) {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 250, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setIsMounted)(false);
        }
      );
    }
  }, [visible, reducedMotion, translateY, backdropOpacity, isMounted]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const scoreColor = trustScore != null ? getTrustScoreColor(trustScore) : halalStatus.haram.base;

  if (!isMounted) return null;

  // Build indicator statuses from practices
  const controlIndicators = practices
    ? [
        { label: t.scanResult.trustScorePositive1, status: getPositiveStatus(practices.controllersAreEmployees) },
        { label: t.scanResult.trustScorePositive2, status: getPositiveStatus(practices.controllersPresentEachProduction) },
        { label: t.scanResult.trustScorePositive3, status: getPositiveStatus(practices.hasSalariedSlaughterers) },
      ]
    : [];

  // Dhabiha compliance — 3 indicators that directly impact halal validity
  const dhabihaIndicators = practices
    ? [
        { label: t.scanResult.detailDhabiha1, status: getNegativeStatus(practices.acceptsMechanicalSlaughter) },
        { label: t.scanResult.detailDhabiha2, status: getNegativeStatus(practices.acceptsElectronarcosis) },
        { label: t.scanResult.detailDhabiha3, status: getNegativeStatus(practices.acceptsStunning) },
      ]
    : [];

  // Industrial rigor — 2 post-slaughter processing indicators
  const industrialIndicators = practices
    ? [
        { label: t.scanResult.detailIndustrial1, status: getNegativeStatus(practices.acceptsPostSlaughterElectrocution) },
        { label: t.scanResult.detailIndustrial2, status: getNegativeStatus(practices.acceptsVsm) },
      ]
    : [];

  // Dynamic color for dhabiha theme: green if all met, red if all notMet, orange if mixed
  const dhabihaMetCount = countMet(dhabihaIndicators.map((i) => i.status));
  const dhabihaThemeColor =
    dhabihaMetCount === dhabihaIndicators.length
      ? halalStatus.halal.base
      : dhabihaMetCount === 0
        ? halalStatus.haram.base
        : halalStatus.doubtful.base;

  const transparencyIndicators = practices
    ? [
        { label: t.scanResult.trustScoreTransparency1, status: getPositiveStatus(practices.transparencyPublicCharter) },
        { label: t.scanResult.trustScoreTransparency2, status: getPositiveStatus(practices.transparencyAuditReports) },
        { label: t.scanResult.trustScoreTransparency3, status: getPositiveStatus(practices.transparencyCompanyList) },
      ]
    : [];

  const renderIndicator = (
    item: { label: string; status: IndicatorStatus },
    index: number,
  ) => {
    const icon: keyof typeof MaterialIcons.glyphMap =
      item.status === "met"
        ? "check-circle"
        : item.status === "notMet"
          ? "cancel"
          : "help-outline";
    const iconColor =
      item.status === "met"
        ? halalStatus.halal.base
        : item.status === "notMet"
          ? halalStatus.haram.base
          : colors.textMuted;

    return (
      <View key={index} style={styles.indicatorRow}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
        <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>
          {item.label}
        </Text>
      </View>
    );
  };

  const renderSection = (
    title: string,
    indicators: { label: string; status: IndicatorStatus }[],
    themeColor: string,
    isFirst?: boolean,
  ) => {
    const met = countMet(indicators.map((i) => i.status));
    const total = indicators.length;

    return (
      <View style={[styles.section, !isFirst && { marginTop: 18 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColor }]}>{title}</Text>
          <View
            style={[
              styles.fractionBadge,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <Text style={[styles.fractionText, { color: themeColor }]}>
              {met}/{total}
            </Text>
          </View>
        </View>
        {indicators.map(renderIndicator)}
      </View>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? darkTheme.background : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 20,
            maxHeight: SCREEN_HEIGHT * 0.85,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="leaderboard" size={22} color={colors.textMuted} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t.scanResult.scoreDetailTitle}
          </Text>
        </View>

        {/* Current certifier score */}
        {certifierName && trustScore != null && (
          <View
            style={[
              styles.currentScore,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            {certifierId && (
              <CertifierLogo certifierId={certifierId} size={22} fallbackColor={scoreColor} />
            )}
            <Text style={[styles.currentScoreName, { color: colors.textPrimary }]}>
              {certifierName}
            </Text>
            <Text style={[styles.currentScoreValue, { color: scoreColor }]}>
              {trustScore}/100
            </Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {practices ? (
            <>
              {renderSection(
                t.scanResult.themeControl,
                controlIndicators,
                colors.textSecondary,
                true,
              )}
              {renderSection(
                t.scanResult.themeDhabiha,
                dhabihaIndicators,
                dhabihaThemeColor,
              )}
              {renderSection(
                t.scanResult.themeIndustrial,
                industrialIndicators,
                colors.textMuted,
              )}
              {renderSection(
                t.scanResult.themeTransparency,
                transparencyIndicators,
                colors.textSecondary,
              )}
            </>
          ) : (
            <Text style={[styles.noPractices, { color: colors.textMuted }]}>
              {t.scanResult.noCertifierScore}
            </Text>
          )}

          {/* Footer — factual, no fatwa */}
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            {t.scanResult.trustScoreNote}
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  currentScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  currentScoreName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  currentScoreValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  section: {
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    flex: 1,
  },
  fractionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fractionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  indicatorText: {
    fontSize: 14,
    lineHeight: 19,
    flex: 1,
  },
  noPractices: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 20,
    fontStyle: "italic",
  },
});
