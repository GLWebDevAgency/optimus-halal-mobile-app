/**
 * Optimus Halal Design System — Animation Tokens
 *
 * Pre-configured animation presets compatible with react-native-reanimated v4.
 * These tokens provide consistent motion across the entire application.
 *
 * Usage:
 * ```tsx
 * import Animated from "react-native-reanimated";
 * import { entryAnimations, durations } from "@/theme";
 *
 * <Animated.View entering={entryAnimations.fadeInDown(2)}>
 *   <Text>Staggered content</Text>
 * </Animated.View>
 * ```
 *
 * @module theme/animations
 */

import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  Layout,
  SlideInDown,
  SlideInUp,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

/** Standard duration tokens in milliseconds. */
export const durations = {
  /** 100 ms — micro-interactions, toggles. */
  instant: 100,
  /** 200 ms — button presses, icon changes. */
  fast: 200,
  /** 300 ms — standard transitions, page fades. */
  normal: 300,
  /** 500 ms — deliberate motion, modal reveals. */
  slow: 500,
  /** 800 ms — dramatic entrances, onboarding transitions. */
  dramatic: 800,
} as const;

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

/**
 * Easing presets wrapping Reanimated's `Easing` module.
 * Each is a direct reference — NOT a function call — so they can be
 * passed to `withTiming` config objects.
 */
export const easings = {
  /** Standard deceleration — elements coming to rest. */
  easeOut: Easing.out(Easing.cubic),
  /** Standard acceleration — elements leaving the screen. */
  easeIn: Easing.in(Easing.cubic),
  /** Symmetric — continuous motion, looping animations. */
  easeInOut: Easing.inOut(Easing.cubic),
  /** Snappy overshoot for playful micro-interactions. */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** Linear — progress bars, loaders. */
  linear: Easing.linear,
} as const;

// ---------------------------------------------------------------------------
// Stagger
// ---------------------------------------------------------------------------

/** Default stagger delay between list items (ms). */
export const staggerDelay = 60 as const;

/**
 * Compute the delay for the nth item in a stagger sequence.
 *
 * @param index - Zero-based item index.
 * @param baseDelay - Per-item delay in ms (defaults to `staggerDelay`).
 * @returns Delay in ms.
 */
export const getStaggerDelay = (index: number, baseDelay: number = staggerDelay): number =>
  index * baseDelay;

// ---------------------------------------------------------------------------
// Spring Config
// ---------------------------------------------------------------------------

/** Default spring configuration — responsive yet controlled. */
export const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
} as const;

/** Bouncy spring — onboarding, celebration animations. */
export const springBouncy: WithSpringConfig = {
  damping: 10,
  stiffness: 180,
  mass: 0.8,
  overshootClamping: false,
} as const;

/** Stiff spring — snappy, no overshoot. */
export const springStiff: WithSpringConfig = {
  damping: 20,
  stiffness: 300,
  mass: 1,
  overshootClamping: true,
} as const;

/**
 * The Optimus Spring — our signature motion feel.
 * Responsive yet soft landing — like placing a product on velvet.
 * Use for: card presses, tab switches, sheet reveals, scroll snap.
 */
export const springOptimus: WithSpringConfig = {
  damping: 14,
  stiffness: 170,
  mass: 0.9,
  overshootClamping: false,
} as const;

// ---------------------------------------------------------------------------
// Timing Config Presets
// ---------------------------------------------------------------------------

/** Standard timing config for smooth transitions. */
export const timingNormal: WithTimingConfig = {
  duration: durations.normal,
  easing: easings.easeOut,
} as const;

/** Fast timing config for snappy interactions. */
export const timingFast: WithTimingConfig = {
  duration: durations.fast,
  easing: easings.easeOut,
} as const;

// ---------------------------------------------------------------------------
// Entry Animation Factories
// ---------------------------------------------------------------------------

/**
 * Pre-built layout entry animations using Reanimated's layout animations.
 * Each factory accepts an optional stagger `index` to offset the delay.
 *
 * Usage:
 * ```tsx
 * <Animated.View entering={entryAnimations.fadeIn()} />
 * <Animated.View entering={entryAnimations.fadeInDown(2)} />
 * ```
 */
export const entryAnimations = {
  /** Simple opacity fade. */
  fadeIn: (index = 0) =>
    FadeIn.duration(durations.normal)
      .delay(getStaggerDelay(index))
      .easing(easings.easeOut),

  /** Fade + slide from above (content dropping in). */
  fadeInDown: (index = 0) =>
    FadeInDown.duration(durations.normal)
      .delay(getStaggerDelay(index))
      .easing(easings.easeOut),

  /** Fade + slide from below (content rising up). */
  slideInUp: (index = 0) =>
    FadeInUp.duration(durations.normal)
      .delay(getStaggerDelay(index))
      .easing(easings.easeOut),

  /** Slide from bottom edge (modals, bottom sheets). */
  slideFromBottom: (index = 0) =>
    SlideInDown.duration(durations.slow)
      .delay(getStaggerDelay(index))
      .easing(easings.easeOut),

  /** Slide from top edge (notifications, banners). */
  slideFromTop: (index = 0) =>
    SlideInUp.duration(durations.slow)
      .delay(getStaggerDelay(index))
      .easing(easings.easeOut),

  /** Scale from center (FABs, action confirmations). */
  scaleIn: (index = 0) =>
    ZoomIn.duration(durations.normal)
      .delay(getStaggerDelay(index))
      .easing(easings.overshoot),

  /** Dramatic fade in — slower, for hero/splash elements. */
  dramaticFadeIn: (index = 0) =>
    FadeIn.duration(durations.dramatic)
      .delay(getStaggerDelay(index))
      .easing(easings.easeInOut),
} as const;

// ---------------------------------------------------------------------------
// Exit Animation Factories
// ---------------------------------------------------------------------------

/**
 * Pre-built layout exit animations using Reanimated's layout animations.
 * Each factory accepts an optional stagger `index` to offset the delay.
 *
 * Exit animations use `easings.easeIn` (accelerating away) — the inverse
 * of entries which use `easings.easeOut` (decelerating in).
 *
 * Usage:
 * ```tsx
 * <Animated.View exiting={exitAnimations.fadeOut()} />
 * <Animated.View exiting={exitAnimations.slideOutRight(1)} />
 * ```
 */
export const exitAnimations = {
  /** Simple opacity fade out. */
  fadeOut: (index = 0) =>
    FadeOut.duration(durations.fast).delay(getStaggerDelay(index)).easing(easings.easeIn),

  /** Fade + slide downward (content dropping away). */
  fadeOutDown: (index = 0) =>
    FadeOutDown.duration(durations.normal).delay(getStaggerDelay(index)).easing(easings.easeIn),

  /** Fade + slide upward (content rising away). */
  fadeOutUp: (index = 0) =>
    FadeOutUp.duration(durations.fast).delay(getStaggerDelay(index)).easing(easings.easeIn),

  /** Slide out to right (swipe-to-dismiss, list item removal). */
  slideOutRight: (index = 0) =>
    SlideOutRight.duration(durations.normal).delay(getStaggerDelay(index)).easing(easings.easeIn),

  /** Slide out to left (swipe-to-dismiss). */
  slideOutLeft: (index = 0) =>
    SlideOutLeft.duration(durations.normal).delay(getStaggerDelay(index)).easing(easings.easeIn),

  /** Scale to center (FABs, confirmations disappearing). */
  scaleOut: (index = 0) =>
    ZoomOut.duration(durations.fast).delay(getStaggerDelay(index)).easing(easings.easeIn),
} as const;

// ---------------------------------------------------------------------------
// Layout Transition Presets
// ---------------------------------------------------------------------------

/**
 * Smooth layout transition for list reordering and filter changes.
 * Apply via `layout={layoutTransition}` on Animated.View wrappers.
 * Values match springOptimus (damping:14, stiffness:170, mass:0.9).
 */
export const layoutTransition = Layout.springify()
  .damping(14)
  .stiffness(170)
  .mass(0.9);

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type Durations = typeof durations;
export type DurationKey = keyof Durations;
export type EntryAnimationKey = keyof typeof entryAnimations;
export type ExitAnimationKey = keyof typeof exitAnimations;
