/**
 * LevelUpCelebration — Full-screen golden particle burst overlay.
 *
 * Shows when the user levels up after a scan. Pure Reanimated animation:
 * - 24 golden particles burst outward from center
 * - Big gold level number springs in
 * - Auto-dismisses after 3 seconds
 * - Heavy haptic feedback on mount
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { gold, brand } from "@/theme/colors";
import { fontFamily, fontWeight } from "@/theme/typography";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PARTICLE_COUNT = 24;
const AUTO_DISMISS_MS = 3000;

// Pre-computed gold palette for particles
const GOLD_COLORS = [gold[300], gold[400], gold[500], gold[600], brand.primary];

interface LevelUpCelebrationProps {
  newLevel: number;
  title: string;
  subtitle: string;
  onDismiss: () => void;
}

// ── Single Particle ──────────────────────────────────────────

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

const Particle = React.memo(function Particle({ config }: { config: ParticleConfig }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withDelay(config.delay, withTiming(1, { duration: 100 })),
      withDelay(600, withTiming(0, { duration: 800 })),
    );
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
  }, [config.delay, opacity, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const dx = Math.cos(config.angle) * config.distance * progress.value;
    const dy = Math.sin(config.angle) * config.distance * progress.value;
    const scale = 1 - progress.value * 0.6;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: dx },
        { translateY: dy },
        { scale },
        { rotate: `${progress.value * 360}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
});

// ── Main Component ──────────────────────────────────────────

export const LevelUpCelebration = React.memo(function LevelUpCelebration({
  newLevel,
  title,
  subtitle,
  onDismiss,
}: LevelUpCelebrationProps) {
  const reducedMotion = useReducedMotion();
  const levelScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  // Generate particle configs once
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
      distance: 100 + Math.random() * 120,
      size: 6 + Math.random() * 10,
      color: GOLD_COLORS[i % GOLD_COLORS.length],
      delay: Math.random() * 200,
    }));
  }, []);

  useEffect(() => {
    // Haptic burst
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);

    // Animate level number
    levelScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 120, mass: 0.8 }),
    );

    // Animate title
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // Auto-dismiss
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
    opacity: levelScale.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(400)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      {/* Particle container (centered) */}
      <View style={styles.particleContainer}>
        {!reducedMotion &&
          particles.map((config, i) => <Particle key={i} config={config} />)}
      </View>

      {/* Level number */}
      <Animated.View style={[styles.levelContainer, levelStyle]}>
        <Text style={styles.levelNumber}>{newLevel}</Text>
      </Animated.View>

      {/* Title + Subtitle */}
      <Animated.View style={[styles.textContainer, titleStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  particleContainer: {
    position: "absolute",
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
  },
  levelContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: gold[500],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: gold[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  levelNumber: {
    fontSize: 56,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    color: gold[300],
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
    textAlign: "center",
  },
});

export default LevelUpCelebration;
