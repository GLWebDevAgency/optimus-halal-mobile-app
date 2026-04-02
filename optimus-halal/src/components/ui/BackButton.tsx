/**
 * BackButton — Unified back navigation button across all screens.
 *
 * Design: 44×44 circle, subtle border, gold arrow.
 * Single source of truth — never duplicate back button styles inline.
 */

import React from "react";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native";
import { PressableScale } from "./PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { gold } from "@/theme/colors";

interface BackButtonProps {
  /** Override default router.back() */
  onPress?: () => void;
  /** Accessibility label override */
  label?: string;
}

export const BackButton = React.memo(function BackButton({
  onPress,
  label = "Retour",
}: BackButtonProps) {
  const { isDark } = useTheme();

  return (
    <PressableScale
      onPress={onPress ?? (() => router.back())}
      style={[
        styles.button,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ArrowLeftIcon size={20} color={gold[500]} />
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  button: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
  },
});

export default BackButton;
