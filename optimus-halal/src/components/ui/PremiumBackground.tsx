/**
 * PremiumBackground — Ultra-premium ambient background
 *
 * Replaces flat backgroundColor with a layered gradient system:
 * 1. Base vertical gradient — subtle depth (warm white → white → off-white)
 * 2. Ambient orb — soft radial-like glow from top-center (premium light source)
 *
 * Light mode: Clean warmth with a barely perceptible green undertone
 * Dark mode: Deep anthracite with subtle gold ambient glow
 *
 * Usage:
 *   <View style={{ flex: 1 }}>
 *     <PremiumBackground />
 *     {children}
 *   </View>
 */

import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ORB_SIZE = SCREEN_WIDTH * 1.4;

export interface PremiumBackgroundProps {
  /** Override glow intensity (0 = invisible, 1 = max). Defaults to 1. */
  intensity?: number;
  /** Hide the ambient orb — just use the base gradient. */
  noOrb?: boolean;
}

export const PremiumBackground = React.memo(function PremiumBackground({
  intensity = 1,
  noOrb = false,
}: PremiumBackgroundProps) {
  const { isDark } = useTheme();

  return (
    <>
      {/* Layer 1 — Base vertical gradient */}
      <LinearGradient
        colors={
          isDark
            ? ["#0D0D0D", "#151515", "#111111", "#0A0A0A"]
            : ["#FAFBFB", "#FFFFFF", "#FEFEFE", "#F6F8F7"]
        }
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Layer 2 — Ambient orb (soft "light source" from top-center) */}
      {!noOrb && (
        <View style={styles.orbContainer} pointerEvents="none">
          <LinearGradient
            colors={
              isDark
                ? [
                    `rgba(212, 175, 55, ${0.06 * intensity})`,
                    `rgba(212, 175, 55, ${0.025 * intensity})`,
                    "transparent",
                  ]
                : [
                    `rgba(19, 236, 106, ${0.04 * intensity})`,
                    `rgba(19, 236, 106, ${0.015 * intensity})`,
                    "transparent",
                  ]
            }
            locations={[0, 0.4, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.orb,
              {
                width: ORB_SIZE,
                height: ORB_SIZE,
                borderRadius: ORB_SIZE / 2,
              },
            ]}
          />
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    top: -ORB_SIZE * 0.35,
  },
});

export default PremiumBackground;
