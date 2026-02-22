/**
 * PremiumBackground — Brushed metal + gold dust ambient system
 *
 * Inspired by Al-Ihsan (excellence silencieuse) — felt, not seen.
 * Evokes premium watch cases & luxury phone finishes.
 *
 * 7-layer architecture (bottom → top):
 * ─────────────────────────────────────
 * L0: Base — solid warm metal tone (anti-flash)
 * L1: Brushed metal — horizontal directional streaks
 * L2: Metal reflection — diagonal highlight band (light catching the brush)
 * L3: Gold dust — scattered micro-glows (particules dorées sous la lumière)
 * L4: Secondary dust — sparse gold echo for depth
 * L5: Brushed grain — fine horizontal texture reinforcement
 * L6: Vignette — edges darken, centers attention on content
 *
 * Dark: Brushed black steel / gunmetal with warm gold dust
 * Light: Brushed cream aluminum with subtle gold shimmer
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

const { width: SW, height: SH } = Dimensions.get("window");

// Gold dust particle sizes — asymmetric for natural scatter
const DUST_A = SW * 0.45;
const DUST_B = SW * 0.3;
const DUST_C = SW * 0.55;
const DUST_D = SW * 0.2;
const DUST_E = SW * 0.35;

export interface PremiumBackgroundProps {
  /** Override glow intensity (0 = invisible, 1 = max). Defaults to 1. */
  intensity?: number;
  /** Minimal mode — base + brush only, no dust/vignette. */
  noOrb?: boolean;
}

export const PremiumBackground = React.memo(function PremiumBackground({
  intensity = 1,
  noOrb = false,
}: PremiumBackgroundProps) {
  const { isDark } = useTheme();

  const i = intensity;

  return (
    <>
      {/* ── L0: Base — solid brushed metal tone ── */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? "#0C0C0C" : "#f3f1ed" },
        ]}
      />

      {/* ── L1: Brushed metal — horizontal directional gradient bands ──
           Multiple overlapping horizontal gradients create the fine parallel
           streaks of a CNC brushed metal surface. Each band has slightly
           different luminosity to break uniformity. */}
      <LinearGradient
        colors={
          isDark
            ? ["#0e0e0e", "#141414", "#0b0b0b", "#111111", "#0d0d0d", "#131313", "#0a0a0a"]
            : ["#f4f2ee", "#f8f6f2", "#f0eee9", "#f6f4f0", "#eeedea", "#f5f3ef", "#f1efeb"]
        }
        locations={[0, 0.15, 0.3, 0.45, 0.62, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Secondary horizontal micro-bands — finer brush frequency */}
      <LinearGradient
        colors={
          isDark
            ? [
                "rgba(255,255,255,0.012)", "transparent",
                "rgba(255,255,255,0.018)", "transparent",
                "rgba(255,255,255,0.008)", "transparent",
                "rgba(255,255,255,0.015)", "transparent",
              ]
            : [
                "rgba(0,0,0,0.008)", "transparent",
                "rgba(0,0,0,0.012)", "transparent",
                "rgba(0,0,0,0.006)", "transparent",
                "rgba(0,0,0,0.01)", "transparent",
              ]
        }
        locations={[0, 0.12, 0.25, 0.38, 0.5, 0.63, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── L2: Metal reflection — diagonal highlight band ──
           Simulates light catching the brushed surface at an angle,
           like holding a watch case under a lamp. */}
      <LinearGradient
        colors={
          isDark
            ? [
                "transparent",
                `rgba(255, 255, 255, ${0.025 * i})`,
                `rgba(255, 255, 255, ${0.04 * i})`,
                `rgba(255, 255, 255, ${0.025 * i})`,
                "transparent",
              ]
            : [
                "transparent",
                `rgba(255, 255, 255, ${0.3 * i})`,
                `rgba(255, 255, 255, ${0.5 * i})`,
                `rgba(255, 255, 255, ${0.3 * i})`,
                "transparent",
              ]
        }
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.55 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {!noOrb && (
        <>
          {/* ── L3: Gold dust — primary particles ──
               Five asymmetrically placed radial gold glows simulate fine
               metallic dust catching ambient light on brushed steel. */}

          {/* Dust A — upper left, largest, warmest */}
          <View style={styles.dustLayer} pointerEvents="none">
            <LinearGradient
              colors={[
                `rgba(212, 175, 55, ${0.09 * i})`,
                `rgba(212, 175, 55, ${0.03 * i})`,
                "transparent",
              ]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.dustA, { width: DUST_A, height: DUST_A, borderRadius: DUST_A / 2 }]}
            />
          </View>

          {/* Dust B — center right, subtle */}
          <View style={styles.dustLayer} pointerEvents="none">
            <LinearGradient
              colors={[
                `rgba(212, 175, 55, ${0.03 * i})`,
                `rgba(212, 175, 55, ${0.008 * i})`,
                "transparent",
              ]}
              locations={[0, 0.4, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.dustB, { width: DUST_B, height: DUST_B, borderRadius: DUST_B / 2 }]}
            />
          </View>

          {/* Dust C — lower center, wide and diffuse */}
          <View style={styles.dustLayer} pointerEvents="none">
            <LinearGradient
              colors={[
                `rgba(207, 165, 51, ${0.05 * i})`,
                `rgba(207, 165, 51, ${0.012 * i})`,
                "transparent",
              ]}
              locations={[0, 0.35, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.dustC, { width: DUST_C, height: DUST_C, borderRadius: DUST_C / 2 }]}
            />
          </View>

          {/* ── L4: Secondary dust — tiny accents for realism ── */}

          {/* Dust D — upper right corner, pinpoint */}
          <View style={styles.dustLayer} pointerEvents="none">
            <LinearGradient
              colors={[
                `rgba(250, 240, 195, ${0.07 * i})`,
                `rgba(250, 240, 195, ${0.02 * i})`,
                "transparent",
              ]}
              locations={[0, 0.3, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.dustD, { width: DUST_D, height: DUST_D, borderRadius: DUST_D / 2 }]}
            />
          </View>

          {/* Dust E — lower left, medium warm */}
          <View style={styles.dustLayer} pointerEvents="none">
            <LinearGradient
              colors={[
                `rgba(212, 175, 55, ${0.04 * i})`,
                `rgba(212, 175, 55, ${0.01 * i})`,
                "transparent",
              ]}
              locations={[0, 0.4, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.dustE, { width: DUST_E, height: DUST_E, borderRadius: DUST_E / 2 }]}
            />
          </View>

          {/* ── L5: Brush grain overlay — reinforces horizontal directionality ── */}
          <LinearGradient
            colors={
              isDark
                ? [
                    `rgba(255, 255, 255, ${0.01 * i})`,
                    "transparent",
                    `rgba(255, 255, 255, ${0.015 * i})`,
                    "transparent",
                    `rgba(255, 255, 255, ${0.008 * i})`,
                    "transparent",
                  ]
                : [
                    `rgba(0, 0, 0, ${0.006 * i})`,
                    "transparent",
                    `rgba(0, 0, 0, ${0.01 * i})`,
                    "transparent",
                    `rgba(0, 0, 0, ${0.005 * i})`,
                    "transparent",
                  ]
            }
            locations={[0, 0.18, 0.35, 0.55, 0.72, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.05, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* ── L6: Vignette — soft edge darkening ── */}
          <LinearGradient
            colors={
              isDark
                ? ["transparent", "transparent", `rgba(0, 0, 0, ${0.18 * i})`]
                : ["transparent", "transparent", `rgba(0, 0, 0, ${0.04 * i})`]
            }
            locations={[0, 0.65, 1]}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  dustLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  // Gold dust positions — intentionally asymmetric for natural scatter
  dustA: {
    position: "absolute",
    top: SH * 0.05,
    left: -DUST_A * 0.15,
  },
  dustB: {
    position: "absolute",
    top: SH * 0.3,
    right: -DUST_B * 0.1,
  },
  dustC: {
    position: "absolute",
    bottom: SH * 0.15,
    left: SW * 0.2,
  },
  dustD: {
    position: "absolute",
    top: SH * 0.12,
    right: SW * 0.08,
  },
  dustE: {
    position: "absolute",
    bottom: SH * 0.35,
    left: -DUST_E * 0.2,
  },
});

export default PremiumBackground;
