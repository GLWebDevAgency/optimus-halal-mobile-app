/**
 * Onboarding Slide Component
 * 
 * Composant pour un slide individuel d'onboarding
 */

import React from "react";
import { View, Text, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import type { OnboardingSlide as OnboardingSlideType } from "@constants/onboarding";
import { useTheme } from "@/hooks";
import { IslamicPattern } from "@/components/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const patterns = ["tessellation", "arabesque", "khatam"] as const;

interface OnboardingSlideProps {
  slide: OnboardingSlideType;
  index: number;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  index,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-6"
    >
      {/* Hero Image Container */}
      <Animated.View
        entering={FadeInUp.delay(index * 100).duration(600)}
        className="relative w-full aspect-[4/5] max-h-[45%] mb-8"
      >
        {/* Decorative Background Glow */}
        <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-primary-500/10 rounded-full blur-3xl" />

        {/* Image Card */}
        <View className="relative h-full w-full overflow-hidden rounded-3xl shadow-xl border border-white/50 dark:border-white/5 bg-white dark:bg-surface-dark">
          <Image
            source={{ uri: slide.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />

          {/* Overlay Gradient */}
          <LinearGradient
            colors={[
              "transparent",
              isDark ? "rgba(16, 34, 23, 0.8)" : "rgba(246, 248, 246, 0.2)",
            ]}
            className="absolute inset-0"
          />

          {/* Islamic Pattern Overlay */}
          <IslamicPattern variant={patterns[index] ?? "tessellation"} opacity={0.04} />

          {/* Floating Badge */}
          <View className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gold-500/20 items-center justify-center">
            <MaterialIcons
              name={slide.badgeIcon as any}
              size={24}
              color="#D4AF37"
            />
          </View>

          {/* Scan Line Animation (for first slide) */}
          {index === 0 && (
            <View className="absolute top-1/3 left-0 w-full h-1 bg-primary-500 shadow-glow-primary opacity-80" />
          )}
        </View>
      </Animated.View>

      {/* Text Content */}
      <Animated.View
        entering={FadeInDown.delay(200 + index * 100).duration(600)}
        className="w-full items-center"
      >
        <Text className="text-slate-900 dark:text-white text-[32px] leading-[1.1] font-bold tracking-tight text-center mb-4">
          {slide.title}
          {"\n"}
          <Text className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-gold-500">
            {slide.highlightedText}
          </Text>
        </Text>

        <Text className="text-slate-600 dark:text-slate-400 text-base font-normal leading-relaxed text-center max-w-[320px]">
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
};

export default OnboardingSlide;
