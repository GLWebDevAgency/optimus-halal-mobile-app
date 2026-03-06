/**
 * AnimatedSplash — Video-based cinematic splash → app handoff
 *
 * Plays the Remotion-rendered LogoReveal video (theme-aware: light/dark).
 * When both conditions are met (video finished + app ready), fades out
 * and calls onFinish to unmount the splash overlay.
 *
 * Pattern: Revolut / Airbnb / Duolingo cinematic splash
 */

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks";

const splashLight = require("@assets/videos/splash_light.mp4");
const splashDark = require("@assets/videos/splash_dark.mp4");

// Safety timeout: if playToEnd never fires (Android emulator codec issues),
// force exit after video duration + buffer
const VIDEO_TIMEOUT_MS = 10_000;

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const { isDark } = useTheme();
  const source = isDark ? splashDark : splashLight;

  const containerOpacity = useSharedValue(1);
  const videoFinished = useRef(false);
  const exitTriggered = useRef(false);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.play();
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

  // ── Detect video end ──
  useEventListener(player, "playToEnd", () => {
    videoFinished.current = true;
    if (isReady) triggerExit();
  });

  // ── Safety timeout: force exit if playToEnd never fires (Android emulator) ──
  // triggerExit is idempotent (exitTriggered guard), so safe to call unconditionally.
  useEffect(() => {
    const timeout = setTimeout(triggerExit, VIDEO_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [triggerExit]);

  // ── If app becomes ready after video ends ──
  useEffect(() => {
    if (isReady && videoFinished.current) {
      triggerExit();
    }
  }, [isReady, triggerExit]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // On Android, hide the background once the first video frame renders to avoid
  // SurfaceView/TextureView compositing flicker with the background View.
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const bgColor = isDark ? "#0C0C0C" : "#f3f1ed";

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }, containerStyle]}>
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
    </Animated.View>
  );
}
