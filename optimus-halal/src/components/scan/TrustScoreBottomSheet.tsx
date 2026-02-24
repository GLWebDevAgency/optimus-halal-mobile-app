/**
 * TrustScoreBottomSheet — Explains how the Naqiy trust score is calculated.
 *
 * Triggered when user taps the "?" icon next to "Naqiy Score — Confiance certification".
 * Shows the 6 practice indicators (3 positive, 3 negative) with clear explanations.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
import { halalStatus, darkTheme, lightTheme, getTrustScoreColor } from "@/theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TrustScoreBottomSheetProps {
  visible: boolean;
  certifierName: string | null;
  trustScore: number | null;
  /** If set, indicates the score uses madhab-specific weights */
  madhab?: "hanafi" | "shafii" | "maliki" | "hanbali" | null;
  onClose: () => void;
}

const MADHAB_DISPLAY: Record<string, string> = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
};

export const TrustScoreBottomSheet = React.memo(function TrustScoreBottomSheet({
  visible,
  certifierName,
  trustScore,
  madhab,
  onClose,
}: TrustScoreBottomSheetProps) {
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
          <MaterialIcons name="info-outline" size={22} color={colors.textMuted} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t.scanResult.trustScoreExplainTitle}
          </Text>
        </View>

        {/* Intro */}
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t.scanResult.trustScoreExplainIntro}
        </Text>

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
            <Text style={[styles.currentScoreName, { color: colors.textPrimary }]}>
              {certifierName}
            </Text>
            <Text style={[styles.currentScoreValue, { color: scoreColor }]}>
              {trustScore}/100
            </Text>
          </View>
        )}

        {/* Madhab-specific note */}
        {madhab && (
          <Text style={[styles.madhabNote, { color: colors.textMuted }]}>
            {t.scanResult.trustScoreMadhabNote.replace("{{madhab}}", MADHAB_DISPLAY[madhab])}
          </Text>
        )}

        {/* Positive indicators */}
        <Text style={[styles.sectionTitle, { color: halalStatus.halal.base }]}>
          {t.scanResult.trustScorePositiveTitle}
        </Text>
        {[
          t.scanResult.trustScorePositive1,
          t.scanResult.trustScorePositive2,
          t.scanResult.trustScorePositive3,
        ].map((label, i) => (
          <View key={i} style={styles.indicatorRow}>
            <MaterialIcons name="add-circle-outline" size={16} color={halalStatus.halal.base} />
            <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        ))}

        {/* Negative indicators */}
        <Text style={[styles.sectionTitle, { color: halalStatus.haram.base, marginTop: 16 }]}>
          {t.scanResult.trustScoreNegativeTitle}
        </Text>
        {[
          t.scanResult.trustScoreNegative1,
          t.scanResult.trustScoreNegative2,
          t.scanResult.trustScoreNegative3,
        ].map((label, i) => (
          <View key={i} style={styles.indicatorRow}>
            <MaterialIcons name="remove-circle-outline" size={16} color={halalStatus.haram.base} />
            <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        ))}

        {/* Footer note */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          {t.scanResult.trustScoreNote}
        </Text>
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
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  currentScore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
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
  footerNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 20,
    fontStyle: "italic",
  },
  madhabNote: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
    marginBottom: 16,
    paddingLeft: 4,
  },
});
