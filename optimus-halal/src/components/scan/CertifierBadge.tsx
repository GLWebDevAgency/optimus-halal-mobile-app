/**
 * CertifierBadge — Reusable certifier display (compact/extended).
 *
 * Two variants:
 *  - "extended": hero card style with background, full name subtitle, score "/100"
 *  - "compact": inline row, no background, no subtitle, no "/100" suffix
 *
 * @module components/scan/CertifierBadge
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { getTrustScoreColor } from "@/theme/colors";
import type { CertifierInfo } from "./scan-types";

// ── Types ──

export interface CertifierBadgeProps {
  certifier: CertifierInfo;
  size: "compact" | "extended";
}

// ── Component ──

export function CertifierBadge({ certifier, size }: CertifierBadgeProps) {
  const { isDark, colors } = useTheme();

  const scoreColor = getTrustScoreColor(certifier.trustScore);
  // Micro-logo background: score color at 20% opacity
  const logoBgColor = `${scoreColor}33`; // hex 33 ≈ 20% opacity

  const isExtended = size === "extended";

  const logoSize = isExtended ? 28 : 14;
  const logoRadius = isExtended ? 6 : 3;
  const dotSize = isExtended ? 6 : 5;
  const nameSize = isExtended ? 13 : 9;
  const scoreSize = isExtended ? 13 : 9;
  const subtitleSize = 10;

  return (
    <View
      style={[
        styles.container,
        isExtended && [
          styles.extendedContainer,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)",
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
        ],
      ]}
      accessibilityLabel={`${certifier.shortName}, score de confiance ${certifier.trustScore} sur 100`}
      accessibilityRole="text"
    >
      {/* Micro-logo */}
      <View
        style={[
          styles.logoContainer,
          {
            width: logoSize,
            height: logoSize,
            borderRadius: logoRadius,
            backgroundColor: logoBgColor,
          },
        ]}
      >
        {certifier.logoUrl ? (
          <Image
            source={{ uri: certifier.logoUrl }}
            style={{ width: logoSize, height: logoSize, borderRadius: logoRadius }}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <Text
            style={[
              styles.logoInitial,
              { fontSize: isExtended ? 12 : 6, color: scoreColor },
            ]}
            numberOfLines={1}
          >
            {(certifier.shortName ?? certifier.name).charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* Name + subtitle */}
      <View style={styles.nameStack}>
        <Text
          style={[
            styles.nameText,
            { fontSize: nameSize, color: colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {certifier.shortName}
        </Text>
        {isExtended && (
          <Text
            style={[
              styles.subtitleText,
              { fontSize: subtitleSize, color: colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {certifier.name}
          </Text>
        )}
      </View>

      {/* Score badge */}
      <View
        style={[
          styles.scoreBadge,
          !isExtended && styles.scoreBadgeCompact,
        ]}
      >
        <View
          style={[
            styles.scoreDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: scoreColor,
            },
          ]}
        />
        <Text
          style={[
            styles.scoreText,
            { fontSize: scoreSize, color: scoreColor },
          ]}
        >
          {certifier.trustScore}
          {isExtended && (
            <Text style={[styles.scoreMuted, { color: colors.textMuted }]}>
              /100
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  extendedContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoInitial: {
    fontWeight: "700",
  },
  nameStack: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontWeight: "700",
  },
  subtitleText: {
    fontWeight: "400",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreBadgeCompact: {
    marginLeft: "auto",
  },
  scoreDot: {
    // width/height/borderRadius set inline
  },
  scoreText: {
    fontWeight: "700",
  },
  scoreMuted: {
    fontWeight: "400",
  },
});
