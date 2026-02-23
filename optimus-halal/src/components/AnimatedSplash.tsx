/**
 * AnimatedSplash — Cinematic splash → app handoff
 *
 * Takes over from the static native splash (identical visuals)
 * and runs a premium entrance → hold → exit sequence.
 *
 * Entrance (auto):
 *   - Logo scales 0.8→1.0 (spring, damping 14)
 *   - Logo fades in (500ms)
 *   - Gold glow ring pulses around logo
 *   - App name fades in below (delay 500ms)
 *
 * Exit (triggered by `isReady`):
 *   - Logo scales 1.0→1.15 + fades out (400ms)
 *   - Background fades out (300ms)
 *   - Calls `onFinish` when complete
 *
 * Pattern: Revolut / Airbnb / Duolingo cinematic splash
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { PremiumBackground } from "@/components/ui";

const { width: SW } = Dimensions.get("window");
const LOGO_SIZE = SW * 0.22; // ~22% screen width
const GLOW_SIZE = LOGO_SIZE + 40;

const logoSource = require("@assets/images/logo_naqiy.webp");

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  // ── Shared values ──
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.9);
  const containerOpacity = useSharedValue(1);

  // ── Entrance sequence ──
  useEffect(() => {
    // Logo entrance: scale + fade
    logoScale.value = withSpring(1, {
      damping: 14,
      stiffness: 90,
      mass: 1,
    });
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    // Glow ring: fade in (600ms) → then infinite pulse
    // NOTE: Easing functions crash inside worklet callbacks — use withDelay
    // to sequence fade-in + pulse instead of a completion callback.
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 600 }),
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 1500 }),
            withTiming(1, { duration: 1500 })
          ),
          -1,
          true
        )
      )
    );
    glowScale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500 }),
          withTiming(0.95, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, []);

  // ── Exit sequence (triggered when app is ready) ──
  const triggerExit = useCallback(() => {
    // Logo: scale up slightly + fade out
    logoScale.value = withTiming(1.15, {
      duration: 400,
      easing: Easing.in(Easing.cubic),
    });
    logoOpacity.value = withTiming(0, { duration: 350 });
    glowOpacity.value = withTiming(0, { duration: 300 });

    // Container: fade out, then signal done
    containerOpacity.value = withDelay(
      200,
      withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(onFinish)();
      })
    );
  }, [onFinish, logoScale, logoOpacity, glowOpacity, containerOpacity]);

  useEffect(() => {
    if (isReady) {
      // Small hold to let the user see the brand (min 800ms total)
      const timer = setTimeout(triggerExit, 600);
      return () => clearTimeout(timer);
    }
  }, [isReady, triggerExit]);

  // ── Animated styles ──
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, 0.6]),
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <PremiumBackground />

      {/* Centered logo container */}
      <View style={styles.center}>
        {/* Gold glow ring — pulsing behind logo */}
        <Animated.View style={[styles.glowRing, glowAnimStyle]}>
          <View style={styles.glowInner} />
        </Animated.View>

        {/* Logo */}
        <Animated.View style={logoAnimStyle}>
          <View style={styles.logoContainer}>
            <Image
              source={logoSource}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  glowRing: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  glowInner: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
});
