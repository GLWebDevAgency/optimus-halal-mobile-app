/**
 * ScholarlySourceSheet — Premium bottom sheet for scholarly source detail.
 *
 * Displays structured explanation from ingredient_rulings / additive_madhab_rulings
 * with parsed sections: substance label, status pill, explanation paragraphs,
 * and individual source references as pills.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  useReducedMotion,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpenIcon,
  XIcon,
  WarningCircleIcon,
  InfoIcon,
  ArrowSquareOutIcon,
} from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { gold, halalStatus as halalStatusColors } from "@/theme/colors";
import { darkTheme, lightTheme } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ScholarlySourceData {
  label: string;
  explanation: string;
  sourceRef: string;
}

interface ScholarlySourceSheetProps {
  visible: boolean;
  data: ScholarlySourceData | ScholarlySourceData[] | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────

/** Split explanation into structured paragraphs, highlight key terms */
function parseExplanation(text: string): string[] {
  // Split on sentence boundaries that indicate distinct points
  // Handle ". " and " — " and "⚠️" as natural break points
  return text
    .split(/(?<=\.)\s+(?=[A-ZÀ-Ü⚠])|(?=⚠️)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Parse comma/semicolon-separated sourceRef into individual references */
function parseSourceRefs(ref: string): string[] {
  return ref
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Detect keywords to colorize inline */
function getKeywordStyle(text: string): "warning" | "safe" | "danger" | null {
  const lower = text.toLowerCase();
  if (lower.includes("⚠") || lower.includes("prudence") || lower.includes("douteux") || lower.includes("doubtful")) return "warning";
  if (lower.startsWith("halal") || lower.includes("= halal") || lower.includes("→ halal")) return "safe";
  if (lower.includes("haram") || lower.includes("porc") || lower.includes("pork")) return "danger";
  return null;
}

// ── Component ────────────────────────────────────────

export const ScholarlySourceSheet = React.memo(function ScholarlySourceSheet({
  visible,
  data,
  onClose,
}: ScholarlySourceSheetProps) {
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

  const sources = useMemo(
    () => (data ? (Array.isArray(data) ? data : [data]) : []),
    [data],
  );

  if (!isMounted) return null;

  const goldColor = isDark ? gold[400] : gold[700];
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const warningBg = isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: isDark
              ? darkTheme.background
              : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
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
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.10)" },
              ]}
            >
              <BookOpenIcon size={20} color={gold[500]} weight="fill" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t.scanResult.scholarlySourceTitle}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <XIcon size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {sources.length > 0 ? (
            sources.map((source, idx) => {
              const paragraphs = parseExplanation(source.explanation);
              const refs = parseSourceRefs(source.sourceRef);

              return (
                <Animated.View
                  key={`${source.label}-${idx}`}
                  entering={FadeInDown.duration(300).delay(idx * 80)}
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    },
                    idx > 0 && { marginTop: 16 },
                  ]}
                >
                  {/* ── Substance header ── */}
                  <View style={styles.substanceRow}>
                    <WarningCircleIcon
                      size={18}
                      color={halalStatusColors.doubtful.base}
                      weight="fill"
                    />
                    <Text style={[styles.substanceLabel, { color: colors.textPrimary }]}>
                      {source.label}
                    </Text>
                  </View>

                  {/* ── Hairline divider ── */}
                  <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                  {/* ── Explanation paragraphs ── */}
                  <View style={styles.explanationContainer}>
                    {paragraphs.map((para, pIdx) => {
                      const kwStyle = getKeywordStyle(para);
                      const isWarning = kwStyle === "warning";

                      return (
                        <View
                          key={pIdx}
                          style={[
                            styles.paragraphRow,
                            isWarning && {
                              backgroundColor: warningBg,
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                            },
                          ]}
                        >
                          {isWarning ? (
                            <WarningCircleIcon size={14} color={halalStatusColors.doubtful.base} weight="fill" style={{ marginTop: 2 }} />
                          ) : (
                            <View style={[styles.bulletDot, { backgroundColor: goldColor }]} />
                          )}
                          <Text
                            style={[
                              styles.paragraphText,
                              {
                                color: isWarning
                                  ? halalStatusColors.doubtful.base
                                  : colors.textSecondary,
                                fontWeight: isWarning ? "600" : "400",
                              },
                            ]}
                          >
                            {para.replace(/^⚠️\s*/, "")}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* ── Hairline divider ── */}
                  <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                  {/* ── Source references as pills ── */}
                  <View style={styles.refsContainer}>
                    <Text style={[styles.refsLabel, { color: colors.textMuted }]}>
                      Références
                    </Text>
                    <View style={styles.refsPillRow}>
                      {refs.map((ref, rIdx) => (
                        <View
                          key={rIdx}
                          style={[
                            styles.refPill,
                            { backgroundColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.06)" },
                          ]}
                        >
                          <BookOpenIcon size={11} color={goldColor} />
                          <Text style={[styles.refPillText, { color: goldColor }]} numberOfLines={1}>
                            {ref}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.scanResult.scholarlySourceEmpty}
            </Text>
          )}

          {/* Footer disclaimer */}
          {sources.length > 0 && (
            <View style={styles.footerRow}>
              <InfoIcon size={12} color={colors.textMuted} />
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                {t.scanResult.scholarlySourceFooter}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
  },

  // ── Source card ──
  sourceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  substanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
  },
  substanceLabel: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 0,
  },

  // ── Explanation ──
  explanationContainer: {
    gap: 10,
    paddingVertical: 14,
  },
  paragraphRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  paragraphText: {
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },

  // ── References ──
  refsContainer: {
    paddingTop: 14,
    gap: 8,
  },
  refsLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refsPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  refPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refPillText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Footer ──
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default ScholarlySourceSheet;
