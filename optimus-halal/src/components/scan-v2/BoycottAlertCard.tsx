/**
 * BoycottAlertCard — Boycott warning card.
 *
 * Always visible regardless of premium tier.
 * Shows brand boycott info with source and reason.
 *
 * @module components/scan-v2/BoycottAlertCard
 */

import React from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus } from "@/theme/colors";
import { Prohibit, ArrowSquareOut } from "phosphor-react-native";
import type { BoycottAlertData } from "./scan-v2-types";

interface BoycottAlertCardProps {
  data: BoycottAlertData;
}

export const BoycottAlertCard: React.FC<BoycottAlertCardProps> = ({ data }) => {
  const { isDark, colors } = useTheme();

  const handleSourcePress = () => {
    if (data.sourceUrl) {
      Linking.openURL(data.sourceUrl);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(60).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? halalStatus.haram.bgDark
              : halalStatus.haram.bg,
            borderLeftColor: halalStatus.haram.base,
          },
        ]}
      >
        <View style={styles.header}>
          <Prohibit size={22} color={halalStatus.haram.base} weight="fill" />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: halalStatus.haram.base }]}>
              Boycott
            </Text>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>
              {data.brandName}
            </Text>
          </View>
        </View>

        <Text style={[styles.reason, { color: colors.textSecondary }]}>
          {data.reason}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.sourceLabel, { color: colors.textMuted }]}>
            Source: {data.source}
          </Text>
          {data.sourceUrl && (
            <Pressable
              onPress={handleSourcePress}
              accessibilityLabel="Voir la source du boycott"
              accessibilityRole="link"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <ArrowSquareOut size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderLeftWidth: 3,
    padding: spacing["3xl"],
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: headingFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandName: {
    fontFamily: headingFontFamily.bold,
    fontSize: 16,
    fontWeight: "700",
  },
  reason: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourceLabel: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
    fontStyle: "italic",
  },
});

export default BoycottAlertCard;
