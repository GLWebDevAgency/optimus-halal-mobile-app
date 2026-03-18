/**
 * CertifierPracticesSheet — World-class certifier practices breakdown.
 *
 * Shows the 4 semantic blocks (Ritual, Ops, Tayyib, Transparency) with
 * per-indicator check/cross status. Aligned with Al-Ilm (transparency)
 * and Al-Amanah (trust architecture).
 *
 * Data flow: scan.ts → certifierData.practices/detail → this sheet
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
  withDelay,
  Easing,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ShieldCheckIcon,
  ProhibitIcon,
  QuestionIcon,
  CaretDownIcon,
  CaretUpIcon,
} from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus, darkTheme, lightTheme, getTrustScoreColor, gold } from "@/theme/colors";
import { CertifierTrustRow } from "./CertifierTrustRow";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { springNaqiy } from "@/theme/animations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────

export interface CertifierPractices {
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

export interface TrustScoreDetail {
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

interface CertifierPracticesSheetProps {
  visible: boolean;
  certifierId: string | null;
  certifierName: string | null;
  trustScore: number | null;
  practices: CertifierPractices | null;
  detail: TrustScoreDetail | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────

type Status = "met" | "notMet" | "unknown";

function positiveStatus(v: boolean | null): Status {
  if (v === true) return "met";
  if (v === false) return "notMet";
  return "unknown";
}

function negativeStatus(v: boolean | null): Status {
  if (v === false) return "met";
  if (v === true) return "notMet";
  return "unknown";
}

interface Indicator {
  label: string;
  status: Status;
}

const STATUS_ICON = {
  met: { Icon: ShieldCheckIcon, weight: "fill" as const },
  notMet: { Icon: ProhibitIcon, weight: "regular" as const },
  unknown: { Icon: QuestionIcon, weight: "regular" as const },
} as const;

// ── Animated bar ─────────────────────────────────────────

const AnimatedBar = React.memo(function AnimatedBar({
  value,
  max,
  color,
  delay: delayMs,
  isDark,
}: {
  value: number;
  max: number;
  color: string;
  delay: number;
  isDark: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const pct = max > 0 ? value / max : 0;
    progress.value = withDelay(delayMs, withSpring(pct, springNaqiy));
  }, [value, max, delayMs, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
    backgroundColor: color,
  }));

  return (
    <View style={[styles.barBg, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}>
      <Animated.View style={[styles.barFill, barStyle]} />
    </View>
  );
});

// ── Block section ────────────────────────────────────────

const BLOCK_COLORS = {
  ritual: "#ef4444",
  ops: "#22c55e",
  tayyib: "#8b5cf6",
  transparency: "#3b82f6",
} as const;

function BlockSection({
  title,
  arabicTitle,
  indicators,
  blockScore,
  blockMax,
  color,
  staggerBase,
  isDark,
  colors,
}: {
  title: string;
  arabicTitle: string;
  indicators: Indicator[];
  blockScore: number | null;
  blockMax: number;
  color: string;
  staggerBase: number;
  isDark: boolean;
  colors: any;
}) {
  const metCount = indicators.filter((i) => i.status === "met").length;

  return (
    <View style={styles.block}>
      {/* Block header */}
      <View style={styles.blockHeader}>
        <View style={styles.blockTitleRow}>
          <Text style={[styles.blockTitle, { color }]}>{title}</Text>
          <Text style={[styles.blockArabic, { color: `${color}80` }]}>{arabicTitle}</Text>
        </View>
        <View style={styles.blockMeta}>
          <View style={[styles.fractionPill, { backgroundColor: `${color}12` }]}>
            <Text style={[styles.fractionText, { color }]}>
              {metCount}/{indicators.length}
            </Text>
          </View>
          {blockScore != null && (
            <Text style={[styles.blockScoreText, { color }]}>
              {blockScore}
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {blockScore != null && (
        <AnimatedBar
          value={blockScore}
          max={blockMax}
          color={color}
          delay={staggerBase * 80}
          isDark={isDark}
        />
      )}

      {/* Indicators */}
      {indicators.map((ind, i) => {
        const statusColor =
          ind.status === "met"
            ? halalStatus.halal.base
            : ind.status === "notMet"
              ? halalStatus.haram.base
              : colors.textMuted;
        const { Icon, weight } = STATUS_ICON[ind.status];

        return (
          <View key={i} style={styles.indicatorRow}>
            <Icon size={16} color={statusColor} weight={weight} />
            <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>
              {ind.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main Component ───────────────────────────────────────

export const CertifierPracticesSheet = React.memo(function CertifierPracticesSheet({
  visible,
  certifierId,
  certifierName,
  trustScore,
  practices,
  detail,
  onClose,
}: CertifierPracticesSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { impact } = useHaptics();

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      impact();
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
        },
      );
    }
  }, [visible, reducedMotion, translateY, backdropOpacity, isMounted]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const scoreColor = trustScore != null ? getTrustScoreColor(trustScore) : colors.textMuted;

  if (!isMounted) return null;

  // Build indicator groups
  const ritualIndicators: Indicator[] = practices
    ? [
        { label: t.scanResult.trustScoreNegative1, status: negativeStatus(practices.acceptsMechanicalSlaughter) },
        { label: t.scanResult.trustScoreNegative2, status: negativeStatus(practices.acceptsElectronarcosis) },
        { label: t.scanResult.trustScoreNegative3, status: negativeStatus(practices.acceptsStunning) },
        { label: t.scanResult.trustScoreNegative5, status: negativeStatus(practices.acceptsPostSlaughterElectrocution) },
      ]
    : [];

  const opsIndicators: Indicator[] = practices
    ? [
        { label: t.scanResult.trustScorePositive1, status: positiveStatus(practices.controllersAreEmployees) },
        { label: t.scanResult.trustScorePositive2, status: positiveStatus(practices.controllersPresentEachProduction) },
        { label: t.scanResult.trustScorePositive3, status: positiveStatus(practices.hasSalariedSlaughterers) },
      ]
    : [];

  const tayyibIndicators: Indicator[] = practices
    ? [
        { label: t.scanResult.trustScoreNegative4, status: negativeStatus(practices.acceptsVsm) },
      ]
    : [];

  const transparencyIndicators: Indicator[] = practices
    ? [
        { label: t.scanResult.trustScoreTransparency1, status: positiveStatus(practices.transparencyPublicCharter) },
        { label: t.scanResult.trustScoreTransparency2, status: positiveStatus(practices.transparencyAuditReports) },
        { label: t.scanResult.trustScoreTransparency3, status: positiveStatus(practices.transparencyCompanyList) },
      ]
    : [];

  const evidenceLabel =
    detail?.evidenceLevel === "verified" ? "Vérifié"
    : detail?.evidenceLevel === "declared" ? "Déclaré"
    : detail?.evidenceLevel === "inferred" ? "Inféré"
    : "Inconnu";

  const evidenceColor =
    detail?.evidenceLevel === "verified" ? "#22c55e"
    : detail?.evidenceLevel === "declared" ? "#3b82f6"
    : detail?.evidenceLevel === "inferred" ? "#f59e0b"
    : "#6b7280";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? darkTheme.background : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 90,
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
              { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ShieldCheckIcon size={22} color={isDark ? gold[400] : gold[600]} weight="fill" />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t.scanResult.trustScoreExplainTitle}
          </Text>
        </View>

        {/* Intro text */}
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t.scanResult.trustScoreExplainIntro}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Certifier badge with Naqiy Grade strip */}
          {certifierName && certifierId && trustScore != null && (
            <View
              style={[
                styles.certifierBadge,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <CertifierTrustRow
                variant="sheet"
                certifierId={certifierId}
                certifierName={certifierName}
                trustScore={trustScore}
                showLabel
                evidenceLabel={detail ? evidenceLabel : undefined}
                evidenceColor={detail ? evidenceColor : undefined}
              />
            </View>
          )}

          {/* Cap warning */}
          {detail?.cap != null && (
            <View style={[styles.capRow, { backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)" }]}>
              <ProhibitIcon size={14} color="#ef4444" />
              <Text style={[styles.capText, { color: "#ef4444" }]}>
                Score plafonné à {detail.cap} (pratiques critiques non respectées)
              </Text>
            </View>
          )}

          {/* 4 blocks */}
          <BlockSection
            title="VALIDITÉ RITUELLE"
            arabicTitle="الذبيحة"
            indicators={ritualIndicators}
            blockScore={detail?.blocks.ritualValidity ?? null}
            blockMax={100}
            color={BLOCK_COLORS.ritual}
            staggerBase={0}
            isDark={isDark}
            colors={colors}
          />

          <BlockSection
            title="ASSURANCE OPÉRATIONNELLE"
            arabicTitle="الأمانة"
            indicators={opsIndicators}
            blockScore={detail?.blocks.operationalAssurance ?? null}
            blockMax={100}
            color={BLOCK_COLORS.ops}
            staggerBase={1}
            isDark={isDark}
            colors={colors}
          />

          <BlockSection
            title="QUALITÉ PRODUIT — TAYYIB"
            arabicTitle="الطيّب"
            indicators={tayyibIndicators}
            blockScore={detail?.blocks.productQuality ?? null}
            blockMax={100}
            color={BLOCK_COLORS.tayyib}
            staggerBase={2}
            isDark={isDark}
            colors={colors}
          />

          <BlockSection
            title="TRANSPARENCE ET GOUVERNANCE"
            arabicTitle="الشفافية"
            indicators={transparencyIndicators}
            blockScore={detail?.blocks.transparency ?? null}
            blockMax={100}
            color={BLOCK_COLORS.transparency}
            staggerBase={3}
            isDark={isDark}
            colors={colors}
          />

          {/* Footer */}
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
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing["3xl"],
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  intro: {
    fontSize: fontSize.bodySmall,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },

  // Certifier badge
  certifierBadge: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  // Cap warning
  capRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xl,
  },
  capText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    flex: 1,
  },

  // Block
  block: {
    marginBottom: spacing["2xl"],
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  blockTitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  blockArabic: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  blockMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fractionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fractionText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  blockScoreText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.black,
    minWidth: 24,
    textAlign: "right",
  },

  // Bar
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },

  // Indicator
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  indicatorText: {
    fontSize: fontSize.bodySmall,
    lineHeight: 19,
    flex: 1,
  },

  // Footer
  footerNote: {
    fontSize: fontSize.caption,
    lineHeight: 17,
    marginTop: spacing["2xl"],
    fontStyle: "italic",
  },
});
