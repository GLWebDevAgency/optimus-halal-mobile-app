/**
 * AlternativesRail — Horizontal alternatives carousel.
 *
 * Shows alternative halal products in a horizontal scroll.
 * Uses FlashList for performance.
 *
 * Design: Stitch "Safe Alternatives" section — cards with image,
 * certifier label, name, and score.
 *
 * @module components/scan-v2/AlternativesRail
 */

import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { CheckCircle } from "phosphor-react-native";
import type { AlternativeProductV2 } from "./scan-v2-types";
import { getVerdictColor, scoreToVerdictLevel } from "./scan-v2-utils";

const CARD_WIDTH = 160;

interface AlternativesRailProps {
  alternatives: AlternativeProductV2[];
  onProductPress: (barcode: string) => void;
}

export const AlternativesRail: React.FC<AlternativesRailProps> = ({
  alternatives,
  onProductPress,
}) => {
  const { isDark, colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: AlternativeProductV2 }) => {
      const level = scoreToVerdictLevel(item.score);
      const accentColor = getVerdictColor(level);

      return (
        <Pressable
          onPress={() => onProductPress(item.barcode)}
          accessibilityLabel={`Alternative: ${item.name} par ${item.brand}, score ${item.score}`}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.card,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
                ]}
              />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            {item.certifierName && (
              <Text
                style={[styles.certifierLabel, { color: colors.primary }]}
                numberOfLines={1}
              >
                {item.certifierName}
              </Text>
            )}
            <Text
              style={[styles.productName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.scoreRow}>
              <CheckCircle size={12} color={accentColor} weight="fill" />
              <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
                Score {item.score}/100
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [isDark, colors, onProductPress]
  );

  if (alternatives.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(300).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Alternatives certifiees
        </Text>

        <FlashList
          data={alternatives}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: spacing.lg }} />}
          keyExtractor={(item) => item.barcode}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h4,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  imageContainer: {
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
  },
  info: {
    gap: spacing.xs,
  },
  certifierLabel: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  productName: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 13,
    fontWeight: "600",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scoreText: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 10,
  },
});

export default AlternativesRail;
