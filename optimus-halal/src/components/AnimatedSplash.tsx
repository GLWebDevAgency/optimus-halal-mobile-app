/**
 * AnimatedSplash — Cinematic splash → app handoff
 *
 * Matches the Remotion LogoReveal video:
 *   - PremiumBackground (7-layer brushed metal, theme-aware)
 *   - Logo scale entrance with gold glow ring
 *   - "NAQIY" brand name in gold gradient
 *   - "Scanne. Comprends. Choisis." tagline
 *   - Exit: scale up + fade out → calls onFinish
 *
 * Pattern: Revolut / Airbnb / Duolingo cinematic splash
 */

import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
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
import { useTheme } from "@/hooks";

const { width: SW } = Dimensions.get("window");
const LOGO_SIZE = SW * 0.22;
const GLOW_SIZE = LOGO_SIZE + 40;

const logoSource = require("@assets/images/logo_naqiy.webp");

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const { isDark } = useTheme();

  // ── Shared values ──
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.9);
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(15);
  const containerOpacity = useSharedValue(1);

  // ── Entrance sequence ──
  useEffect(() => {
    // Logo: scale + fade
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90, mass: 1 });
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    // Glow ring: fade in → infinite pulse
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 600 }),
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 1500 }),
            withTiming(1, { duration: 1500 }),
          ),
          -1,
          true,
        ),
      ),
    );
    glowScale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500 }),
          withTiming(0.95, { duration: 1500 }),
        ),
        -1,
        true,
      ),
    );

    // Brand name: fade in + slide up (delay 800ms)
    brandOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    brandTranslateY.value = withDelay(
      800,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.6 }),
    );

    // Tagline: fade in + slide up (delay 1200ms)
    taglineOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    taglineTranslateY.value = withDelay(
      1200,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.6 }),
    );
  }, []);

  // ── Exit sequence ──
  const triggerExit = useCallback(() => {
    logoScale.value = withTiming(1.15, {
      duration: 400,
      easing: Easing.in(Easing.cubic),
    });
    logoOpacity.value = withTiming(0, { duration: 350 });
    glowOpacity.value = withTiming(0, { duration: 300 });
    brandOpacity.value = withTiming(0, { duration: 300 });
    taglineOpacity.value = withTiming(0, { duration: 250 });

    containerOpacity.value = withDelay(
      200,
      withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(onFinish)();
      }),
    );
  }, [onFinish]);

  useEffect(() => {
    if (isReady) {
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

  const brandAnimStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const textColor = isDark ? "#FFFFFF" : "#0d1b13";
  const mutedColor = isDark ? "#6b7280" : "#9ca3af";

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <PremiumBackground />

      <View style={styles.center}>
        {/* Gold glow ring */}
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

        {/* Brand name */}
        <Animated.View style={[styles.brandRow, brandAnimStyle]}>
          <Text style={[styles.brandText, { color: "#D4AF37" }]}>NAQIY</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineRow, taglineAnimStyle]}>
          <Text style={[styles.taglineText, { color: mutedColor }]}>
            Scanne. Comprends. Choisis.
          </Text>
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
  brandRow: {
    marginTop: 24,
  },
  brandText: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: 12,
  },
  taglineRow: {
    marginTop: 10,
  },
  taglineText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    letterSpacing: 1,
  },
});
