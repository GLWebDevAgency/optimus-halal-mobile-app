/**
 * AlternativeProductCard — Compact card for alternative halal products.
 *
 * Displays product image, name, brand, halal badge, NutriScore letter,
 * and NOVA group. Wraps with PressableScale for tap navigation.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { CaretRightIcon, Image as ImageIcon, QuestionIcon, SealCheckIcon, StarIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "@/components/ui/PressableScale";
import { semantic, glass } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// NutriScore letter → color map
const NUTRI_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

// NOVA group → label
const NOVA_LABELS: Record<number, string> = {
  1: "NOVA 1",
  2: "NOVA 2",
  3: "NOVA 3",
  4: "NOVA 4",
};

interface AlternativeProductCardProps {
  id: string;
  barcode: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string | null;
  confidenceScore: number | null;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
  /** Is this a better choice than the current product? */
  isBetterChoice?: boolean;
  betterChoiceLabel?: string;
  /** i18n labels for halal status badges */
  halalLabel?: string;
  doubtfulLabel?: string;
  index?: number;
  onPress?: (id: string, barcode: string | null) => void;
}

export const AlternativeProductCard = React.memo(function AlternativeProductCard({
  id,
  barcode,
  name,
  brand,
  imageUrl,
  halalStatus,
  nutriscoreGrade,
  novaGroup,
  isBetterChoice,
  betterChoiceLabel,
  halalLabel = "Halal",
  doubtfulLabel = "Douteux",
  index = 0,
  onPress,
}: AlternativeProductCardProps) {
  const { isDark, colors } = useTheme();

  const nutriColor = nutriscoreGrade
    ? NUTRI_COLORS[nutriscoreGrade.toLowerCase()] ?? colors.textMuted
    : null;

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(300)}>
      <PressableScale
        onPress={() => onPress?.(id, barcode)}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
            borderColor: isDark ? glass.dark.border : glass.light.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={name ?? "Product"}
      >
        {/* Better choice ribbon */}
        {isBetterChoice && (
          <View style={styles.ribbon}>
            <StarIcon size={10} color="#fff" />
            <Text style={styles.ribbonText}>{betterChoiceLabel ?? "Better choice"}</Text>
          </View>
        )}

        <View style={styles.row}>
          {/* Product image */}
          <View style={[styles.imageContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <ImageIcon size={28} color={colors.textMuted} />
            )}
          </View>

          {/* Text content */}
          <View style={styles.textColumn}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
              {name ?? "Produit"}
            </Text>
            {brand && (
              <Text style={[styles.brand, { color: colors.textSecondary }]} numberOfLines={1}>
                {brand}
              </Text>
            )}

            {/* Badges row */}
            <View style={styles.badges}>
              {/* Halal badge — dynamic based on actual status */}
              {halalStatus === "halal" && (
                <View style={[styles.badge, { backgroundColor: `${semantic.success.base}18` }]}>
                  <SealCheckIcon size={11} color={semantic.success.base} />
                  <Text style={[styles.badgeText, { color: semantic.success.base }]}>{halalLabel}</Text>
                </View>
              )}
              {halalStatus === "doubtful" && (
                <View style={[styles.badge, { backgroundColor: `${semantic.warning.base}18` }]}>
                  <QuestionIcon size={11} color={semantic.warning.base} />
                  <Text style={[styles.badgeText, { color: semantic.warning.base }]}>{doubtfulLabel}</Text>
                </View>
              )}

              {/* NutriScore badge */}
              {nutriscoreGrade && nutriColor && (
                <View style={[styles.badge, { backgroundColor: `${nutriColor}18` }]}>
                  <Text style={[styles.badgeText, { color: nutriColor, fontWeight: "700" }]}>
                    {nutriscoreGrade.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* NOVA badge */}
              {novaGroup != null && (
                <View style={[styles.badge, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {NOVA_LABELS[novaGroup] ?? `NOVA ${novaGroup}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Arrow */}
          <CaretRightIcon size={20} color={colors.textMuted} />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: semantic.success.base,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderBottomLeftRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    zIndex: 1,
  },
  ribbonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.lg,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: 56,
    height: 56,
  },
  textColumn: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  brand: {
    fontSize: fontSize.caption,
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default AlternativeProductCard;
