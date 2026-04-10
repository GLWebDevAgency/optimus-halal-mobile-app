/**
 * SubstanceSignalRow — Single substance signal row.
 *
 * Tappable row showing a detected substance with score, verdict,
 * and fatwa count. Opens SubstanceDetailSheet on press.
 * Free users see a lock overlay instead of full details.
 *
 * Design: Stitch "analyzed-mashbooh" signal rows — icon + name + score,
 * with subtle background shift, no borders.
 *
 * @module components/scan-v2/SubstanceSignalRow
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { Lock, CaretRight, Bug, Wine, PawPrint, Flask, Gear, Question } from "phosphor-react-native";
import type { ModuleVerdictV2, SubstanceIcon } from "./scan-v2-types";
import { getVerdictColor, scoreToVerdictLevel } from "./scan-v2-utils";

const ICON_MAP: Record<SubstanceIcon, React.FC<any>> = {
  insect: Bug,
  alcohol: Wine,
  animal: PawPrint,
  enzyme: Flask,
  process: Gear,
  source: Question,
  other: Question,
};

interface SubstanceSignalRowProps {
  signal: ModuleVerdictV2;
  index: number;
  isPremium: boolean;
  onPress: (signal: ModuleVerdictV2) => void;
}

export const SubstanceSignalRow: React.FC<SubstanceSignalRowProps> = ({
  signal,
  index,
  isPremium,
  onPress,
}) => {
  const { isDark, colors } = useTheme();
  const level = scoreToVerdictLevel(signal.score);
  const accentColor = getVerdictColor(level);
  const IconComponent = ICON_MAP[signal.icon] || Question;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60)
        .springify()
        .damping(14)
        .stiffness(170)
        .mass(0.9)}
    >
      <Pressable
        onPress={() => onPress(signal)}
        accessibilityLabel={`${signal.displayName}, score ${signal.score}. ${isPremium ? "Appuyer pour les details" : "Premium requis"}`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : colors.card,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${accentColor}15` },
          ]}
        >
          <IconComponent size={20} color={accentColor} weight="fill" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {signal.displayName}
            </Text>
            {isPremium ? (
              <Text style={[styles.score, { color: accentColor }]}>
                Score {signal.score}
              </Text>
            ) : (
              <Lock size={14} color={colors.textMuted} weight="fill" />
            )}
          </View>

          {isPremium ? (
            <View style={styles.bottomRow}>
              <Text
                style={[styles.rationale, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {signal.rationaleFr}
              </Text>
              {signal.fatwaCount > 0 && (
                <>
                  <Text style={[styles.separator, { color: colors.textMuted }]}>
                    |
                  </Text>
                  <Text style={[styles.fatwaCount, { color: colors.textSecondary }]}>
                    {signal.fatwaCount} fatwas
                  </Text>
                </>
              )}
            </View>
          ) : (
            <Text style={[styles.lockedHint, { color: colors.textMuted }]}>
              Details disponibles avec Naqiy+
            </Text>
          )}
        </View>

        {/* Chevron */}
        <CaretRight size={16} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontFamily: headingFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginRight: spacing.md,
  },
  score: {
    fontFamily: headingFontFamily.bold,
    fontSize: 13,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rationale: {
    ...textStyles.caption,
    flex: 1,
  },
  separator: {
    fontSize: 10,
    opacity: 0.3,
  },
  fatwaCount: {
    ...textStyles.caption,
    flexShrink: 0,
  },
  lockedHint: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
    fontStyle: "italic",
  },
});

export default SubstanceSignalRow;
