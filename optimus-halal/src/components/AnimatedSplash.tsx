/**
 * AnimatedSplash — Video-based cinematic splash → app handoff
 *
 * Plays the Remotion-rendered LogoReveal video (theme-aware: light/dark).
 * When both conditions are met (video finished + app ready), fades out
 * and calls onFinish to unmount the splash overlay.
 *
 * Fallback: On devices where video playback fails (some Samsung/Android),
 * a beautiful Reanimated logo animation plays instead — ensuring a polished
 * first impression on every device.
 *
 * Pattern: Revolut / Airbnb / Duolingo cinematic splash
 */

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Image, Platform, View, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks";

const splashLight = require("@assets/videos/splash_light.mp4");
const splashDark = require("@assets/videos/splash_dark.mp4");
const splashLogo = require("@assets/splash-icon.png");

// How long to wait for the first video frame before switching to fallback
const FIRST_FRAME_TIMEOUT_MS = 2_000;

// Safety timeout: force exit if nothing has happened
const SAFETY_TIMEOUT_MS = 6_000;

// Fallback logo animation duration before triggering exit
const LOGO_ANIM_DURATION_MS = 2_800;

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const { isDark } = useTheme();
  const source = isDark ? splashDark : splashLight;
  const bgColor = isDark ? "#0C0C0C" : "#f3f1ed";

  const containerOpacity = useSharedValue(1);
  const videoFinished = useRef(false);
  const exitTriggered = useRef(false);

  // ── Video state ──
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoFailedRef = useRef(false);

  // ── Fallback animation values ──
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    // autoPlay is true by default — no need to call p.play()
  });

  // ── Exit: fade out → onFinish ──
  const triggerExit = useCallback(() => {
    if (exitTriggered.current) return;
    exitTriggered.current = true;

    containerOpacity.value = withTiming(
      0,
      { duration: 400, easing: Easing.in(Easing.quad) },
      () => {
        runOnJS(onFinish)();
      },
    );
  }, [onFinish, containerOpacity]);

  // ── Switch to fallback mode ──
  const activateFallback = useCallback(() => {
    if (videoFailedRef.current) return;
    videoFailedRef.current = true;
    setVideoFailed(true);
  }, []);

  // ── Detect video errors ──
  useEventListener(player, "statusChange", ({ status, error }) => {
    if (status === "error") {
      console.warn("[Splash] Video player error:", error);
      activateFallback();
    }
  });

  // ── Detect video end (happy path) ──
  useEventListener(player, "playToEnd", () => {
    videoFinished.current = true;
    if (isReady) triggerExit();
  });

  // ── First-frame timeout: if video hasn't rendered in 2s, switch to fallback ──
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!firstFrameReady && !videoFailedRef.current) {
        console.warn("[Splash] First frame timeout — switching to fallback");
        activateFallback();
      }
    }, FIRST_FRAME_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [firstFrameReady, activateFallback]);

  // ── Fallback animation ──
  useEffect(() => {
    if (!videoFailed) return;

    // Logo entrance: scale up + fade in
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90 });

    // Subtle glow pulse
    glowOpacity.value = withDelay(
      400,
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
    );

    // After animation, mark as "finished" to trigger exit
    const exitTimeout = setTimeout(() => {
      videoFinished.current = true;
      if (isReady) triggerExit();
    }, LOGO_ANIM_DURATION_MS);
    return () => clearTimeout(exitTimeout);
  }, [videoFailed, isReady, triggerExit, logoOpacity, logoScale, glowOpacity]);

  // ── Safety timeout: force exit if nothing has happened ──
  useEffect(() => {
    const timeout = setTimeout(triggerExit, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [triggerExit]);

  // ── If app becomes ready after video/fallback ends ──
  useEffect(() => {
    if (isReady && videoFinished.current) {
      triggerExit();
    }
  }, [isReady, triggerExit]);

  // ── Animated styles ──
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }, containerStyle]}
    >
      {!videoFailed ? (
        <>
          {/* Solid background shown until first video frame renders */}
          {!firstFrameReady && (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]}
            />
          )}
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="cover"
            onFirstFrameRender={() => setFirstFrameReady(true)}
            {...(Platform.OS === "android" && {
              surfaceType: "textureView",
              useExoShutter: false,
            })}
          />
        </>
      ) : (
        // ── Fallback: animated logo reveal ──
        <View style={styles.fallbackContainer}>
          {/* Subtle radial glow behind logo */}
          <Animated.View style={[styles.glow, glowAnimatedStyle]}>
            <View
              style={[
                styles.glowInner,
                { backgroundColor: isDark ? "#16a34a" : "#15803d" },
              ]}
            />
          </Animated.View>
          {/* Logo */}
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={splashLogo}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 160,
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  glowInner: {
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.15,
  },
});
