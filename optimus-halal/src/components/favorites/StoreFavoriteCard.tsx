/**
 * StoreFavoriteCard — Full-width card for favorite stores.
 *
 * Shows: store image/logo, name, type with colored icon, certifier badge,
 * star rating, city, and action buttons (directions, call, unfavorite).
 */

import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { brand, neutral } from "@/theme/colors";

const STORE_TYPE_CONFIG: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string; label: string }> = {
  butcher: { icon: "restaurant", color: "#ef4444", label: "Boucherie" },
  restaurant: { icon: "restaurant-menu", color: "#f97316", label: "Restaurant" },
  supermarket: { icon: "shopping-cart", color: "#3b82f6", label: "Supermarché" },
  bakery: { icon: "bakery-dining", color: "#d4af37", label: "Boulangerie" },
  wholesaler: { icon: "warehouse", color: "#8b5cf6", label: "Grossiste" },
  abattoir: { icon: "factory", color: "#6b7280", label: "Abattoir" },
  online: { icon: "language", color: "#06b6d4", label: "En ligne" },
  other: { icon: "store", color: "#6b7280", label: "Autre" },
};

const CERTIFIER_LABELS: Record<string, string> = {
  avs: "AVS",
  achahada: "ACHAHADA",
  argml: "ARGML",
  mosquee_de_paris: "M. Paris",
  mosquee_de_lyon: "M. Lyon",
  other: "Autre",
  none: "",
};

interface StoreFavoriteCardProps {
  store: {
    id: string;
    name: string;
    storeType: string;
    imageUrl: string | null;
    logoUrl: string | null;
    address: string;
    city: string;
    phone: string | null;
    halalCertified: boolean;
    certifier: string;
    certifierName: string | null;
    averageRating: number;
    reviewCount: number;
    latitude: number;
    longitude: number;
  };
  index: number;
  onRemove: (storeId: string) => void;
}

export const StoreFavoriteCard = React.memo(function StoreFavoriteCard({
  store,
  index,
  onRemove,
}: StoreFavoriteCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, selection } = useHaptics();

  const typeConfig = STORE_TYPE_CONFIG[store.storeType] ?? STORE_TYPE_CONFIG.other;
  const certifierLabel = CERTIFIER_LABELS[store.certifier] ?? "";
  const hasRating = store.averageRating > 0;
  const hasPhone = !!store.phone;
  const storeTypeLabel =
    (t.favorites.storeCategories as Record<string, string>)[store.storeType] ?? typeConfig.label;

  const handleDirections = () => {
    impact();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

  const handleCall = () => {
    impact();
    if (store.phone) Linking.openURL(`tel:${store.phone}`);
  };

  const handleRemove = () => {
    selection();
    onRemove(store.id);
  };

  const imageSource = store.imageUrl || store.logoUrl;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(350).springify()}
    >
      <PressableScale
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        accessibilityRole="button"
        accessibilityLabel={store.name}
      >
        {/* Image */}
        <View style={styles.imageBox}>
          {imageSource ? (
            <Image
              source={{ uri: imageSource }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage, { backgroundColor: isDark ? "#1f1f1f" : "#f0ede8" }]}>
              <MaterialIcons name={typeConfig.icon} size={28} color={typeConfig.color} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name */}
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {store.name}
          </Text>

          {/* Type + Certifier row */}
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + "18" }]}>
              <MaterialIcons name={typeConfig.icon} size={12} color={typeConfig.color} />
              <Text style={[styles.typeText, { color: typeConfig.color }]}>{storeTypeLabel}</Text>
            </View>

            {store.halalCertified && certifierLabel ? (
              <View style={[styles.certBadge, { backgroundColor: brand.primary + "18" }]}>
                <MaterialIcons name="verified" size={11} color={brand.primary} />
                <Text style={[styles.certText, { color: brand.primary }]}>{certifierLabel}</Text>
              </View>
            ) : null}
          </View>

          {/* Rating + City */}
          <View style={styles.metaRow}>
            {hasRating && (
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={14} color="#f59e0b" />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                  {store.averageRating.toFixed(1)}
                </Text>
                {store.reviewCount > 0 && (
                  <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                    ({store.reviewCount})
                  </Text>
                )}
              </View>
            )}
            <Text style={[styles.city, { color: colors.textMuted }]} numberOfLines={1}>
              {hasRating ? " · " : ""}{store.city}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <PressableScale
              onPress={handleDirections}
              style={[styles.actionBtn, styles.dirBtn, { backgroundColor: brand.primary + "15" }]}
              accessibilityLabel="Itinéraire"
            >
              <MaterialIcons name="directions" size={16} color={brand.primary} />
            </PressableScale>

            {hasPhone && (
              <PressableScale
                onPress={handleCall}
                style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}
                accessibilityLabel="Appeler"
              >
                <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
              </PressableScale>
            )}

            <PressableScale
              onPress={handleRemove}
              style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}
              accessibilityLabel={t.favorites.removeConfirm}
            >
              <MaterialIcons name="favorite" size={16} color="#ef4444" />
            </PressableScale>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    gap: 12,
  },
  imageBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: 72,
    height: 72,
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  certText: {
    fontSize: 10,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  city: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dirBtn: {},
});
