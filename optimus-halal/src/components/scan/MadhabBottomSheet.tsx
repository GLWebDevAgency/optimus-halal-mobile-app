/**
 * MadhabBottomSheet — Premium sliding modal for madhab opinion details.
 *
 * Triggered when user taps a madhab badge on the scan result.
 * Slides from bottom with backdrop dim, shows:
 * - School name + verdict badge
 * - Section 1: Certifier trust score + fiqh weight justifications (if certifier exists)
 * - Section 2: List of conflicting additives with explanations
 * - Scholarly references
 */

import React, { useState, useEffect } from "react";
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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus, neutral, darkTheme, lightTheme, getTrustScoreColor } from "@/theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConflictingAdditive {
  code: string;
  name: string;
  ruling: string;
  explanation: string;
  scholarlyReference: string | null;
}

interface ConflictingIngredient {
  pattern: string;
  ruling: string;
  explanation: string;
  scholarlyReference: string | null;
}

interface MadhabBottomSheetProps {
  visible: boolean;
  madhab: string;
  madhabLabel: string;
  status: "halal" | "doubtful" | "haram";
  conflictingAdditives: ConflictingAdditive[];
  conflictingIngredients?: ConflictingIngredient[];
  certifierName: string | null;
  certifierTrustScore: number | null;
  certifierTrustScoreUniversal: number | null;
  onClose: () => void;
}

const STATUS_COLORS = {
  halal: halalStatus.halal.base,
  doubtful: halalStatus.doubtful.base,
  haram: halalStatus.haram.base,
} as const;

const STATUS_ICONS = {
  halal: "check-circle" as const,
  doubtful: "help" as const,
  haram: "cancel" as const,
};

const MADHAB_WEIGHT_KEYS: Record<string, readonly string[]> = {
  hanafi: [
    "madhabWeight_salariedSlaughterers_hanafi",
    "madhabWeight_mechanicalSlaughter_hanafi",
    "madhabWeight_electronarcosis_hanafi",
    "madhabWeight_stunning_hanafi",
  ],
  shafii: [
    "madhabWeight_salariedSlaughterers_shafii",
    "madhabWeight_mechanicalSlaughter_shafii",
    "madhabWeight_electronarcosis_shafii",
    "madhabWeight_stunning_shafii",
  ],
  maliki: [
    "madhabWeight_salariedSlaughterers_maliki",
    "madhabWeight_mechanicalSlaughter_maliki",
    "madhabWeight_electronarcosis_maliki",
    "madhabWeight_stunning_maliki",
  ],
  hanbali: [
    "madhabWeight_salariedSlaughterers_hanbali",
    "madhabWeight_mechanicalSlaughter_hanbali",
    "madhabWeight_electronarcosis_hanbali",
    "madhabWeight_stunning_hanbali",
  ],
};

export const MadhabBottomSheet = React.memo(function MadhabBottomSheet({
  visible,
  madhab,
  madhabLabel,
  status,
  conflictingAdditives,
  conflictingIngredients = [],
  certifierName,
  certifierTrustScore,
  certifierTrustScoreUniversal,
  onClose,
}: MadhabBottomSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  // Keep component mounted during close animation
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

  const statusColor = STATUS_COLORS[status];
  const statusIcon = STATUS_ICONS[status];
  const hasTrustScore = certifierName != null && certifierTrustScore != null;
  const trustScoreColor = hasTrustScore ? getTrustScoreColor(certifierTrustScore) : neutral[500];
  const fiqhKeys = MADHAB_WEIGHT_KEYS[madhab] ?? [];
  const hasConflicts = conflictingAdditives.length > 0 || conflictingIngredients.length > 0;

  if (!isMounted) return null;

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
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: `${statusColor}20`, borderColor: statusColor },
              ]}
            >
              <MaterialIcons name={statusIcon} size={20} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {t.scanResult.madhabDiffersTitle.replace("{{madhab}}", madhabLabel)}
              </Text>
              <Text style={[styles.headerSubtitle, { color: statusColor }]}>
                {status === "halal"
                  ? t.scanResult.halal
                  : status === "doubtful"
                    ? t.scanResult.doubtful
                    : t.scanResult.haram}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── SECTION 1: Trust Score + Fiqh Weights ── */}
          {hasTrustScore && (
            <>
              <View
                style={[
                  styles.trustScoreCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <View style={styles.trustScoreHeader}>
                  <MaterialIcons name="verified" size={16} color={trustScoreColor} />
                  <Text style={[styles.trustScoreCertifier, { color: colors.textPrimary }]}>
                    {certifierName}
                  </Text>
                </View>
                <View style={styles.trustScoreRow}>
                  <Text style={[styles.trustScoreLabel, { color: colors.textSecondary }]}>
                    {t.scanResult.madhabTrustScoreLabel} {madhabLabel}
                  </Text>
                  <Text style={[styles.trustScoreValue, { color: trustScoreColor }]}>
                    {certifierTrustScore}/100
                  </Text>
                </View>
                {certifierTrustScoreUniversal != null && certifierTrustScoreUniversal !== certifierTrustScore && (
                  <Text style={[styles.trustScoreUniversal, { color: colors.textMuted }]}>
                    Universel : {certifierTrustScoreUniversal}/100
                  </Text>
                )}
              </View>

              {/* Fiqh weight explanations */}
              {fiqhKeys.length > 0 && (
                <View style={styles.fiqhSection}>
                  <View style={styles.fiqhTitleRow}>
                    <MaterialIcons name="info-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.fiqhTitle, { color: colors.textSecondary }]}>
                      {t.scanResult.madhabWeightsTitle}
                    </Text>
                  </View>
                  <Text style={[styles.fiqhIntro, { color: colors.textMuted }]}>
                    {t.scanResult.madhabWeightsIntro}
                  </Text>
                  {fiqhKeys.map((key) => {
                    const text = (t.scanResult as Record<string, string>)[key];
                    if (!text) return null;
                    return (
                      <View key={key} style={styles.fiqhItem}>
                        <Text style={[styles.fiqhBullet, { color: colors.textMuted }]}>•</Text>
                        <Text style={[styles.fiqhText, { color: colors.textSecondary }]}>
                          {text}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Separator between sections */}
              {hasConflicts && (
                <View
                  style={[
                    styles.separator,
                    {
                      borderBottomColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                />
              )}
            </>
          )}

          {/* ── SECTION 2: Conflicting Additives & Ingredients ── */}
          {hasConflicts ? (
            <>
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                {t.scanResult.madhabConflictExplain}
              </Text>

              {/* Additives */}
              {conflictingAdditives.map((add) => (
                <View
                  key={add.code}
                  style={[
                    styles.additiveCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <View style={styles.additiveHeader}>
                    <Text
                      style={[styles.additiveCode, { color: colors.textPrimary }]}
                    >
                      {add.code}
                    </Text>
                    <Text
                      style={[styles.additiveName, { color: colors.textSecondary }]}
                    >
                      {add.name}
                    </Text>
                    <View
                      style={[
                        styles.rulingBadge,
                        {
                          backgroundColor:
                            `${STATUS_COLORS[add.ruling as keyof typeof STATUS_COLORS] ?? neutral[500]}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rulingText,
                          {
                            color:
                              STATUS_COLORS[add.ruling as keyof typeof STATUS_COLORS] ??
                              neutral[500],
                          },
                        ]}
                      >
                        {add.ruling === "haram"
                          ? t.scanResult.haram
                          : add.ruling === "doubtful"
                            ? t.scanResult.doubtful
                            : t.scanResult.halal}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.additiveExplanation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {add.explanation}
                  </Text>
                  {add.scholarlyReference && (
                    <View style={styles.refRow}>
                      <MaterialIcons
                        name="menu-book"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[styles.refText, { color: colors.textMuted }]}
                      >
                        {add.scholarlyReference}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Ingredients */}
              {conflictingIngredients.length > 0 && (
                <>
                  {conflictingAdditives.length > 0 && (
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary, marginTop: 12 },
                      ]}
                    >
                      {t.scanResult.ingredientsConcerned}
                    </Text>
                  )}
                  {conflictingIngredients.map((ing) => (
                    <View
                      key={ing.pattern}
                      style={[
                        styles.additiveCard,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.02)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <View style={styles.additiveHeader}>
                        <Text
                          style={[styles.additiveCode, { color: colors.textPrimary }]}
                        >
                          {ing.pattern}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <View
                          style={[
                            styles.rulingBadge,
                            {
                              backgroundColor:
                                `${STATUS_COLORS[ing.ruling as keyof typeof STATUS_COLORS] ?? neutral[500]}15`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rulingText,
                              {
                                color:
                                  STATUS_COLORS[ing.ruling as keyof typeof STATUS_COLORS] ??
                                  neutral[500],
                              },
                            ]}
                          >
                            {ing.ruling === "haram"
                              ? t.scanResult.haram
                              : ing.ruling === "doubtful"
                                ? t.scanResult.doubtful
                                : t.scanResult.halal}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.additiveExplanation,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {ing.explanation}
                      </Text>
                      {ing.scholarlyReference && (
                        <View style={styles.refRow}>
                          <MaterialIcons
                            name="menu-book"
                            size={12}
                            color={colors.textMuted}
                          />
                          <Text
                            style={[styles.refText, { color: colors.textMuted }]}
                          >
                            {ing.scholarlyReference}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
            </>
          ) : !hasTrustScore ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              {t.scanResult.madhabNoData}
            </Text>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
});

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
    maxHeight: SCREEN_HEIGHT * 0.7,
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
  statusDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
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
  // Trust Score section
  trustScoreCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  trustScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  trustScoreCertifier: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  trustScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trustScoreLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  trustScoreValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  trustScoreUniversal: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  // Fiqh weights section
  fiqhSection: {
    marginBottom: 16,
  },
  fiqhTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fiqhTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  fiqhIntro: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  fiqhItem: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
    paddingLeft: 4,
  },
  fiqhBullet: {
    fontSize: 12,
    lineHeight: 17,
  },
  fiqhText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  additiveCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  additiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  additiveCode: {
    fontSize: 14,
    fontWeight: "800",
  },
  additiveName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  rulingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rulingText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  additiveExplanation: {
    fontSize: 13,
    lineHeight: 19,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  refText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default MadhabBottomSheet;
