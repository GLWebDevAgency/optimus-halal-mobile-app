/**
 * BentoTile — Shared glass card wrapper for Bento Grid tiles.
 *
 * Provides: glass bg, border, radius, shadow, inner glow,
 * PressableScale on tap, stagger entry animation.
 *
 * @module components/scan/BentoTile
 */

import React from "react";
import { StyleSheet, Platform, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks";
import { glass } from "@/theme/colors";
import { radius } from "@/theme/spacing";

export interface BentoTileProps {
  /** Called when tile is tapped */
  onPress: () => void;
  /** Status color for inner glow (hex string, e.g. "#22c55e") */
  glowColor?: string;
  /** Stagger index for entry animation (0-3) */
  staggerIndex?: number;
  /** Additional style overrides */
  style?: ViewStyle;
  /** Border override for status-dependent borders */
  borderOverride?: { borderColor: string; borderWidth: number };
  /** Accessibility label for the tile */
  accessibilityLabel: string;
  children: React.ReactNode;
}

const STAGGER_BASE = 60;
const ENTRY_DELAY_OFFSET = 500; // after hero animations

export function BentoTile({
  onPress,
  glowColor,
  staggerIndex = 0,
  style,
  borderOverride,
  accessibilityLabel,
  children,
}: BentoTileProps) {
  const { isDark } = useTheme();
  const { impact } = useHaptics();
  const reducedMotion = useReducedMotion();

  const entryDelay = ENTRY_DELAY_OFFSET + staggerIndex * STAGGER_BASE;

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInUp.delay(entryDelay)
              .duration(400)
              .springify()
              .damping(14)
              .stiffness(170)
              .mass(0.9)
      }
      style={style}
    >
      <PressableScale
        onPress={() => {
          impact();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? glass.dark.bg : "#ffffff",
            borderColor: isDark ? glass.dark.border : glass.light.borderStrong,
          },
          borderOverride && {
            borderColor: borderOverride.borderColor,
            borderWidth: borderOverride.borderWidth,
          },
        ]}
      >
        {/* Inner glow gradient (subtle diagonal) */}
        {glowColor && (
          <LinearGradient
            colors={[`${glowColor}${isDark ? "12" : "08"}`, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {children}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});
