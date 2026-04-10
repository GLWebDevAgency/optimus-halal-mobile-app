/**
 * MadhabChip — Madhab selector pill.
 *
 * Tappable pill showing the active madhab with a dropdown indicator.
 * Always visible regardless of premium tier.
 *
 * @module components/scan-v2/MadhabChip
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { CaretDown, Scales } from "phosphor-react-native";
import type { MadhabId } from "./scan-v2-types";

const MADHAB_LABELS: Record<MadhabId, string> = {
  general: "General",
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

interface MadhabChipProps {
  madhab: MadhabId;
  onPress: () => void;
}

export const MadhabChip: React.FC<MadhabChipProps> = ({ madhab, onPress }) => {
  const { isDark, colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Madhab actif: ${MADHAB_LABELS[madhab]}. Appuyer pour changer.`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? colors.backgroundSecondary : colors.card,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Scales size={18} color={colors.primary} weight="fill" />
      <View style={styles.textContainer}>
        <Text style={[styles.madhabName, { color: colors.textPrimary }]}>
          {MADHAB_LABELS[madhab]}
        </Text>
        <CaretDown size={12} color={colors.textSecondary} weight="bold" />
      </View>
      <Text style={[styles.activeLabel, { color: colors.primary }]}>
        Madhab actif
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  madhabName: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  activeLabel: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 11,
    fontWeight: "500",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
});

export default MadhabChip;
