/**
 * MadhabUpsellSheet — Premium conversion bottom sheet.
 *
 * Shows blurred madhab rings as a teaser + Naqiy+ value proposition.
 * Matches PremiumGate theme: logo, "Naqiy+", dark CTA pill.
 * Tapping CTA opens the paywall screen with "madhab_detail" trigger.
 *
 * @module components/scan/MadhabUpsellSheet
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
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
import { XIcon, LockSimpleIcon } from "phosphor-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { MadhabScoreRing } from "./MadhabScoreRing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { gold } from "@/theme/colors";
import { darkTheme, lightTheme } from "@/theme/colors";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { MadhabVerdict, CertifierInfo } from "./scan-types";
import { MADHAB_LABEL_KEY, MADHAB_TRUST_KEY } from "./scan-constants";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MadhabUpsellSheetProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  madhabVerdicts: MadhabVerdict[];
  certifierData: CertifierInfo | null;
}

export const MadhabUpsellSheet = React.memo(function MadhabUpsellSheet({
  visible,
  onClose,
  onUpgrade,
  madhabVerdicts,
  certifierData,
}: MadhabUpsellSheetProps) {
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

  const handleUpgrade = useCallback(() => {
    impact();
    onClose();
    setTimeout(onUpgrade, 200);
  }, [onClose, onUpgrade, impact]);

  if (!isMounted) return null;

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

        {/* Close button (top-right) */}
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

        {/* Centered content — matching PremiumGate theme */}
        <View style={styles.content}>
          {/* ── Blurred Madhab Rings Preview ── */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.ringsPreviewContainer}
          >
            <View style={styles.ringsRow}>
              {madhabVerdicts.slice(0, 4).map((v, i) => {
                const labelKey = MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
                const label = labelKey
                  ? (t.scanResult as Record<string, string>)[labelKey] ?? v.madhab
                  : v.madhab;

                const trustKey = MADHAB_TRUST_KEY[v.madhab as keyof typeof MADHAB_TRUST_KEY];
                const madhabTrustScore = certifierData && trustKey
                  ? (certifierData as unknown as Record<string, unknown>)[trustKey] as number | null ?? null
                  : null;

                return (
                  <MadhabScoreRing
                    key={v.madhab}
                    label={label}
                    verdict={v.status as "halal" | "doubtful" | "haram" | "unknown"}
                    trustScore={madhabTrustScore}
                    staggerIndex={i}
                  />
                );
              })}
            </View>

            {/* Heavy blur overlay */}
            <BlurView
              intensity={25}
              tint={isDark ? "dark" : "light"}
              style={styles.blurOverlay}
            />

            {/* Lock badge on top of blur */}
            <View style={styles.lockBadge}>
              <LockSimpleIcon size={18} color={gold[500]} weight="fill" />
            </View>
          </Animated.View>

          {/* ── Logo + Title + Description (PremiumGate style) ── */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.gateContent}
          >
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
            />

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Naqiy+
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t.verdict.upsellDescription}
            </Text>
          </Animated.View>

          {/* ── CTA Button (dark pill, PremiumGate style) ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <PressableScale
              onPress={handleUpgrade}
              style={[
                styles.cta,
                { backgroundColor: isDark ? colors.primary : "#0f172a" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.common.upgrade}
            >
              <Text
                style={[
                  styles.ctaText,
                  { color: isDark ? "#0f172a" : "#ffffff" },
                ]}
              >
                {t.common.upgrade}
              </Text>
            </PressableScale>
          </Animated.View>
        </View>
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
    maxHeight: SCREEN_HEIGHT * 0.75,
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
  closeButton: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },

  // ── Blurred rings preview ──
  ringsPreviewContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    overflow: "hidden",
    paddingVertical: 20,
    marginBottom: spacing.lg,
    alignSelf: "stretch",
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
  },
  lockBadge: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
  },

  // ── PremiumGate-style content ──
  gateContent: {
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: fontSize.h4,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.bodySmall,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },

  // ── CTA (dark pill) ──
  cta: {
    height: 44,
    paddingHorizontal: spacing["4xl"],
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});

export default MadhabUpsellSheet;
