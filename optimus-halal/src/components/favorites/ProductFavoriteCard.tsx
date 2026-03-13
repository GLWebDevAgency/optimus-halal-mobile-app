/**
 * ProductFavoriteCard — Premium redesigned product card for favorites grid.
 *
 * Shows: product image, halal StatusPill, TrustRing mini, certifier badge,
 * product name, brand, and action buttons (view + re-scan).
 */

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { BarcodeIcon, EyeIcon, HeartIcon, PackageIcon, SealCheckIcon } from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { PressableScale } from "@/components/ui/PressableScale";
import { StatusPill } from "@/components/ui/StatusPill";
import { TrustRing } from "@/components/ui/TrustRing";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { halalStatus as statusColors, brand, neutral } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ProductFavoriteCardProps {
  product: {
    id: string;
    barcode: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    halalStatus: string | null;
    category: string | null;
    confidenceScore: number | null;
    certifierName: string | null;
    certifierLogo: string | null;
  };
  index: number;
  onRemove: (productId: string) => void;
}

export const ProductFavoriteCard = React.memo(function ProductFavoriteCard({
  product,
  index,
  onRemove,
}: ProductFavoriteCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, selection } = useHaptics();
  const router = useRouter();

  const halalStatusKey = (product.halalStatus ?? "unknown") as "halal" | "haram" | "doubtful" | "unknown";
  const score = product.confidenceScore ?? 0;
  const hasScore = score > 0;
  const hasCertifier = !!product.certifierName;

  const handleView = () => {
    impact();
    router.push(`/scan-result?barcode=${product.barcode}&viewOnly=1`);
  };

  const handleRescan = () => {
    impact();
    router.push("/(tabs)/scanner");
  };

  const handleRemove = () => {
    selection();
    onRemove(product.id);
  };

  const scoreColor =
    score >= 70 ? statusColors.halal.base : score >= 40 ? statusColors.doubtful.base : statusColors.haram.base;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(350).springify()}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      {/* Image + HeartIcon + Certifier overlay */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: isDark ? "#1f1f1f" : "#f0ede8" }]}>
            <PackageIcon size={28} color={colors.textMuted} />
          </View>
        )}

        {/* Unfavorite button */}
        <PressableScale
          onPress={handleRemove}
          style={styles.heartBtn}
          accessibilityLabel={t.favorites.removeConfirm}
        >
          <View style={[styles.heartCircle, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
            <HeartIcon size={16} color="#ef4444" />
          </View>
        </PressableScale>

        {/* Certifier badge overlay */}
        {hasCertifier && (
          <View style={[styles.certifierOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)" }]}>
            {product.certifierLogo ? (
              <Image
                source={{ uri: product.certifierLogo }}
                style={styles.certifierLogo}
                contentFit="contain"
              />
            ) : (
              <SealCheckIcon size={12} color={brand.primary} />
            )}
            <Text
              style={[styles.certifierText, { color: isDark ? "#fff" : colors.textSecondary }]}
              numberOfLines={1}
            >
              {product.certifierName}
            </Text>
          </View>
        )}
      </View>

      {/* Info section */}
      <View style={styles.info}>
        {/* Status + Score row */}
        <View style={styles.statusRow}>
          <StatusPill status={halalStatusKey} size="sm" animated={false} />
          {hasScore && (
            <View style={styles.scoreInline}>
              <TrustRing score={score} size={24} strokeWidth={2.5} color={scoreColor} />
              <Text style={[styles.scoreText, { color: scoreColor }]}>{Math.round(score)}</Text>
            </View>
          )}
        </View>

        {/* Product name */}
        <Text
          style={[styles.name, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>

        {/* Brand */}
        <Text
          style={[styles.brand, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {product.brand || t.favorites.unknownBrand}
        </Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <PressableScale
            onPress={handleView}
            style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}
            accessibilityLabel={t.scanResult.title ?? "View"}
          >
            <EyeIcon size={16} color={colors.textSecondary} />
          </PressableScale>

          <PressableScale
            onPress={handleRescan}
            style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}
            accessibilityLabel={t.favorites.scanProduct}
          >
            <BarcodeIcon size={16} color={colors.textSecondary} />
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  heartCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  certifierOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: "80%",
  },
  certifierLogo: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  certifierText: {
    fontSize: 10,
    fontWeight: "600",
  },
  info: {
    padding: 10,
    gap: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  scoreInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "800",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  brand: {
    fontSize: 11,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
