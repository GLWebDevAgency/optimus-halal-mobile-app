/**
 * StoreFavoriteCard — Premium full-width card for favorite stores.
 *
 * Consistent with the Naqiy design system: glass border, larger image,
 * type + certifier badges, star rating, city, and action buttons.
 * Heart unfavorite always accessible.
 */

import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import {
  HeartIcon,
  NavigationArrowIcon,
  PhoneIcon,
  SealCheckIcon,
  StarIcon,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { brand, glass, gold } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";
import { headingFontFamily, fontWeight as fw } from "@/theme/typography";

const STORE_TYPE_CONFIG: Record<string, { icon: IconName; color: string }> = {
  butcher: { icon: "restaurant", color: "#ef4444" },
  restaurant: { icon: "restaurant-menu", color: "#f97316" },
  supermarket: { icon: "shopping-cart", color: "#3b82f6" },
  bakery: { icon: "bakery-dining", color: "#d4af37" },
  wholesaler: { icon: "warehouse", color: "#8b5cf6" },
  abattoir: { icon: "factory", color: "#6b7280" },
  online: { icon: "language", color: "#06b6d4" },
  other: { icon: "store", color: "#6b7280" },
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
    (t.favorites.storeCategories as Record<string, string>)[store.storeType] ?? store.storeType;

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
        style={styles.outer}
        accessibilityRole="button"
        accessibilityLabel={store.name}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
              borderColor: isDark ? glass.dark.border : glass.light.border,
            },
          ]}
        >
          {/* Store image — left side, rounded */}
          <View
            style={[
              styles.imageBox,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              },
            ]}
          >
            {imageSource ? (
              <Image
                source={{ uri: imageSource }}
                style={styles.imageFill}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <AppIcon name={typeConfig.icon} size={28} color={typeConfig.color} />
            )}
          </View>

          {/* Content — right side */}
          <View style={styles.content}>
            {/* Name */}
            <Text
              style={[styles.name, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {store.name}
            </Text>

            {/* Type + Certifier badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${typeConfig.color}15` }]}>
                <AppIcon name={typeConfig.icon} size={11} color={typeConfig.color} />
                <Text style={[styles.badgeText, { color: typeConfig.color }]}>
                  {storeTypeLabel}
                </Text>
              </View>

              {store.halalCertified && certifierLabel ? (
                <View style={[styles.badge, { backgroundColor: `${brand.primary}15` }]}>
                  <SealCheckIcon size={11} color={brand.primary} weight="fill" />
                  <Text style={[styles.badgeText, { color: brand.primary }]}>
                    {certifierLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Rating + City */}
            <View style={styles.metaRow}>
              {hasRating && (
                <>
                  <StarIcon size={13} color="#f59e0b" weight="fill" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                    {store.averageRating.toFixed(1)}
                  </Text>
                  {store.reviewCount > 0 && (
                    <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                      ({store.reviewCount})
                    </Text>
                  )}
                  <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                </>
              )}
              <Text style={[styles.city, { color: colors.textMuted }]} numberOfLines={1}>
                {store.city}
              </Text>
            </View>

            {/* Action buttons row */}
            <View style={styles.actions}>
              {/* Directions CTA */}
              <PressableScale
                onPress={handleDirections}
                style={[styles.dirBtn, { backgroundColor: isDark ? `${gold[500]}15` : `${brand.primary}12` }]}
                accessibilityLabel="Itinéraire"
              >
                <NavigationArrowIcon size={14} color={isDark ? gold[500] : brand.primary} weight="fill" />
                <Text style={[styles.dirBtnText, { color: isDark ? gold[500] : brand.primary }]}>
                  Itinéraire
                </Text>
              </PressableScale>

              {/* Call */}
              {hasPhone && (
                <PressableScale
                  onPress={handleCall}
                  style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}
                  accessibilityLabel="Appeler"
                >
                  <PhoneIcon size={14} color={colors.textSecondary} />
                </PressableScale>
              )}

              {/* Unfavorite */}
              <PressableScale
                onPress={handleRemove}
                style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.06)" }]}
                accessibilityLabel={t.favorites.removeConfirm}
              >
                <HeartIcon size={14} color="#ef4444" weight="fill" />
              </PressableScale>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outer: { marginHorizontal: 16, marginBottom: 10 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 14,
    gap: 14,
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageFill: { width: "100%", height: "100%" },
  content: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
  city: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  dirBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
  },
  dirBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
