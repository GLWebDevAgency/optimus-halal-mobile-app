/**
 * OnboardingSlide — Per-slide choreographed animation component
 *
 * Each slide has:
 * - Parallax translateX on hero icon & title (different factors)
 * - Staggered entrance (hero -> title -> highlight -> description -> decorative)
 *   triggered every time the slide becomes the active index
 * - Slide-specific decorative elements:
 *   - brand: logo image
 *   - scanner: BarcodeIcon + mini scan result preview
 *   - trust: ShieldCheckIcon + NaqiyGradeBadge strip explained
 *   - map: MapPinIcon + floating pins + mini store card
 *   - cta: logo image + premium profile chips + health badge
 */

import React, { useCallback } from "react";
import { View, Text, Dimensions, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import {
  BarcodeIcon,
  GlobeHemisphereWestIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
  WarningIcon,
} from "phosphor-react-native";
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
import { gold, primary, halalStatus as halalTokens } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Spring presets
const SPRING_SNAPPY = { damping: 18, stiffness: 280, mass: 0.8 };
const SPRING_SOFT = { damping: 14, stiffness: 200, mass: 0.6 };

// ── NaqiyGradeBadge data (inlined for onboarding) ──────────
const TRUST_GRADES = [
  { grade: 1, arabic: "١", color: "#22c55e" },
  { grade: 2, arabic: "٢", color: "#84cc16" },
  { grade: 3, arabic: "٣", color: "#f59e0b" },
  { grade: 4, arabic: "٤", color: "#f97316" },
  { grade: 5, arabic: "٥", color: "#ef4444" },
] as const;

const GRADE_LABELS = [
  "Très fiable",
  "Fiable",
  "Vigilance",
  "Peu fiable",
  "Pas fiable du tout",
] as const;

const ACTIVE_DEMO_GRADE = 2;

interface OnboardingSlideProps {
  config: OnboardingSlideConfig;
  index: number;
  scrollX: SharedValue<number>;
  activeIndex: SharedValue<number>;
  onStart?: () => void;
  onLogin?: () => void;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  config,
  index,
  scrollX,
  activeIndex,
  onStart,
  onLogin,
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
        heroScale.value = withSpring(1, SPRING_SNAPPY);
        heroOpacity.value = withTiming(1, { duration: 350 });
        titleTranslateY.value = withDelay(150, withSpring(0, SPRING_SOFT));
        titleOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
        highlightTranslateY.value = withDelay(
          300,
          withSpring(0, SPRING_SOFT),
        );
        highlightOpacity.value = withDelay(
          300,
          withTiming(1, { duration: 300 }),
        );
        descTranslateY.value = withDelay(400, withSpring(0, SPRING_SOFT));
        descOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
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
    if (config.id === "brand" || config.id === "cta") {
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

    if (config.id === "scanner") {
      return (
        <View style={styles.heroIconContainer}>
          <BarcodeIcon size={72} color={config.accentColor} />
          {/* Mini scan result preview card */}
          <Animated.View style={[styles.scanPreviewCard, decorStyle]}>
            <View style={styles.scanPreviewStatusRow}>
              <View
                style={[
                  styles.scanPreviewDot,
                  { backgroundColor: halalTokens.halal.base },
                ]}
              />
              <Text
                style={[
                  styles.scanPreviewStatusText,
                  { color: halalTokens.halal.base },
                ]}
              >
                Halal Certifié
              </Text>
            </View>
            <View style={styles.scanPreviewBottom}>
              {/* Mini NaqiyGradeBadge strip */}
              <View style={styles.miniGradeStrip}>
                <Text style={styles.miniGradeN}>N</Text>
                {TRUST_GRADES.map((g) => {
                  const isActive = g.grade === ACTIVE_DEMO_GRADE;
                  return (
                    <View
                      key={g.grade}
                      style={[
                        styles.miniGradePill,
                        isActive
                          ? styles.miniGradePillActive
                          : styles.miniGradePillInactive,
                        { backgroundColor: g.color },
                        !isActive && { opacity: 0.2 },
                      ]}
                    >
                      <Text style={styles.miniGradePillText}>
                        {g.arabic}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {/* Mini health ring */}
              <View style={styles.miniHealthRow}>
                <View style={styles.miniRingContainer}>
                  <Svg width={32} height={17} viewBox="0 0 32 17">
                    <Path
                      d="M 4 16 A 12 12 0 0 1 28 16"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 4 16 A 12 12 0 0 1 28 16"
                      fill="none"
                      stroke={primary[500]}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={37.7}
                      strokeDashoffset={11.3}
                    />
                  </Svg>
                  <Text style={[styles.miniRingScore, { color: primary[500] }]}>
                    68
                  </Text>
                </View>
                <Text style={[styles.miniHealthLabel, { color: primary[500] }]}>
                  BON
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      );
    }

    if (config.id === "trust") {
      return (
        <View style={styles.heroIconContainer}>
          <ShieldCheckIcon
            size={72}
            color={gold[500]}
            weight="duotone"
          />
          {/* NaqiyGradeBadge full explained */}
          <Animated.View style={[styles.gradeExplainedCard, decorStyle]}>
            {/* Strip */}
            <View style={styles.gradeStripRow}>
              <Text style={styles.gradeStripN}>N</Text>
              {TRUST_GRADES.map((g) => {
                const isActive = g.grade === ACTIVE_DEMO_GRADE;
                return (
                  <View
                    key={g.grade}
                    style={[
                      styles.gradeStripPill,
                      isActive
                        ? styles.gradeStripPillActive
                        : styles.gradeStripPillInactive,
                      { backgroundColor: g.color },
                      !isActive && { opacity: 0.22 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeStripPillText,
                        { fontSize: isActive ? 12 : 10 },
                      ]}
                    >
                      {g.arabic}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Labels */}
            <View style={styles.gradeLabelsRow}>
              {TRUST_GRADES.map((g, i) => {
                const isActive = g.grade === ACTIVE_DEMO_GRADE;
                return (
                  <View
                    key={g.grade}
                    style={[
                      styles.gradeLabelCol,
                      isActive && { width: 40 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeLabelText,
                        isActive && { color: g.color },
                      ]}
                    >
                      {GRADE_LABELS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Madhab mini dots */}
            <View style={styles.madhabMiniRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.madhabMiniDot} />
              ))}
              <Text style={styles.madhabMiniLabel}>4 écoles analysées</Text>
            </View>
          </Animated.View>
        </View>
      );
    }

    if (config.id === "map") {
      return (
        <View style={styles.heroIconContainer}>
          <MapPinIcon size={80} color={config.accentColor} />
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
                <MapPinIcon size={10} color="#fff" />
              </View>
            ))}
          </Animated.View>
          {/* Mini store card */}
          <Animated.View
            style={[
              styles.storeCard,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
                borderColor: isDark
                  ? "rgba(207,165,51,0.14)"
                  : "rgba(0,0,0,0.08)",
              },
              decorStyle,
            ]}
          >
            <View style={styles.storeCardTop}>
              <Text
                style={[
                  styles.storeCardName,
                  { color: isDark ? "#fff" : "#1a1a1a" },
                ]}
              >
                La Boucherie Halal
              </Text>
              <View style={styles.storeDistBadge}>
                <Text style={styles.storeDistText}>0.3 km</Text>
              </View>
            </View>
            <View style={styles.storeCardBottom}>
              <View style={styles.storeCertBadge}>
                <ShieldCheckIcon
                  size={10}
                  color={gold[500]}
                  weight="fill"
                />
                <Text style={styles.storeCertText}>AVS</Text>
              </View>
              <View style={styles.storeStatusRow}>
                <View style={styles.storeOpenDot} />
                <Text style={styles.storeOpenText}>Ouvert</Text>
                <Text style={styles.storeRatingText}>·</Text>
                <StarIcon size={10} color={gold[500]} weight="fill" />
                <Text style={styles.storeRatingText}>4.6</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      );
    }

    return null;
  }, [config, isDark, decorStyle]);

  const isCta = config.id === "cta";

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, heroParallaxStyle]}>
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

      {/* Description or CTA section */}
      {isCta ? (
        <Animated.View style={[styles.ctaContainer, descStyle]}>
          {/* Premium profile chips */}
          <View style={styles.premiumChips}>
            <View
              style={[
                styles.premiumChip,
                {
                  backgroundColor: isDark
                    ? "rgba(207,165,51,0.05)"
                    : "rgba(207,165,51,0.08)",
                  borderColor: "rgba(207,165,51,0.18)",
                },
              ]}
            >
              <WarningIcon size={13} color={gold[500]} />
              <Text style={styles.premiumChipText}>Allergènes</Text>
              <Text style={styles.premiumPlusLabel}>NAQIY+</Text>
            </View>
            <View
              style={[
                styles.premiumChip,
                {
                  backgroundColor: isDark
                    ? "rgba(207,165,51,0.05)"
                    : "rgba(207,165,51,0.08)",
                  borderColor: "rgba(207,165,51,0.18)",
                },
              ]}
            >
              <Svg width={13} height={13} viewBox="0 0 256 256">
                <Path
                  d="M128 24a80 80 0 0 0-80 80c0 24 8 40 24 60s24 44 24 68h64c0-24 8-48 24-68s24-36 24-60a80 80 0 0 0-80-80Z"
                  fill="none"
                  stroke={gold[500]}
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.premiumChipText}>Grossesse</Text>
              <Text style={styles.premiumPlusLabel}>NAQIY+</Text>
            </View>
            <View
              style={[
                styles.premiumChip,
                {
                  backgroundColor: isDark
                    ? "rgba(207,165,51,0.05)"
                    : "rgba(207,165,51,0.08)",
                  borderColor: "rgba(207,165,51,0.18)",
                },
              ]}
            >
              <Svg width={13} height={13} viewBox="0 0 256 256">
                <Path
                  d="M160 128a32 32 0 0 1-64 0c0-24 32-56 32-56s32 32 32 56Z"
                  fill="none"
                  stroke={gold[500]}
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.premiumChipText}>Enfants</Text>
              <Text style={styles.premiumPlusLabel}>NAQIY+</Text>
            </View>
          </View>

          {/* Health score badge */}
          <View
            style={[
              styles.healthBadge,
              {
                backgroundColor: isDark
                  ? "rgba(19,236,106,0.05)"
                  : "rgba(19,236,106,0.08)",
                borderColor: "rgba(19,236,106,0.12)",
              },
            ]}
          >
            <View style={styles.healthBadgeDot} />
            <Text
              style={[
                styles.healthBadgeText,
                { color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" },
              ]}
            >
              Score Santé{" "}
            </Text>
            <Text style={[styles.healthBadgeText, { color: primary[500], fontWeight: "700" }]}>
              Naqiy V3
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              { color: isDark ? "#a0a0a0" : "#4b5563", marginTop: 12, marginBottom: 20 },
            ]}
          >
            {slideContent.description}
          </Text>

          {/* Primary CTA — Start (guest mode, zero friction) */}
          <PressableScale onPress={onStart} style={styles.ctaButtonWrapper}>
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
              <GlobeHemisphereWestIcon
                size={18}
                color={isDark ? "#0d1b13" : "#ffffff"}
              />
              <Text
                style={[
                  styles.ctaPrimaryText,
                  { color: isDark ? "#0d1b13" : "#ffffff" },
                ]}
              >
                {t.onboarding.start}
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

          {/* Login link for returning subscribers */}
          <PressableScale onPress={onLogin}>
            <Text
              style={[
                styles.loginLink,
                { color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" },
              ]}
            >
              {t.onboarding.alreadySubscribed}{" "}
              <Text style={{ color: gold[500], fontWeight: "700" }}>
                {t.onboarding.login}
              </Text>
            </Text>
          </PressableScale>
        </Animated.View>
      ) : (
        <Animated.View style={descStyle}>
          {/* Brand slide: gold tagline */}
          {config.id === "brand" && (
            <Text style={styles.brandTagline}>
              Scanne. Comprends. Choisis.
            </Text>
          )}
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
    marginBottom: 24,
    minHeight: 180,
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

  // ── Brand tagline ──
  brandTagline: {
    fontSize: 13,
    fontWeight: "600",
    color: gold[500],
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },

  // ── Scanner: mini scan preview card ──
  scanPreviewCard: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 8,
    width: 220,
  },
  scanPreviewStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scanPreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scanPreviewStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scanPreviewBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Mini NaqiyGradeBadge strip
  miniGradeStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  miniGradeN: {
    fontSize: 11,
    fontWeight: "900",
    color: gold[500],
    marginRight: 2,
  },
  miniGradePill: {
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  miniGradePillActive: {
    width: 26,
    height: 16,
  },
  miniGradePillInactive: {
    width: 14,
    height: 14,
  },
  miniGradePillText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fff",
  },

  // Mini health ring
  miniHealthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  miniRingContainer: {
    width: 32,
    height: 17,
    position: "relative",
  },
  miniRingScore: {
    position: "absolute",
    bottom: -1,
    width: 32,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "900",
  },
  miniHealthLabel: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Trust: NaqiyGradeBadge explained ──
  gradeExplainedCard: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(207,165,51,0.05)",
    borderWidth: 1,
    borderColor: "rgba(207,165,51,0.12)",
    gap: 8,
    width: 250,
    alignItems: "center",
  },
  gradeStripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  gradeStripN: {
    fontSize: 14,
    fontWeight: "900",
    color: gold[500],
    marginRight: 3,
  },
  gradeStripPill: {
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeStripPillActive: {
    width: 40,
    height: 26,
  },
  gradeStripPillInactive: {
    width: 22,
    height: 22,
  },
  gradeStripPillText: {
    fontWeight: "900",
    color: "#fff",
  },
  gradeLabelsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
    paddingLeft: 20,
  },
  gradeLabelCol: {
    width: 22,
    alignItems: "center",
  },
  gradeLabelText: {
    fontSize: 7,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },

  // Madhab mini dots
  madhabMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    width: "100%",
  },
  madhabMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: primary[500],
    opacity: 0.7,
  },
  madhabMiniLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(207,165,51,0.6)",
  },

  // ── Map: floating pins + store card ──
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
  storeCard: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    width: 200,
  },
  storeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  storeCardName: {
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  storeDistBadge: {
    backgroundColor: "rgba(19,236,106,0.08)",
    borderWidth: 1,
    borderColor: "rgba(19,236,106,0.15)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  storeDistText: {
    fontSize: 9,
    fontWeight: "700",
    color: primary[500],
  },
  storeCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeCertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(207,165,51,0.07)",
    borderWidth: 1,
    borderColor: "rgba(207,165,51,0.12)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  storeCertText: {
    fontSize: 9,
    fontWeight: "700",
    color: gold[500],
  },
  storeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  storeOpenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: primary[500],
  },
  storeOpenText: {
    fontSize: 9,
    fontWeight: "600",
    color: primary[500],
  },
  storeRatingText: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },

  // ── CTA slide ──
  ctaContainer: {
    alignItems: "center",
    width: "100%",
  },
  premiumChips: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  premiumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: gold[500],
  },
  premiumPlusLabel: {
    fontSize: 7,
    fontWeight: "800",
    color: "rgba(207,165,51,0.5)",
    letterSpacing: 0.5,
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  healthBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: primary[500],
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: "600",
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
  hintText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
});

export default OnboardingSlide;
