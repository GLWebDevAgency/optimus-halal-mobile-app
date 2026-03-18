/**
 * NaqiyAdviceSheet — Bottom sheet displaying the hadith on doubt.
 *
 * Shown when `isDoubtful` is true in the verdict summary.
 * Arabic hadith text + translation + source chain + closing counsel.
 * Follows the same animated sheet pattern as ScholarlySourceSheet.
 *
 * @module components/scan/NaqiyAdviceSheet
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
import {
  SparkleIcon,
  XIcon,
  BookOpenIcon,
  LinkIcon,
} from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { gold } from "@/theme/colors";
import { darkTheme, lightTheme } from "@/theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NaqiyAdviceSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const NaqiyAdviceSheet = React.memo(function NaqiyAdviceSheet({
  visible,
  onClose,
}: NaqiyAdviceSheetProps) {
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

  if (!isMounted) return null;

  const goldColor = isDark ? gold[400] : gold[700];
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  const hadithTranslation = t.verdict.adviceHadithTranslation;

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
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(212,175,55,0.10)",
                },
              ]}
            >
              <SparkleIcon size={20} color={gold[500]} weight="fill" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t.verdict.naqiyAdvice}
            </Text>
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
            <XIcon size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card */}
          <View
            style={[
              styles.adviceCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {/* Title */}
            <View style={styles.titleRow}>
              <BookOpenIcon size={16} color={goldColor} weight="fill" />
              <Text
                style={[styles.adviceTitle, { color: colors.textPrimary }]}
              >
                {t.verdict.adviceTitle}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={[styles.divider, { backgroundColor: cardBorder }]}
            />

            {/* Arabic hadith */}
            <Text
              style={[
                styles.arabicText,
                {
                  color: isDark ? gold[400] : gold[700],
                },
              ]}
            >
              {t.verdict.adviceHadithAr}
            </Text>

            {/* Divider */}
            <View
              style={[styles.divider, { backgroundColor: cardBorder }]}
            />

            {/* Translation */}
            <Text
              style={[
                styles.translationText,
                { color: colors.textSecondary },
              ]}
            >
              {hadithTranslation}
            </Text>

            {/* Divider */}
            <View
              style={[styles.divider, { backgroundColor: cardBorder }]}
            />

            {/* Source */}
            <View style={styles.sourceRow}>
              <BookOpenIcon size={12} color={goldColor} />
              <Text style={[styles.sourceText, { color: goldColor }]}>
                {t.verdict.adviceSource}
              </Text>
            </View>

            {/* Chain of transmission */}
            <View style={styles.sourceRow}>
              <LinkIcon size={12} color={colors.textMuted} />
              <Text style={[styles.chainText, { color: colors.textMuted }]}>
                {t.verdict.adviceChain}
              </Text>
            </View>
          </View>

          {/* Closing message */}
          <Text style={[styles.closingText, { color: colors.textSecondary }]}>
            {t.verdict.adviceClosing}
          </Text>
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

  // ── Advice card ──
  adviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 14,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 0,
  },

  // ── Arabic text ──
  arabicText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 18,
    fontWeight: "500",
  },

  // ── Translation ──
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    paddingVertical: 16,
  },

  // ── Source ──
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  chainText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },

  // ── Closing ──
  closingText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
});

export default NaqiyAdviceSheet;
