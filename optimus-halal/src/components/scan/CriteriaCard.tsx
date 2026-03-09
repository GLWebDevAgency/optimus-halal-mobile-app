/**
 * CriteriaCard — Pass/fail quality criterion block.
 *
 * Inspired by Yuka's AnalysisItem pattern: a reusable block showing
 * whether a specific quality criterion is met (pass) or not (fail).
 *
 * Used in special product pages (honey: "Origin France" ✓, "Bio" ✗)
 * and qualitative indicators (palm oil free, no sweeteners, etc.).
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { semantic, glass } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { textStyles, fontSize, fontWeight } from "@/theme/typography";

interface CriteriaCardProps {
  title: string;
  description: string;
  pass: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Stagger index for entry animation */
  index?: number;
  /** Expandable children (additional detail) */
  expandable?: boolean;
  children?: React.ReactNode;
}

export const CriteriaCard = React.memo(function CriteriaCard({
  title,
  description,
  pass,
  icon,
  index = 0,
  expandable = false,
  children,
}: CriteriaCardProps) {
  const { isDark, colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const statusColor = pass ? semantic.success.base : semantic.danger.base;
  const bgColor = pass
    ? isDark ? "rgba(34, 197, 94, 0.08)" : "rgba(34, 197, 94, 0.06)"
    : isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.06)";
  const borderColor = pass
    ? isDark ? "rgba(34, 197, 94, 0.20)" : "rgba(34, 197, 94, 0.15)"
    : isDark ? "rgba(239, 68, 68, 0.20)" : "rgba(239, 68, 68, 0.15)";

  const content = (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
      ]}
    >
      <View style={styles.row}>
        {/* Status icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${statusColor}20` }]}>
          <MaterialIcons name={icon} size={16} color={statusColor} />
        </View>

        {/* Text content */}
        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Pass/fail indicator */}
        <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
          <MaterialIcons
            name={pass ? "check-circle" : "cancel"}
            size={18}
            color={statusColor}
          />
        </View>

        {/* Expand chevron */}
        {expandable && (
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={20}
            color={colors.textMuted}
            style={styles.chevron}
          />
        )}
      </View>

      {/* Expanded content */}
      {expandable && expanded && children && (
        <View style={[styles.expandedContent, { borderTopColor: borderColor }]}>
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (expandable) {
    return (
      <Pressable
        onPress={() => setExpanded((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  description: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  expandedContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});

export default CriteriaCard;
