/**
 * SectionCard — Standard Card Wrapper for Scan Result Sections
 *
 * Applies the Naqiy Signature surface system:
 * - Light: white bg + lightShadows.card
 * - Dark: translucent rgba(255,255,255,0.04) + gold[800] hairline border + darkShadows.card
 *
 * Section header pattern: [icon 16px] TITLE uppercase      [rightElement]
 *
 * Usage: <SectionCard icon={<Icon />} title="SANTÉ">{content}</SectionCard>
 *
 * @module components/scan/SectionCard
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { gold, lightTheme } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens, fontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { lightShadows, darkShadows } from "@/theme/shadows";
import { letterSpacing } from "./scan-constants";

// ── Types ──

export interface SectionCardProps {
  /** Icon element (16px, same gold color) — rendered left of title */
  icon?: React.ReactNode;
  /** Section title (displayed uppercase) */
  title?: string;
  /** Right-side element (count badge, chip, etc.) */
  rightElement?: React.ReactNode;
  /** Stagger index for entry animation delay */
  staggerIndex?: number;
  /** Card content */
  children: React.ReactNode;
  /** Optional onPress for the whole card */
  onPress?: () => void;
}

// ── springNaqiy for entering animation ──
const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

// ── Component ──

export function SectionCard({
  icon,
  title,
  rightElement,
  staggerIndex = 0,
  children,
}: SectionCardProps) {
  const { isDark } = useTheme();

  const shadowPreset = isDark ? darkShadows.card : lightShadows.card;
  const shadow = Platform.OS === "android"
    ? { elevation: shadowPreset.elevation }
    : shadowPreset;

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : lightTheme.card,
          borderColor: isDark ? gold[800] : "transparent",
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
        shadow,
      ]}
    >
      {/* Section Header */}
      {title && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon}
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? gold[400] : gold[700] },
              ]}
            >
              {title}
            </Text>
          </View>
          {rightElement}
        </View>
      )}

      {/* Card Body */}
      {children}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing["3xl"],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizeTokens.micro,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
});
