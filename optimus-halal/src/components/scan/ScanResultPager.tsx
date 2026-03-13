/**
 * ScanResultPager — PagerView wrapper synced with ScanResultTabBar.
 *
 * Wraps react-native-pager-view with:
 *  - Dynamic height: each page is measured via onLayout and the container
 *    animates smoothly between the two heights using withSpring.
 *  - Tab sync: onPageScroll propagates (position + offset) as a 0..1
 *    progress value so the TabBar indicator follows the swipe gesture.
 *  - Programmatic navigation: when activeTab changes externally (tab press),
 *    pagerRef.current?.setPage(activeTab) is called via useEffect.
 *
 * @module components/scan/ScanResultPager
 */

import React, { useEffect, useRef, ReactNode } from "react";
import { Platform, View } from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

// ── Spring config ──────────────────────────────────────────────
/** Height transition: responsive yet smooth. */
const HEIGHT_SPRING = { damping: 20, stiffness: 150 } as const;

// ── Minimum fallback height (prevents 0-height flicker on first render) ──
const MIN_PAGE_HEIGHT = 200;

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface ScanResultPagerProps {
  /** Currently active tab index (0 = Halal, 1 = Santé). Controlled externally. */
  activeTab: number;
  /** Called when the user finishes a page swipe, with the new page index. */
  onPageChange: (index: number) => void;
  /**
   * Called on every scroll frame.
   * Reports progress = position + offset (a continuous 0..N value).
   * The TabBar uses this to animate its indicator in real time.
   */
  onScrollProgress: (position: number, offset: number) => void;
  /** Content rendered inside page 0 (Halal tab). */
  halalContent: ReactNode;
  /** Content rendered inside page 1 (Santé / Health tab). */
  healthContent: ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ScanResultPager = React.memo(function ScanResultPager({
  activeTab,
  onPageChange,
  onScrollProgress,
  halalContent,
  healthContent,
}: ScanResultPagerProps) {
  const pagerRef = useRef<PagerView>(null);

  // Measured heights for each page (JS-side shared values).
  const page0Height = useSharedValue(MIN_PAGE_HEIGHT);
  const page1Height = useSharedValue(MIN_PAGE_HEIGHT);

  // Fractional scroll progress used to interpolate height (0 = page 0, 1 = page 1).
  const scrollProgress = useSharedValue(0);

  // ── Programmatic navigation when activeTab changes externally ──
  useEffect(() => {
    pagerRef.current?.setPage(activeTab);
  }, [activeTab]);

  // ── Animated container height ──────────────────────────────
  const animatedContainerStyle = useAnimatedStyle(() => {
    const targetHeight = interpolate(
      scrollProgress.value,
      [0, 1],
      [page0Height.value, page1Height.value],
    );
    return {
      height: withSpring(targetHeight, HEIGHT_SPRING),
      overflow: "hidden",
    };
  });

  // ── Event handlers ─────────────────────────────────────────

  const handlePageScroll = (
    e: import("react-native-pager-view").PagerViewOnPageScrollEvent,
  ) => {
    const { position, offset } = e.nativeEvent;
    // Update animated progress for height interpolation.
    scrollProgress.value = position + offset;
    // Notify parent for TabBar indicator sync.
    onScrollProgress(position, offset);
  };

  const handlePageSelected = (
    e: import("react-native-pager-view").PagerViewOnPageSelectedEvent,
  ) => {
    const { position } = e.nativeEvent;
    // Snap progress to exact integer after swipe completes.
    scrollProgress.value = position;
    onPageChange(position);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <Animated.View style={animatedContainerStyle}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={activeTab}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
        overdrag={false}
        orientation="horizontal"
        // Android: enable nested scroll so the outer ScrollView still works.
        {...(Platform.OS === "android" ? { nestedScrollEnabled: true } : {})}
      >
        {/* Page 0 — Halal */}
        <View
          key="halal"
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) {
              page0Height.value = height;
            }
          }}
          // collapsable=false ensures Android measures this view correctly.
          collapsable={false}
        >
          {halalContent}
        </View>

        {/* Page 1 — Santé / Health */}
        <View
          key="health"
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) {
              page1Height.value = height;
            }
          }}
          collapsable={false}
        >
          {healthContent}
        </View>
      </PagerView>
    </Animated.View>
  );
});
