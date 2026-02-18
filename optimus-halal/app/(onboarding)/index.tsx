/**
 * Onboarding Screen
 * 
 * Écran d'introduction avec 3 slides animés
 */

import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { useHaptics, useTheme, useTranslation } from "@/hooks";

import { OnboardingSlide } from "@/components/onboarding";
import { PageIndicator, Button } from "@/components/ui";
import { onboardingSlides } from "@constants/onboarding";
import { useOnboardingStore } from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  
  const { setOnboardingComplete } = useOnboardingStore();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;
      const newIndex = Math.round(offsetX / SCREEN_WIDTH);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < onboardingSlides.length) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex]
  );

  const handleNext = useCallback(async () => {
    impact();
    
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Complete onboarding
      setOnboardingComplete(true);
      router.replace("/(auth)/welcome");
    }
  }, [currentIndex, setOnboardingComplete]);

  const handleSkip = useCallback(async () => {
    impact();
    setOnboardingComplete(true);
    router.replace("/(auth)/welcome");
  }, [setOnboardingComplete]);

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  // Animated button scale
  const buttonScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(1) }],
    };
  });

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Skip Button */}
      <Animated.View
        entering={FadeIn.delay(300)}
        className="absolute z-10 right-0"
        style={{ top: insets.top + 12, right: 16 }}
      >
        <TouchableOpacity
          onPress={handleSkip}
          className="flex-row items-center gap-1 py-2 px-3 rounded-full"
          activeOpacity={0.7}
        >
          <Text className="text-slate-600 dark:text-slate-400 text-sm font-semibold tracking-wide">
            {t.onboarding.skip}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <OnboardingSlide slide={item} index={index} />
        )}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
        }}
      />

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(500)}
        className="w-full px-6 pb-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Page Indicators */}
        <View className="items-center mb-8">
          <PageIndicator
            count={onboardingSlides.length}
            currentIndex={currentIndex}
            activeColor={colors.primary}
            inactiveColor={isDark ? "#334155" : "#e2e8f0"}
          />
        </View>

        {/* Action Button */}
        <Animated.View style={buttonScale}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            className={`
              w-full h-14 rounded-2xl items-center justify-center flex-row gap-2
              ${isDark ? "bg-primary-500" : "bg-slate-900"}
              shadow-lg
            `}
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              className={`text-lg font-bold tracking-wide ${
                isDark ? "text-slate-900" : "text-white"
              }`}
            >
              {isLastSlide ? t.onboarding.start : t.onboarding.next}
            </Text>
            <MaterialIcons
              name={isLastSlide ? "check" : "arrow-forward"}
              size={20}
              color={isDark ? "#0d1b13" : colors.primary}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
