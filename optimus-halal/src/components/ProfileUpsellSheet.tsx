/**
 * ProfileUpsellSheet — Nudge free/trial users to upgrade for profile customisation.
 *
 * Triggered when tapping the avatar/greeting on the home screen.
 * Matches PremiumGate theme: logo, "Naqiy+", dark CTA pill.
 *
 * @module components/ProfileUpsellSheet
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
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
import { XIcon, UserCirclePlusIcon } from "phosphor-react-native";
import { router } from "expo-router";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { gold, darkTheme, lightTheme } from "@/theme/colors";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProfileUpsellSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileUpsellSheet = React.memo(function ProfileUpsellSheet({
  visible,
  onClose,
}: ProfileUpsellSheetProps) {
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
    setTimeout(() => {
      router.push({ pathname: "/paywall" as any, params: { trigger: "profile" } });
    }, 200);
  }, [onClose, impact]);

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
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

          {/* Close button */}
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

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.iconContainer}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${gold[500]}15` },
                ]}
              >
                <UserCirclePlusIcon size={40} color={gold[500]} weight="duotone" />
              </View>
            </Animated.View>

            {/* Logo + Title + Description */}
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
                {t.home.upsellTitle}
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t.home.upsellMessage}
              </Text>
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <PressableScale
                onPress={handleUpgrade}
                style={[
                  styles.cta,
                  { backgroundColor: isDark ? colors.primary : "#0f172a" },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.home.upsellCta}
              >
                <Text
                  style={[
                    styles.ctaText,
                    { color: isDark ? "#0f172a" : "#ffffff" },
                  ]}
                >
                  {t.home.upsellCta}
                </Text>
              </PressableScale>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
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
    maxHeight: SCREEN_HEIGHT * 0.6,
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
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
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

export default ProfileUpsellSheet;
