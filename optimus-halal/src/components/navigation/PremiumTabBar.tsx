/**
 * Ultra Premium Tab Bar Component
 * 
 * Inspiré des meilleures apps mondiales:
 * - Apple Music: Glassmorphism + animations fluides
 * - Spotify: Indicateur sliding animé
 * - Revolut/N26: Design épuré premium
 * - Linear: Micro-interactions sophistiquées
 * - Instagram: Feedback visuel instantané
 */

import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  cancelAnimation,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";

import { brand } from "@/theme/colors";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TabConfig {
  name: string;
  navKey: "home" | "map" | "scanner" | "marketplace" | "profile";
  iconOutline: keyof typeof MaterialIcons.glyphMap;
  iconFilled: keyof typeof MaterialIcons.glyphMap;
  isCenter?: boolean;
}

const TABS: TabConfig[] = [
  { name: "index", navKey: "home", iconOutline: "home", iconFilled: "home" },
  { name: "map", navKey: "map", iconOutline: "explore", iconFilled: "explore" },
  { name: "scanner", navKey: "scanner", iconOutline: "qr-code-scanner", iconFilled: "qr-code-scanner", isCenter: true },
  { name: "marketplace", navKey: "marketplace", iconOutline: "storefront", iconFilled: "storefront" },
  { name: "profile", navKey: "profile", iconOutline: "person-outline", iconFilled: "person" },
];

// Composant pour l'effet de lueur radiale
function GlowEffect({ color, size, opacity }: { color: string; size: number; opacity: number }) {
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow)" />
    </Svg>
  );
}

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
  index: number;
  totalTabs: number;
}

function TabItem({ tab, isActive, onPress, badge, index }: TabItemProps) {
  const { isDark } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  
  // Animation values
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const labelOpacity = useSharedValue(isActive ? 1 : 0);
  const glowOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (isActive) {
      translateY.value = withSpring(-4, { damping: 12, stiffness: 180 });
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      labelOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      iconScale.value = withSpring(1);
      labelOpacity.value = withTiming(0, { duration: 150 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive]);

  const triggerRipple = useCallback(() => {
    rippleScale.value = 0;
    rippleOpacity.value = 0.4;
    rippleScale.value = withTiming(1.5, { duration: 400, easing: Easing.out(Easing.cubic) });
    rippleOpacity.value = withDelay(100, withTiming(0, { duration: 300 }));
  }, []);

  const handlePress = useCallback(async () => {
    impact();
    triggerRipple();
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    onPress();
  }, [onPress, triggerRipple]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      { translateY: interpolate(labelOpacity.value, [0, 1], [4, 0]) },
      { scale: interpolate(labelOpacity.value, [0, 1], [0.8, 1]) },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.5, 1]) }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const activeColor = brand.primary;
  const inactiveColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";
  const currentColor = isActive ? activeColor : inactiveColor;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      activeOpacity={1}
      style={[styles.tabItem, animatedContainerStyle]}
    >
      {/* Ripple Effect */}
      <Animated.View style={[styles.ripple, animatedRippleStyle]}>
        <View style={[styles.rippleInner, { backgroundColor: activeColor }]} />
      </Animated.View>

      {/* Glow Effect behind icon */}
      <Animated.View style={[styles.iconGlow, animatedGlowStyle]}>
        <GlowEffect color={activeColor} size={48} opacity={0.4} />
      </Animated.View>

      {/* Icon Container */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <MaterialIcons
          name={isActive ? tab.iconFilled : tab.iconOutline}
          size={26}
          color={currentColor}
        />
        {badge && badge > 0 ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.badge}>
            <LinearGradient
              colors={["#ff6b6b", "#ee5253"]}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </LinearGradient>
          </Animated.View>
        ) : null}
      </Animated.View>

      {/* Animated Label */}
      <Animated.Text style={[styles.tabLabel, { color: currentColor }, animatedLabelStyle]}>
        {t.nav[tab.navKey]}
      </Animated.Text>
    </AnimatedTouchable>
  );
}

interface CenterButtonProps {
  isActive: boolean;
  onPress: () => void;
}

function CenterScannerButton({ isActive, onPress }: CenterButtonProps) {
  const { isDark } = useTheme();
  const { notification } = useHaptics();
  const { t } = useTranslation();
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const pulseScale = useSharedValue(1);
  const innerGlow = useSharedValue(0);
  
  // Continuous pulse animation (withRepeat on UI thread, no setInterval)
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 1200 }),
        withTiming(0.15, { duration: 1200 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(glowOpacity);
    };
  }, []);

  // Scanning animation when active
  useEffect(() => {
    if (isActive) {
      innerGlow.value = withTiming(1, { duration: 300 });
      rotation.value = withSequence(
        withTiming(360, { duration: 2000, easing: Easing.linear })
      );
    } else {
      innerGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const handlePress = useCallback(async () => {
    notification();
    scale.value = withSequence(
      withSpring(0.85, { damping: 8, stiffness: 400 }),
      withSpring(1.1, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    glowScale.value = withSequence(
      withSpring(1.5, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    onPress();
  }, [onPress]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedOuterGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * glowScale.value }],
  }));

  const animatedInnerRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(innerGlow.value, [0, 1], [0, 0.8]),
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.centerButtonWrapper}>
      {/* Multiple glow layers for depth - pointerEvents none to allow touch through */}
      <Animated.View style={[styles.outerGlow, animatedOuterGlowStyle]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(19, 236, 106, 0.25)", "rgba(19, 236, 106, 0)"]}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* Animated ring when active - pointerEvents none */}
      <Animated.View style={[styles.scanningRing, animatedInnerRingStyle]} pointerEvents="none">
        <LinearGradient
          colors={["transparent", brand.primary, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanningRingGradient}
        />
      </Animated.View>

      {/* Outer ring - pointerEvents none */}
      <View 
        style={[
          styles.buttonRing,
          { 
            borderColor: isDark ? "rgba(16,34,23,0.8)" : "rgba(255,255,255,0.9)",
            shadowColor: isDark ? "#000" : brand.primary,
          }
        ]} 
        pointerEvents="none"
      />

      {/* Main Button - This is the touchable element */}
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t.nav.scanner}
        style={[styles.centerButton, animatedButtonStyle, { zIndex: 10 }]}
      >
        {/* Glass effect background */}
        <View style={styles.centerButtonInner}>
          <LinearGradient
            colors={isDark 
              ? ["rgba(255,255,255,0.95)", "rgba(240,255,245,0.9)"]
              : ["#0d1b13", "#152a1c"]
            }
            style={styles.centerButtonGradient}
          >
            {/* Inner highlight */}
            <View style={[styles.innerHighlight, { opacity: isDark ? 0.1 : 0.15 }]} />
            
            {/* Icon with subtle shadow */}
            <View style={styles.iconShadow}>
              <MaterialIcons
                name="qr-code-scanner"
                size={30}
                color={isDark ? "#0d1b13" : brand.primary}
              />
            </View>
          </LinearGradient>
        </View>
      </AnimatedTouchable>

      {/* Label below */}
      <Animated.Text
        style={[
          styles.centerLabel,
          { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)" }
        ]}
      >
        {t.nav.scanner}
      </Animated.Text>
    </View>
  );
}

export function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const currentRouteName = state.routes[state.index]?.name;

  // Animated border glow
  const borderGlow = useSharedValue(0);
  
  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(borderGlow);
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(borderGlow.value, [0, 1], [0.3, 0.6]),
  }));

  const handleTabPress = useCallback((routeName: string) => {
    // Find the route key for proper event targeting
    const route = state.routes.find(r => r.name === routeName);
    const event = navigation.emit({
      type: "tabPress",
      target: route?.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }, [navigation, state.routes]);

  const leftTabs = TABS.filter(t => !t.isCenter).slice(0, 2);
  const centerTab = TABS.find(t => t.isCenter);
  const rightTabs = TABS.filter(t => !t.isCenter).slice(2);
  const totalNonCenterTabs = leftTabs.length + rightTabs.length;

  // Hide TabBar when on Scanner screen
  if (currentRouteName === "scanner") {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Glassmorphism background */}
      <BlurView
        intensity={isDark ? 60 : 90}
        tint={isDark ? "dark" : "light"}
        style={styles.blurContainer}
      />
      
      {/* Background overlay with gradient */}
      <View style={[
        styles.backgroundContainer,
        { 
          backgroundColor: isDark 
            ? "rgba(10, 20, 14, 0.85)" 
            : "rgba(255, 255, 255, 0.85)",
        }
      ]}>
        {/* Animated top border glow */}
        <Animated.View style={[styles.topBorderGlow, animatedBorderStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              brand.primary + "40",
              brand.primary + "80",
              brand.primary + "40",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGradientLine}
          />
        </Animated.View>

        {/* Subtle inner shadow */}
        <LinearGradient
          colors={[
            isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
            "transparent",
          ]}
          style={styles.innerShadow}
        />
      </View>

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {leftTabs.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={currentRouteName === tab.name}
            onPress={() => handleTabPress(tab.name)}
            index={index}
            totalTabs={totalNonCenterTabs}
          />
        ))}
        
        {centerTab && (
          <CenterScannerButton
            isActive={currentRouteName === centerTab.name}
            onPress={() => handleTabPress(centerTab.name)}
          />
        )}
        
        {rightTabs.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={currentRouteName === tab.name}
            onPress={() => handleTabPress(tab.name)}
            index={index + leftTabs.length}
            totalTabs={totalNonCenterTabs}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 28,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  topBorderGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  topGradientLine: {
    flex: 1,
  },
  innerShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minHeight: 56,
    position: "relative",
  },
  ripple: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rippleInner: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  iconGlow: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
  },
  badgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  centerButtonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -36,
    width: 80,
  },
  outerGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -10,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  scanningRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    top: -2,
  },
  scanningRingGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#13ec6a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  centerButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    overflow: "hidden",
  },
  centerButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  innerHighlight: {
    position: "absolute",
    top: 2,
    left: 8,
    right: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  iconShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  buttonRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    top: -4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 0.3,
  },
});

export default PremiumTabBar;
