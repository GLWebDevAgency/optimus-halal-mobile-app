/**
 * NovaDetailContent — Displays NOVA classification details.
 *
 * Shows big group number, 4-level classification list with current
 * group highlighted. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Props {
  group: number;
  label: string;
}

// ── NOVA classification ──────────────────────────────

const NOVA_GROUPS = [
  { group: 1, color: "#22c55e", label: "Aliments non transformés ou peu transformés" },
  { group: 2, color: "#84cc16", label: "Ingrédients culinaires transformés" },
  { group: 3, color: "#f97316", label: "Aliments transformés" },
  { group: 4, color: "#ef4444", label: "Produits ultra-transformés" },
] as const;

// ── Component ────────────────────────────────────────

export const NovaDetailContent = React.memo(function NovaDetailContent({
  group,
  label,
}: Props) {
  const { isDark, colors } = useTheme();
  const activeNova = NOVA_GROUPS.find((n) => n.group === group) ?? NOVA_GROUPS[3];

  return (
    <View style={styles.container}>
      {/* Big group number */}
      <View style={styles.heroSection}>
        <Text style={[styles.groupNumber, { color: activeNova.color }]}>
          {group}
        </Text>
        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>

      {/* 4-level list */}
      <View style={styles.levelList}>
        {NOVA_GROUPS.map((nova) => {
          const isActive = nova.group === group;
          return (
            <View
              key={nova.group}
              style={[
                styles.levelRow,
                {
                  backgroundColor: isActive
                    ? `${nova.color}18`
                    : isDark
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.02)",
                  borderColor: isActive
                    ? `${nova.color}40`
                    : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <View style={[styles.levelNumber, { backgroundColor: nova.color }]}>
                <Text style={styles.levelNumberText}>{nova.group}</Text>
              </View>
              <Text
                style={[
                  styles.levelLabel,
                  {
                    color: isActive ? colors.textPrimary : colors.textMuted,
                    fontWeight: isActive ? fontWeight.semiBold : fontWeight.regular,
                  },
                ]}
                numberOfLines={2}
              >
                {nova.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Info note */}
      <View style={[styles.noteBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.noteText, { color: colors.textMuted }]}>
          Classification NOVA développée par l'Université de São Paulo.
          Les produits ultra-transformés sont associés à un risque accru
          de maladies chroniques.
        </Text>
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    gap: spacing.xs,
  },
  groupNumber: {
    fontSize: 48,
    fontWeight: fontWeight.black,
  },
  groupLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  levelList: {
    gap: spacing.md,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  levelNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumberText: {
    color: "#ffffff",
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  levelLabel: {
    flex: 1,
    fontSize: fontSize.bodySmall,
    lineHeight: 20,
  },
  noteBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noteText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
