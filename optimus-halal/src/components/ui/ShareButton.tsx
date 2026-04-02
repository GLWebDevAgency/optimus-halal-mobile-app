/**
 * ShareButton — Unified share action button across all screens.
 *
 * Design: 44×44 circle, same variant system as BackButton.
 * Single source of truth — never duplicate share button styles inline.
 */

import React from "react";
import { StyleSheet } from "react-native";
import { ShareNetworkIcon } from "phosphor-react-native";
import { PressableScale } from "./PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { gold } from "@/theme/colors";

interface ShareButtonProps {
  onPress: () => void;
  /** Accessibility label override */
  label?: string;
  /** "overlay" for use on images/heroes */
  variant?: "default" | "overlay";
}

const VARIANT_STYLES = {
  default: {
    dark: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" },
    light: { backgroundColor: "rgba(255,255,255,0.9)", borderColor: "rgba(0,0,0,0.12)" },
  },
  overlay: {
    dark: { backgroundColor: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.15)" },
    light: { backgroundColor: "rgba(255,255,255,0.95)", borderColor: "rgba(0,0,0,0.08)" },
  },
} as const;

export const ShareButton = React.memo(function ShareButton({
  onPress,
  label = "Partager",
  variant = "default",
}: ShareButtonProps) {
  const { isDark } = useTheme();
  const v = VARIANT_STYLES[variant][isDark ? "dark" : "light"];

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.button, v]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ShareNetworkIcon size={20} color={gold[500]} />
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

export default ShareButton;
