/**
 * CertifierLogo — Micro-logo for halal certification bodies.
 *
 * Displays the certifier's logo from local assets (WebP, 120px, ~4-12KB each).
 * Falls back to a styled initials badge when no logo is available.
 *
 * Usage:
 *   <CertifierLogo certifierId="avs-a-votre-service" size={24} />
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image, type ImageSource } from "expo-image";

// ── Static require map for bundler ──────────────────────────
// React Native requires static require() calls — no dynamic paths.
const CERTIFIER_LOGOS: Record<string, ImageSource> = {
  achahada: require("../../../assets/images/certifications/achahada.webp"),
  "acmif-mosquee-d-evry": require("../../../assets/images/certifications/acmif.webp"),
  afcai: require("../../../assets/images/certifications/afcai.webp"),
  altakwa: require("../../../assets/images/certifications/altakwa.webp"),
  "argml-mosquee-de-lyon": require("../../../assets/images/certifications/argml.webp"),
  "avs-a-votre-service": require("../../../assets/images/certifications/avs.webp"),
  "european-halal-trust": require("../../../assets/images/certifications/eht.webp"),
  "halal-correct": require("../../../assets/images/certifications/halal_correct.webp"),
  "halal-monitoring-committee": require("../../../assets/images/certifications/hmc.webp"),
  "islamic-centre-aachen": require("../../../assets/images/certifications/ica.webp"),
  "muslim-conseil-international-mci": require("../../../assets/images/certifications/mci.webp"),
  "sfcvh-mosquee-de-paris": require("../../../assets/images/certifications/sfcvh.webp"),
};

// Short display initials for fallback badge
const CERTIFIER_INITIALS: Record<string, string> = {
  achahada: "AC",
  "acmif-mosquee-d-evry": "ME",
  afcai: "AF",
  alamane: "AL",
  altakwa: "AT",
  "argml-mosquee-de-lyon": "ML",
  arrissala: "AR",
  "avs-a-votre-service": "AVS",
  "european-halal-trust": "EHT",
  "halal-correct": "HC",
  "halal-monitoring-committee": "HMC",
  "halal-polska": "HP",
  "halal-services": "HS",
  "islamic-centre-aachen": "ICA",
  "khalis-halal": "KH",
  "muslim-conseil-international-mci": "MCI",
  "sfcvh-mosquee-de-paris": "MP",
  sidq: "SQ",
};

interface CertifierLogoProps {
  certifierId: string;
  size?: number;
  fallbackColor?: string;
}

export const CertifierLogo = memo(function CertifierLogo({
  certifierId,
  size = 24,
  fallbackColor = "#6B7280",
}: CertifierLogoProps) {
  const logo = CERTIFIER_LOGOS[certifierId];

  if (logo) {
    return (
      <Image
        source={logo}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={150}
      />
    );
  }

  // Fallback: initials badge
  const initials = CERTIFIER_INITIALS[certifierId] ?? certifierId.slice(0, 2).toUpperCase();
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size * 0.25,
          borderColor: fallbackColor,
        },
      ]}
    >
      <Text
        style={[styles.fallbackText, { fontSize, color: fallbackColor }]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  fallbackText: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
