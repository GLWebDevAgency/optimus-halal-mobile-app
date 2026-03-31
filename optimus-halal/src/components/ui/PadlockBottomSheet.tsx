/**
 * PadlockBottomSheet — Contextual upsell when a free user taps a locked premium feature.
 *
 * Shows feature-specific description + "Découvrir Naqiy+" CTA.
 * Uses Modal to render above tab bar.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { LockSimple as LockSimpleIcon } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { usePremium } from "@/hooks/usePremium";
import { gold } from "@/theme/colors";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

export interface PadlockBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  description: string;
}

export const PadlockBottomSheet = React.memo(function PadlockBottomSheet({
  visible,
  onClose,
  description,
}: PadlockBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const { showPaywall } = usePremium();

  const handleUnlock = useCallback(() => {
    impact();
    onClose();
    showPaywall("feature_locked");
  }, [impact, onClose, showPaywall]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.backdropFill}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(170)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" },
              ]}
            />
          </View>

          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(212,175,55,0.1)"
                  : "rgba(212,175,55,0.06)",
              },
            ]}
          >
            <LockSimpleIcon size={28} color={isDark ? gold[400] : gold[600]} weight="fill" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.padlock.featureTitle}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>

          {/* CTA */}
          <PressableScale
            onPress={handleUnlock}
            style={[
              styles.cta,
              { backgroundColor: isDark ? gold[500] : "#0f172a" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.padlock.unlock}
          >
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={styles.ctaLogo}
              contentFit="contain"
            />
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? "#0f172a" : "#ffffff" },
              ]}
            >
              {t.padlock.unlock}
            </Text>
          </PressableScale>

          {/* Close link */}
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeLink}>
            <Text style={[styles.closeLinkText, { color: colors.textMuted }]}>
              {t.padlock.close}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.h4,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.body,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing["2xl"],
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    paddingHorizontal: spacing["4xl"],
    borderRadius: radius.full,
    gap: spacing.sm,
    width: "100%",
    maxWidth: 300,
  },
  ctaLogo: {
    width: 20,
    height: 20,
  },
  ctaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  closeLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeLinkText: {
    fontSize: fontSize.bodySmall,
  },
});
