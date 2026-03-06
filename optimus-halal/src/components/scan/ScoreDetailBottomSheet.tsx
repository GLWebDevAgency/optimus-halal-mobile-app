/**
 * ScoreDetailBottomSheet — V5.1 Enhanced certifier trust score breakdown.
 *
 * Two-layer information architecture:
 *   Layer 1 — 4-block semantic bars (ritual, ops, tayyib, transparency)
 *             + evidence level badge. Gives instant visual read.
 *   Layer 2 — Granular indicator checklist (met/not-met/unknown).
 *             Full transparency for the expert user.
 *
 * Data flow: scan.ts → certifierData.detail → this component
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  useReducedMotion,
  interpolateColor,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus, darkTheme, lightTheme, getTrustScoreColor } from "@/theme/colors";
import { CertifierLogo } from "./CertifierLogo";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────

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

export interface TrustScoreDetailUI {
  score: number;
  blocks: {
    ritualValidity: number;
    operationalAssurance: number;
    productQuality: number;
    transparency: number;
  };
  cap?: number;
  evidenceLevel: "verified" | "declared" | "inferred" | "unknown";
}

interface ScoreDetailBottomSheetProps {
  visible: boolean;
  certifierId: string | null;
  certifierName: string | null;
  trustScore: number | null;
  practices: CertifierPracticesUI | null;
  detail: TrustScoreDetailUI | null;
  onClose: () => void;
}

// ── Evidence level config ────────────────────────────────

const EVIDENCE_CONFIG = {
  verified: { icon: "verified" as const, color: "#22c55e", labelFr: "Verifie", labelEn: "Verified" },
  declared: { icon: "fact-check" as const, color: "#3b82f6", labelFr: "Declare", labelEn: "Declared" },
  inferred: { icon: "psychology" as const, color: "#f59e0b", labelFr: "Infere", labelEn: "Inferred" },
  unknown: { icon: "help-outline" as const, color: "#6b7280", labelFr: "Inconnu", labelEn: "Unknown" },
} as const;

// ── Block config ─────────────────────────────────────────

const BLOCK_CONFIG = [
  {
    key: "ritualValidity" as const,
    icon: "mosque" as const,      // MaterialIcons doesn't have mosque, use alternative
    fallbackIcon: "auto-awesome" as const,
    labelFr: "Validite rituelle",
    labelEn: "Ritual Validity",
    subtitleFr: "Tasmiya, coupe, vitalite",
    subtitleEn: "Tasmiya, cut, vitality",
  },
  {
    key: "operationalAssurance" as const,
    icon: "shield" as const,
    fallbackIcon: "shield" as const,
    labelFr: "Assurance operationnelle",
    labelEn: "Operational Assurance",
    subtitleFr: "Controleurs, sacrificateurs",
    subtitleEn: "Controllers, slaughterers",
  },
  {
    key: "productQuality" as const,
    icon: "eco" as const,
    fallbackIcon: "eco" as const,
    labelFr: "Qualite produit (Tayyib)",
    labelEn: "Product Quality (Tayyib)",
    subtitleFr: "VSM, matieres premieres",
    subtitleEn: "MSM, raw materials",
  },
  {
    key: "transparency" as const,
    icon: "visibility" as const,
    fallbackIcon: "visibility" as const,
    labelFr: "Transparence",
    labelEn: "Transparency",
    subtitleFr: "Charte, audits, liste",
    subtitleEn: "Charter, audits, list",
  },
] as const;

// ── Helpers ──────────────────────────────────────────────

type IndicatorStatus = "met" | "notMet" | "unknown";

function getPositiveStatus(value: boolean | null): IndicatorStatus {
  if (value === true) return "met";
  if (value === false) return "notMet";
  return "unknown";
}

function getNegativeStatus(value: boolean | null): IndicatorStatus {
  if (value === false) return "met";
  if (value === true) return "notMet";
  return "unknown";
}

function countMet(statuses: IndicatorStatus[]): number {
  return statuses.filter((s) => s === "met").length;
}

function getBlockColor(value: number): string {
  if (value >= 80) return "#22c55e";  // green
  if (value >= 50) return "#f59e0b";  // amber
  if (value >= 20) return "#f97316";  // orange
  return "#ef4444";                    // red
}

// ── Animated Block Bar ───────────────────────────────────

const BlockBar = React.memo(function BlockBar({
  label,
  subtitle,
  value,
  icon,
  staggerIndex,
  isDark,
  colors,
}: {
  label: string;
  subtitle: string;
  value: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  staggerIndex: number;
  isDark: boolean;
  colors: any;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(staggerIndex * 80, withTiming(1, { duration: 300 }));
    progress.value = withDelay(
      staggerIndex * 80 + 150,
      withSpring(value / 100, { damping: 18, stiffness: 90 }),
    );
  }, [value, staggerIndex, opacity, progress]);

  const barColor = getBlockColor(value);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: barColor,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.blockRow, containerStyle]}>
      <View style={styles.blockHeader}>
        <View style={styles.blockLabelRow}>
          <MaterialIcons name={icon} size={14} color={barColor} />
          <Text style={[styles.blockLabel, { color: colors.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.blockValue, { color: barColor }]}>
          {value}
        </Text>
      </View>
      <View style={[styles.blockBarBg, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
        <Animated.View style={[styles.blockBarFill, barStyle]} />
      </View>
      <Text style={[styles.blockSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Animated.View>
  );
});

// ── Main Component ───────────────────────────────────────

export const ScoreDetailBottomSheet = React.memo(function ScoreDetailBottomSheet({
  visible,
  certifierId,
  certifierName,
  trustScore,
  practices,
  detail,
  onClose,
}: ScoreDetailBottomSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Toggle between summary (blocks) and detail (indicators) view
  const [showIndicators, setShowIndicators] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setShowIndicators(false);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 28, stiffness: 120 });
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

  // ── Build indicator data (V5.1 — aligned with 4 semantic blocks) ──

  // Bloc A — Validite rituelle (4 negative indicators: mechanical, electronarcosis, stunning, post-slaughter)
  const ritualIndicators = practices
    ? [
        { label: t.scanResult.detailRitual1, status: getNegativeStatus(practices.acceptsMechanicalSlaughter) },
        { label: t.scanResult.detailRitual2, status: getNegativeStatus(practices.acceptsElectronarcosis) },
        { label: t.scanResult.detailRitual3, status: getNegativeStatus(practices.acceptsStunning) },
        { label: t.scanResult.detailRitual4, status: getNegativeStatus(practices.acceptsPostSlaughterElectrocution) },
      ]
    : [];

  const ritualMetCount = countMet(ritualIndicators.map((i) => i.status));
  const ritualThemeColor =
    ritualMetCount === ritualIndicators.length
      ? halalStatus.halal.base
      : ritualMetCount === 0
        ? halalStatus.haram.base
        : halalStatus.doubtful.base;

  // Bloc B — Assurance operationnelle (3 positive indicators: controllers, present, salaried)
  const opsIndicators = practices
    ? [
        { label: t.scanResult.trustScorePositive1, status: getPositiveStatus(practices.controllersAreEmployees) },
        { label: t.scanResult.trustScorePositive2, status: getPositiveStatus(practices.controllersPresentEachProduction) },
        { label: t.scanResult.trustScorePositive3, status: getPositiveStatus(practices.hasSalariedSlaughterers) },
      ]
    : [];

  // Bloc C — Qualite produit Tayyib (1 negative indicator: VSM)
  const tayyibIndicators = practices
    ? [
        { label: t.scanResult.detailTayyib1, status: getNegativeStatus(practices.acceptsVsm) },
      ]
    : [];

  // Bloc D — Transparence (3 positive indicators: charter, audits, company list)
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

  // Evidence config
  const evidence = detail ? EVIDENCE_CONFIG[detail.evidenceLevel] : null;

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
            maxHeight: SCREEN_HEIGHT * 0.88,
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

        {/* Current certifier score + evidence badge */}
        {certifierName && trustScore != null && (
          <View style={styles.certifierHeaderSection}>
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

            {/* Evidence level badge + cap indicator */}
            <View style={styles.metaBadgeRow}>
              {evidence && (
                <View style={[styles.evidenceBadge, { backgroundColor: `${evidence.color}15`, borderColor: `${evidence.color}30` }]}>
                  <MaterialIcons name={evidence.icon} size={12} color={evidence.color} />
                  <Text style={[styles.evidenceBadgeText, { color: evidence.color }]}>
                    {evidence.labelFr}
                  </Text>
                </View>
              )}
              {detail?.cap != null && (
                <View style={[styles.capBadge, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }]}>
                  <MaterialIcons name="block" size={11} color="#ef4444" />
                  <Text style={[styles.capBadgeText, { color: "#ef4444" }]}>
                    Cap {detail.cap}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ════════════════════════════════════════════
              LAYER 1 — 4-Block Semantic Breakdown
              ════════════════════════════════════════════ */}
          {detail && (
            <View style={styles.blocksContainer}>
              {BLOCK_CONFIG.map((block, i) => (
                <BlockBar
                  key={block.key}
                  label={block.labelFr}
                  subtitle={block.subtitleFr}
                  value={detail.blocks[block.key]}
                  icon={block.fallbackIcon}
                  staggerIndex={i}
                  isDark={isDark}
                  colors={colors}
                />
              ))}
            </View>
          )}

          {/* Toggle to indicator detail */}
          {practices && (
            <Pressable
              onPress={() => setShowIndicators(!showIndicators)}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <MaterialIcons
                name={showIndicators ? "expand-less" : "expand-more"}
                size={18}
                color={colors.textMuted}
              />
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {showIndicators
                  ? t.scanResult.hideIndicators ?? "Masquer le detail"
                  : t.scanResult.showIndicators ?? "Voir le detail par indicateur"}
              </Text>
            </Pressable>
          )}

          {/* ════════════════════════════════════════════
              LAYER 2 — Granular Indicator Checklist
              ════════════════════════════════════════════ */}
          {showIndicators && practices && (
            <View style={styles.indicatorsSection}>
              {renderSection(
                t.scanResult.themeRitual,
                ritualIndicators,
                ritualThemeColor,
                true,
              )}
              {renderSection(
                t.scanResult.themeOps,
                opsIndicators,
                colors.textSecondary,
              )}
              {renderSection(
                t.scanResult.themeTayyib,
                tayyibIndicators,
                colors.textMuted,
              )}
              {renderSection(
                t.scanResult.themeTransparency,
                transparencyIndicators,
                colors.textSecondary,
              )}
            </View>
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

// ── Styles ───────────────────────────────────────────────

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
  certifierHeaderSection: {
    marginBottom: 4,
  },
  currentScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
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
  metaBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 2,
  },
  evidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  evidenceBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  capBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  capBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // ── Block bars ─────────────────────────────────────────
  blocksContainer: {
    gap: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  blockRow: {
    gap: 3,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blockLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  blockValue: {
    fontSize: 14,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "right",
  },
  blockBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  blockBarFill: {
    height: 6,
    borderRadius: 3,
  },
  blockSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  // ── Toggle button ──────────────────────────────────────
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Indicators (Layer 2) ───────────────────────────────
  indicatorsSection: {
    marginTop: 8,
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
