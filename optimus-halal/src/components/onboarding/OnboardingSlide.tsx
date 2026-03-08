/**
 * OnboardingSlide — Per-slide choreographed animation component
 *
 * Each slide has:
 * - Parallax translateX on hero icon & title (different factors)
 * - Staggered entrance (hero → title → highlight → description → decorative)
 *   triggered every time the slide becomes the active index
 * - Slide 5 (CTA) renders two buttons instead of description
 */

import React, { useCallback } from "react";
import { View, Text, Dimensions, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  withSpring,
  withDelay,
  withTiming,
  SharedValue,
  Extrapolation,
} from "react-native-reanimated";

import type { OnboardingSlideConfig } from "@constants/onboarding";
import { useTheme, useTranslation } from "@/hooks";
import { PressableScale } from "@/components/ui/PressableScale";
import { gold, primary } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Spring presets
const SPRING_SNAPPY = { damping: 18, stiffness: 280, mass: 0.8 };
const SPRING_SOFT = { damping: 14, stiffness: 200, mass: 0.6 };

// Madhab schools for slide 3
const MADHAB_SCHOOLS = [
  { label: "Hanafi", icon: "check-circle" as const },
  { label: "Shafi'i", icon: "check-circle" as const },
  { label: "Maliki", icon: "check-circle" as const },
  { label: "Hanbali", icon: "check-circle" as const },
];

interface OnboardingSlideProps {
  config: OnboardingSlideConfig;
  index: number;
  scrollX: SharedValue<number>;
  activeIndex: SharedValue<number>;
  onCreateAccount?: () => void;
  onExplore?: () => void;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  config,
  index,
  scrollX,
  activeIndex,
  onCreateAccount,
  onExplore,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const slideContent = t.onboarding.slides[config.id];

  // ── Shared values for entrance choreography ──
  const heroScale = useSharedValue(0.8);
  const heroOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(24);
  const titleOpacity = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);
  const highlightTranslateY = useSharedValue(16);
  const descOpacity = useSharedValue(0);
  const descTranslateY = useSharedValue(16);
  const decorOpacity = useSharedValue(0);

  // ── Trigger entrance when this slide becomes active ──
  useAnimatedReaction(
    () => activeIndex.value,
    (current, previous) => {
      if (current === index && previous !== index) {
        // Reset everything before animating in
        heroScale.value = 0.8;
        heroOpacity.value = 0;
        titleTranslateY.value = 24;
        titleOpacity.value = 0;
        highlightOpacity.value = 0;
        highlightTranslateY.value = 16;
        descOpacity.value = 0;
        descTranslateY.value = 16;
        decorOpacity.value = 0;

        // Staggered entrance
        // 0ms: Hero icon
        heroScale.value = withSpring(1, SPRING_SNAPPY);
        heroOpacity.value = withTiming(1, { duration: 350 });

        // 150ms: Title
        titleTranslateY.value = withDelay(150, withSpring(0, SPRING_SOFT));
        titleOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));

        // 300ms: Highlight
        highlightTranslateY.value = withDelay(300, withSpring(0, SPRING_SOFT));
        highlightOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

        // 400ms: Description
        descTranslateY.value = withDelay(400, withSpring(0, SPRING_SOFT));
        descOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

        // 500ms: Decorative elements
        decorOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
      }
    },
    [index],
  );

  // ── Parallax styles ──
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heroScale.value },
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [SCREEN_WIDTH * 0.15, 0, -SCREEN_WIDTH * 0.15],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: heroOpacity.value,
  }));

  const titleParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: titleTranslateY.value },
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: titleOpacity.value,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: highlightTranslateY.value }],
    opacity: highlightOpacity.value,
  }));

  const descStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: descTranslateY.value }],
    opacity: descOpacity.value,
  }));

  const decorStyle = useAnimatedStyle(() => ({
    opacity: decorOpacity.value,
  }));

  // ── Render hero section per slide type ──
  const renderHero = useCallback(() => {
    const isBrandOrCta = config.id === "brand" || config.id === "cta";

    if (isBrandOrCta) {
      return (
        <View style={styles.heroLogoContainer}>
          <Image
            source={require("@assets/images/logo_naqiy.webp")}
            style={styles.heroLogo}
            contentFit="contain"
            transition={200}
          />
        </View>
      );
    }

    if (config.id === "madhab") {
      return (
        <View style={styles.heroIconContainer}>
          <MaterialIcons
            name={config.heroIcon as any}
            size={72}
            color={config.accentColor}
          />
          {/* Madhab badges row */}
          <Animated.View style={[styles.madhabRow, decorStyle]}>
            {MADHAB_SCHOOLS.map((school, i) => (
              <View
                key={school.label}
                style={[
                  styles.madhabBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    borderColor: isDark
                      ? "rgba(207,165,51,0.2)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                <MaterialIcons
                  name={school.icon}
                  size={14}
                  color={gold[isDark ? 400 : 600]}
                />
                <Text
                  style={[
                    styles.madhabLabel,
                    { color: isDark ? "#e5e5e5" : "#374151" },
                  ]}
                >
                  {school.label}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>
      );
    }

    if (config.id === "map") {
      return (
        <View style={styles.heroIconContainer}>
          <MaterialIcons
            name="place"
            size={80}
            color={config.accentColor}
          />
          {/* Floating mini pins */}
          <Animated.View style={[styles.mapPins, decorStyle]}>
            {[-30, 35, -10].map((offset, i) => (
              <View
                key={i}
                style={[
                  styles.miniPin,
                  {
                    transform: [
                      { translateX: offset },
                      { translateY: (i % 2 === 0 ? -1 : 1) * 12 },
                    ],
                    backgroundColor: isDark ? gold[500] : primary[500],
                    opacity: 0.6 + i * 0.15,
                  },
                ]}
              >
                <MaterialIcons name="place" size={10} color="#fff" />
              </View>
            ))}
          </Animated.View>
        </View>
      );
    }

    // Default: scanner + others
    return (
      <View style={styles.heroIconContainer}>
        <MaterialIcons
          name={config.heroIcon as any}
          size={80}
          color={config.accentColor}
        />
        {config.id === "scanner" && (
          <Animated.View style={[styles.scanLine, decorStyle]}>
            <View
              style={[
                styles.scanLineBar,
                { backgroundColor: primary[500] },
              ]}
            />
          </Animated.View>
        )}
      </View>
    );
  }, [config, isDark, decorStyle]);

  const isCta = config.id === "cta";

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, heroParallaxStyle]}>
        {/* Accent glow background */}
        <View
          style={[
            styles.accentGlow,
            {
              backgroundColor: config.accentColor,
              opacity: isDark ? 0.08 : 0.06,
            },
          ]}
        />
        {renderHero()}
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.textSection, titleParallaxStyle]}>
        <Text
          style={[
            styles.title,
            { color: isDark ? "#ffffff" : "#0d1b13" },
          ]}
        >
          {slideContent.title}
        </Text>
      </Animated.View>

      {/* Highlighted text */}
      <Animated.View style={highlightStyle}>
        <Text
          style={[
            styles.highlight,
            { color: config.accentColor },
          ]}
        >
          {slideContent.highlight}
        </Text>
      </Animated.View>

      {/* Description or CTA buttons */}
      {isCta ? (
        <Animated.View style={[styles.ctaContainer, descStyle]}>
          <Text
            style={[
              styles.description,
              { color: isDark ? "#a0a0a0" : "#4b5563", marginBottom: 28 },
            ]}
          >
            {slideContent.description}
          </Text>

          {/* Create Account Button */}
          <PressableScale onPress={onCreateAccount} style={styles.ctaButtonWrapper}>
            <View
              style={[
                styles.ctaPrimary,
                {
                  backgroundColor: isDark ? gold[500] : "#0d1b13",
                  ...(Platform.OS === "ios"
                    ? {
                        shadowColor: isDark ? gold[500] : "#000",
                        shadowOpacity: isDark ? 0.3 : 0.15,
                        shadowOffset: { width: 0, height: 4 },
                        shadowRadius: 12,
                      }
                    : { elevation: 6 }),
                },
              ]}
            >
              <MaterialIcons
                name="person-add"
                size={18}
                color={isDark ? "#0d1b13" : "#ffffff"}
              />
              <Text
                style={[
                  styles.ctaPrimaryText,
                  { color: isDark ? "#0d1b13" : "#ffffff" },
                ]}
              >
                {t.onboarding.createAccount}
              </Text>
            </View>
          </PressableScale>

          {/* Explore Mode Button */}
          <PressableScale onPress={onExplore} style={styles.ctaButtonWrapper}>
            <View
              style={[
                styles.ctaSecondary,
                {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)",
                },
              ]}
            >
              <MaterialIcons
                name="travel-explore"
                size={18}
                color={isDark ? "#a0a0a0" : "#6b7280"}
              />
              <Text
                style={[
                  styles.ctaSecondaryText,
                  { color: isDark ? "#a0a0a0" : "#6b7280" },
                ]}
              >
                {t.onboarding.exploreMode}
              </Text>
            </View>
          </PressableScale>

          <Text
            style={[
              styles.hintText,
              { color: isDark ? "#6b7280" : "#9ca3af" },
            ]}
          >
            {t.onboarding.exploreModeHint}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View style={descStyle}>
          <Text
            style={[
              styles.description,
              { color: isDark ? "#a0a0a0" : "#4b5563" },
            ]}
          >
            {slideContent.description}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    height: 180,
  },
  accentGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  glowRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  heroLogo: {
    width: 100,
    height: 100,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: Platform.OS === "android" ? 0 : -0.5,
  },
  highlight: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: Platform.OS === "android" ? 0 : -0.5,
  },
  description: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    letterSpacing: Platform.OS === "android" ? 0 : 0.1,
  },
  // Madhab decorative
  madhabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  madhabBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  madhabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: Platform.OS === "android" ? 0.1 : 0.3,
  },
  // Map decorative
  mapPins: {
    position: "absolute",
    width: 160,
    height: 80,
    top: -10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  miniPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Scanner decorative
  scanLine: {
    position: "absolute",
    width: 60,
    alignItems: "center",
    top: "50%",
  },
  scanLineBar: {
    width: "100%",
    height: 2,
    borderRadius: 1,
    opacity: 0.7,
  },
  // CTA slide
  ctaContainer: {
    alignItems: "center",
    width: "100%",
  },
  ctaButtonWrapper: {
    width: "100%",
    marginBottom: 12,
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: Platform.OS === "android" ? 0.1 : 0.3,
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
});

export default OnboardingSlide;
