/**
 * ForceUpdateModal — Blocking modal when app version is below minimum.
 *
 * Cannot be dismissed. Shown when the backend reports that the current
 * app version is too old and must be updated from the store.
 *
 * Design follows the PadlockBottomSheet gold-accent premium pattern:
 *  - Semi-transparent backdrop (no dismiss on tap)
 *  - Centered card with icon, title, description, gold CTA
 *  - Dark/light mode aware via useTheme
 *  - i18n via useTranslation
 *
 * @module components/ui/ForceUpdateModal
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Linking,
  StyleSheet,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { ArrowsClockwise } from "phosphor-react-native";
import { PressableScale } from "./PressableScale";
import { useTheme, useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import {
  fontSize,
  fontWeight,
  headingFontFamily,
  bodyFontFamily,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ForceUpdateModalProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Store URL to open when CTA is tapped */
  storeUrl: string | null;
  /** Optional custom message from backend */
  message?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ForceUpdateModal = React.memo(function ForceUpdateModal({
  visible,
  storeUrl,
  message,
}: ForceUpdateModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const handleUpdate = useCallback(() => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  }, [storeUrl]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      // No onRequestClose — modal cannot be dismissed via back button
    >
      <View style={styles.root}>
        {/* Backdrop — no onPress, cannot dismiss */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.backdrop}
        />

        {/* Card */}
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(160).delay(100)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              shadowColor: isDark ? gold[500] : "#000000",
            },
          ]}
        >
          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(212,175,55,0.12)"
                  : "rgba(212,175,55,0.08)",
              },
            ]}
          >
            <ArrowsClockwise
              size={32}
              color={isDark ? gold[400] : gold[600]}
              weight="bold"
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            {t.update.forceTitle}
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: colors.textSecondary },
            ]}
          >
            {message ?? t.update.forceDescription}
          </Text>

          {/* CTA Button */}
          <PressableScale
            onPress={handleUpdate}
            style={[
              styles.cta,
              {
                backgroundColor: isDark ? gold[500] : "#0f172a",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.update.updateNow}
          >
            <ArrowsClockwise
              size={18}
              color={isDark ? "#0f172a" : "#ffffff"}
              weight="bold"
            />
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? "#0f172a" : "#ffffff" },
              ]}
            >
              {t.update.updateNow}
            </Text>
          </PressableScale>
        </Animated.View>
      </View>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radius.xl,
    paddingTop: spacing["4xl"],
    paddingBottom: spacing["3xl"],
    paddingHorizontal: spacing["3xl"],
    alignItems: "center",
    // Subtle shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.h3,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.body,
    fontFamily: bodyFontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
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
  },
  ctaText: {
    fontSize: fontSize.body,
    fontFamily: bodyFontFamily.bold,
    fontWeight: fontWeight.bold,
  },
});
