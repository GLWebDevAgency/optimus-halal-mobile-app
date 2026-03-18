/**
 * Onboarding Screen — World-class 5-slide experience
 *
 * Architecture:
 * - Animated.ScrollView (horizontal, paging) for full parallax support
 * - scrollX SharedValue → AnimatedPageIndicator + per-slide choreography
 * - PremiumBackground as single backdrop (not per-slide)
 * - Haptic on every slide transition via useAnimatedReaction
 * - Skip button always visible (hidden on CTA slide)
 * - Footer: AnimatedPageIndicator + Next button (fades on CTA slide)
 */

import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRightIcon } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  FadeIn,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";

import { useHaptics, useTheme, useTranslation } from "@/hooks";
import { OnboardingSlide } from "@/components/onboarding";
import { PremiumBackground, AnimatedPageIndicator } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { ONBOARDING_SLIDES } from "@constants/onboarding";
import { useOnboardingStore, useTrialStore } from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_COUNT = ONBOARDING_SLIDES.length;
const LAST_INDEX = SLIDE_COUNT - 1;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const { setOnboardingComplete } = useOnboardingStore();

  // ── Derived active index (UI thread) ──
  const activeIndex = useDerivedValue(
    () => Math.round(scrollX.value / SCREEN_WIDTH),
  );

  // ── Scroll handler (UI thread) ──
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // ── Haptic on slide change ──
  const triggerHaptic = useCallback(() => {
    impact();
  }, [impact]);

  useAnimatedReaction(
    () => activeIndex.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(triggerHaptic)();
      }
    },
  );

  // ── Navigation actions ──
  const scrollToIndex = useCallback(
    (index: number) => {
      scrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    },
    [],
  );

  const handleNext = useCallback(() => {
    const current = Math.round(scrollX.value / SCREEN_WIDTH);
    if (current < LAST_INDEX) {
      scrollToIndex(current + 1);
    }
  }, [scrollToIndex, scrollX]);

  const handleSkip = useCallback(() => {
    impact();
    setOnboardingComplete(true);
    useTrialStore.getState().startTrial();
    router.replace("/(tabs)");
  }, [impact, setOnboardingComplete]);

  const handleStart = useCallback(() => {
    notification();
    setOnboardingComplete(true);
    useTrialStore.getState().startTrial();
    router.replace("/(tabs)");
  }, [notification, setOnboardingComplete]);

  const handleLogin = useCallback(() => {
    impact();
    setOnboardingComplete(true);
    useTrialStore.getState().startTrial();
    router.replace("/(auth)/login");
  }, [impact, setOnboardingComplete]);

  // ── Animated skip button opacity (fade out on last slide) ──
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(LAST_INDEX - 1) * SCREEN_WIDTH, LAST_INDEX * SCREEN_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // ── Animated footer (hide Next button on CTA slide) ──
  const nextButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(LAST_INDEX - 1) * SCREEN_WIDTH, LAST_INDEX * SCREEN_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollX.value,
          [(LAST_INDEX - 1) * SCREEN_WIDTH, LAST_INDEX * SCREEN_WIDTH],
          [0, 20],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <PremiumBackground />

      {/* Skip Button — top right */}
      <Animated.View
        entering={FadeIn.delay(300)}
        style={[
          styles.skipContainer,
          skipStyle,
          { top: insets.top + 12 },
        ]}
      >
        <Pressable onPress={handleSkip} hitSlop={8}>
          <View style={styles.skipPill}>
            <Text
              style={[
                styles.skipText,
                { color: "#64748b" },
              ]}
            >
              {t.onboarding.skip}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
        }}
      >
        {ONBOARDING_SLIDES.map((config, index) => (
          <OnboardingSlide
            key={config.id}
            config={config}
            index={index}
            scrollX={scrollX}
            activeIndex={activeIndex}
            onStart={handleStart}
            onLogin={handleLogin}
          />
        ))}
      </Animated.ScrollView>

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Animated Page Indicator */}
        <View style={styles.indicatorContainer}>
          <AnimatedPageIndicator
            count={SLIDE_COUNT}
            scrollX={scrollX}
            pageWidth={SCREEN_WIDTH}
            activeColor={colors.primary}
            inactiveColor={isDark ? "#334155" : "#e2e8f0"}
          />
        </View>

        {/* Next Button — fades out on last slide */}
        <Animated.View style={nextButtonStyle}>
          <PressableScale
            onPress={handleNext}
            style={{
              ...(Platform.OS === "ios"
                ? {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                  }
                : { elevation: 6 }),
            }}
          >
            <View
              style={[
                styles.nextButton,
                {
                  backgroundColor: isDark ? colors.primary : "#0d1b13",
                },
              ]}
            >
              <Text
                style={[
                  styles.nextText,
                  { color: isDark ? "#0d1b13" : "#ffffff" },
                ]}
              >
                {t.onboarding.next}
              </Text>
              <ArrowRightIcon size={20}
                color={isDark ? "#0d1b13" : colors.primary} />
            </View>
          </PressableScale>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  skipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: Platform.OS === "android" ? 0.1 : 0.3,
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  indicatorContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  nextButton: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: Platform.OS === "android" ? 0.1 : 0.3,
  },
});
