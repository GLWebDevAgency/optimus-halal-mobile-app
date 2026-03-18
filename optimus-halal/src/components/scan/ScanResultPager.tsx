/**
 * ScanResultPager — Pure-JS horizontal pager synced with ScanResultTabBar.
 *
 * Uses Animated.ScrollView + pagingEnabled instead of react-native-pager-view
 * to avoid requiring a native module rebuild.
 *
 * Features:
 *  - Dynamic height: each page is measured via onLayout and the container
 *    animates smoothly between the two heights using withSpring.
 *  - Tab sync: onScroll propagates (position + offset) as a 0..1
 *    progress value so the TabBar indicator follows the swipe gesture.
 *  - Programmatic navigation: when activeTab changes externally (tab press),
 *    scrollTo is called via useEffect.
 *
 * @module components/scan/ScanResultPager
 */

import React, { useEffect, useRef, useState } from "react";
import { View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";

import { useHaptics } from "@/hooks";
import { spacing } from "@/theme/spacing";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface ScanResultPagerProps {
  /** Currently active tab index (0 = Halal, 1 = Santé). Controlled externally. */
  activeTab: number;
  /** Called when the user finishes a page swipe, with the new page index. */
  onPageChange: (index: number) => void;
  /**
   * SharedValue written on every scroll frame (0..1 continuous).
   * The TabBar reads this to animate its indicator in real time.
   */
  scrollProgress: SharedValue<number>;
  /** Content rendered inside page 0 (Halal tab). */
  halalContent: React.ReactNode;
  /** Content rendered inside page 1 (Santé / Health tab). */
  healthContent: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ScanResultPager = React.memo(function ScanResultPager({
  activeTab,
  onPageChange,
  scrollProgress,
  halalContent,
  healthContent,
}: ScanResultPagerProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const { selection } = useHaptics();

  // Page width: start with a good estimate, refine on layout.
  const estimatedWidth = screenWidth - spacing.xl * 2;
  const [pageWidth, setPageWidth] = useState(estimatedWidth);

  // Shared value mirror for worklet access.
  const pageWidthSV = useSharedValue(estimatedWidth);

  // Measured heights for each page (0 until onLayout fires).
  const page0Height = useSharedValue(0);
  const page1Height = useSharedValue(0);

  // ── Measure container width ──────────────────────────────────
  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - pageWidth) > 1) {
      setPageWidth(w);
      pageWidthSV.value = w;
    }
  };

  // ── Programmatic navigation when activeTab changes externally ──
  useEffect(() => {
    if (pageWidth > 0) {
      (scrollRef.current as any)?.scrollTo?.({
        x: activeTab * pageWidth,
        animated: true,
      });
    }
  }, [activeTab, pageWidth]);

  // ── Animated scroll handler (runs on UI thread) ──────────────
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      const w = pageWidthSV.value;
      if (w === 0) return;

      // Write directly to the shared value — no JS bridge needed.
      scrollProgress.value = event.contentOffset.x / w;
    },
    onMomentumEnd(event) {
      const w = pageWidthSV.value;
      if (w === 0) return;

      const page = Math.round(event.contentOffset.x / w);
      // Bridge to JS thread for React state update + haptic feedback.
      runOnJS(onPageChange)(page);
      runOnJS(selection)();
    },
  });

  // ── Animated container height ──────────────────────────────
  // No spring — scrollProgress already provides smooth interpolation during swipe.
  // This prevents the initial render overlap where spring starts from 0 and
  // sections below the pager are positioned too high.
  const animatedContainerStyle = useAnimatedStyle(() => {
    const h0 = page0Height.value;
    const h1 = page1Height.value;
    // Before first measurement, let content flow naturally.
    if (h0 === 0 && h1 === 0) return {};
    // If only one page measured, use that.
    if (h0 === 0) return { height: h1, overflow: "hidden" as const };
    if (h1 === 0) return { height: h0, overflow: "hidden" as const };
    return {
      height: interpolate(scrollProgress.value, [0, 1], [h0, h1]),
      overflow: "hidden" as const,
    };
  });

  // ── Render ─────────────────────────────────────────────────
  return (
    <Animated.View style={animatedContainerStyle} onLayout={handleLayout}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={false}
        nestedScrollEnabled
        contentContainerStyle={{ alignItems: "flex-start" }}
      >
        {/* Page 0 — Halal */}
        <View
          style={{ width: pageWidth }}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) page0Height.value = height;
          }}
          collapsable={false}
        >
          {halalContent}
        </View>

        {/* Page 1 — Santé / Health */}
        <View
          style={{ width: pageWidth }}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) page1Height.value = height;
          }}
          collapsable={false}
        >
          {healthContent}
        </View>
      </Animated.ScrollView>
    </Animated.View>
  );
});
