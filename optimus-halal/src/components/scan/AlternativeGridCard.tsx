/**
 * AlternativeGridCard — Compact card for 2-column alternatives grid.
 *
 * Displays a product alternative with image, name, brand, certifier badge,
 * health score ring, and price. Designed for a tight 2-column grid layout.
 *
 * @module components/scan/AlternativeGridCard
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { gold } from "@/theme/colors";
import { ScoreRing } from "./ScoreRing";
import { CertifierBadge } from "./CertifierBadge";
import type { AlternativeProductUI } from "./scan-types";

// ── Types ──

export interface AlternativeGridCardProps {
  alternative: AlternativeProductUI;
  onPress: (barcode: string) => void;
}

// ── Component ──

export function AlternativeGridCard({ alternative, onPress }: AlternativeGridCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={() => onPress(alternative.barcode)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${alternative.name}, ${alternative.brand}`}
    >
      {/* Product image */}
      <Image
        source={alternative.imageUrl ? { uri: alternative.imageUrl } : null}
        style={[
          styles.image,
          { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
        ]}
        contentFit="cover"
        transition={200}
      />

      {/* Product name */}
      <Text
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {alternative.name}
      </Text>

      {/* Brand */}
      <Text
        style={[styles.brand, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {alternative.brand}
      </Text>

      {/* Certifier badge — hidden if null */}
      {alternative.certifier && (
        <View style={styles.certifierWrapper}>
          <CertifierBadge certifier={alternative.certifier} size="compact" />
        </View>
      )}

      {/* Bottom row: ScoreRing left, Price right */}
      <View style={styles.bottomRow}>
        <ScoreRing score={alternative.healthScore} size={20} strokeWidth={2} animated={false} />

        {alternative.price != null && (
          <Text style={styles.price}>
            {alternative.price.toFixed(2)} €
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: "100%",
    height: 56,
    borderRadius: 10,
    marginBottom: 2,
  },
  name: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  brand: {
    fontSize: 10,
    fontWeight: "400",
  },
  certifierWrapper: {
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: {
    fontSize: 11,
    fontWeight: "600",
    color: gold[400],
  },
});
