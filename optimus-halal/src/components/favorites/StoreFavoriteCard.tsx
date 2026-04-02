/**
 * StoreFavoriteCard — Premium full-width card matching ProductFavoriteCard DNA.
 *
 * Layout: [accent | image | 6-line info column | ❤️ top-right]
 * Lines: name, type · city · date, ⭐ rating, certifier, grade, 📍 address
 * Bottom: [🧭 Itinéraire] [📞] [📤 Partager]
 *
 * Same visual system as ProductFavoriteCard: status-tinted gradient,
 * accent line, CertifierLogo, NaqiyGradeBadge strip.
 */

import React, { useRef } from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  HeartIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PhoneIcon,
  ShareNetworkIcon,
  StarIcon,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { NaqiyGradeBadge, getTrustGradeFromScore } from "@/components/scan/NaqiyGradeBadge";
import {
  StoreShareCardView,
  captureAndShareStoreCard,
  type StoreShareCardData,
  type StoreShareLabels,
} from "@/components/map/StoreShareCard";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { halalStatus as statusColors, gold, brand } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";
import { STORE_CERTIFIER_TO_ID, STORE_TYPE_COLOR } from "@/components/map/types";

// ── Certifier display names ─────────────────────────────────
const CERTIFIER_DISPLAY: Record<string, string> = {
  avs: "AVS - À Votre Service",
  achahada: "Achahada",
  argml: "ARGML - Mosquée de Lyon",
  mosquee_de_paris: "SFCVH - Mosquée de Paris",
  mosquee_de_lyon: "ARGML - Mosquée de Lyon",
  mosquee_d_evry: "ACMIF - Mosquée d'Évry",
};

// ── Store type config ──────────────────────────────────────
const STORE_TYPE_CONFIG: Record<string, { icon: IconName; label: string }> = {
  butcher: { icon: "restaurant", label: "Boucherie" },
  restaurant: { icon: "restaurant-menu", label: "Restaurant" },
  supermarket: { icon: "shopping-cart", label: "Supermarché" },
  bakery: { icon: "bakery-dining", label: "Boulangerie" },
  wholesaler: { icon: "warehouse", label: "Grossiste" },
  abattoir: { icon: "factory", label: "Abattoir" },
  online: { icon: "language", label: "En ligne" },
  other: { icon: "store", label: "Commerce" },
};

// ── Gradient configs (certified vs uncertified) ────────────
const GRADIENT_CONFIG = {
  certified: {
    gradientDark: ["#0a1a10", "#0f2418", "#132a1a"] as const,
    gradientLight: ["#ecfdf5", "#d1fae5", "#a7f3d0"] as const,
    color: statusColors.halal.base,
  },
  uncertified: {
    gradientDark: ["#0f0f0f", "#151515", "#1a1a1a"] as const,
    gradientLight: ["#f8fafc", "#e2e8f0", "#cbd5e1"] as const,
    color: statusColors.unknown.base,
  },
};

// ── Props ────────────────────────────────────────────────────

export interface StoreFavoriteCardProps {
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
  /** Certifier trust score from ranking query */
  certifierTrustScore?: number | null;
  index: number;
  onRemove: (storeId: string) => void;
}

export const StoreFavoriteCard = React.memo(function StoreFavoriteCard({
  store,
  certifierTrustScore = null,
  index,
  onRemove,
}: StoreFavoriteCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, selection } = useHaptics();
  const router = useRouter();
  const shareCardRef = useRef<View>(null);

  const isCertified = store.halalCertified && store.certifier && store.certifier !== "none";
  const config = isCertified ? GRADIENT_CONFIG.certified : GRADIENT_CONFIG.uncertified;
  const gradient = isDark ? config.gradientDark : config.gradientLight;

  const certifierSlug = isCertified ? (STORE_CERTIFIER_TO_ID[store.certifier] ?? null) : null;
  const certifierDisplayName = isCertified
    ? (CERTIFIER_DISPLAY[store.certifier] ?? store.certifierName ?? store.certifier)
    : null;

  const typeConfig = STORE_TYPE_CONFIG[store.storeType] ?? STORE_TYPE_CONFIG.other;
  const typeColor = STORE_TYPE_COLOR[store.storeType] ?? STORE_TYPE_COLOR.other;
  const storeTypeLabel = (t.favorites.storeCategories as Record<string, string>)[store.storeType] ?? typeConfig.label;

  const hasRating = store.averageRating > 0;
  const hasPhone = !!store.phone;
  const imageSource = store.imageUrl || store.logoUrl;

  const gradeLabel = certifierTrustScore != null ? getTrustGradeFromScore(certifierTrustScore).label : null;

  // ── Handlers ──
  const handleNavigateToMap = () => {
    impact();
    router.push({
      pathname: "/(tabs)/map",
      params: {
        storeId: store.id,
        storeLat: String(store.latitude),
        storeLng: String(store.longitude),
        storeName: store.name,
      },
    });
  };

  const handleDirections = () => {
    impact();
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`,
    );
  };

  const handleCall = () => {
    impact();
    if (store.phone) Linking.openURL(`tel:${store.phone}`);
  };

  const handleRemove = () => {
    selection();
    onRemove(store.id);
  };

  const handleShare = () => {
    impact();
    const shareData: StoreShareCardData = {
      storeName: store.name,
      address: store.address,
      city: store.city,
      halalCertified: !!isCertified,
      certifierName: certifierDisplayName,
      averageRating: store.averageRating,
      reviewCount: store.reviewCount,
      storeType: store.storeType,
    };
    const shareLabels: StoreShareLabels = {
      certifiedLabel: "Certifié Halal",
      openNow: "Ouvert",
      closed: "Fermé",
      verifiedWith: "Vérifié avec Naqiy",
      tagline: "Scanne. Comprends. Choisis.",
    };
    captureAndShareStoreCard(shareCardRef, shareData, shareLabels);
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(400)}>
      <PressableScale
        onPress={handleNavigateToMap}
        style={styles.outer}
        accessibilityRole="button"
        accessibilityLabel={store.name}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: isDark
                ? `${config.color}20`
                : `${config.color}15`,
            },
          ]}
        >
          {/* L0: Status gradient background */}
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* L1: Glass overlay */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(12,12,12,0.55)"
                  : "rgba(255,255,255,0.45)",
              },
            ]}
          />

          {/* Store image — edge-to-edge left, full card height */}
          <View
            style={[
              styles.imageEdge,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              },
            ]}
          >
            {imageSource ? (
              <Image
                source={{ uri: imageSource }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <AppIcon name={typeConfig.icon} size={28} color={typeColor} />
            )}
            {/* Subtle right-edge gradient for text readability */}
            {imageSource && (
              <LinearGradient
                colors={["transparent", isDark ? "rgba(12,12,12,0.4)" : "rgba(255,255,255,0.3)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>

          {/* Info column */}
          <View style={styles.infoColumn}>
            {/* 1. Nom + ⭐ Rating (same line) */}
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {store.name}
              </Text>
              {hasRating && (
                <View style={styles.ratingInline}>
                  <StarIcon size={10} color="#f59e0b" weight="fill" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                    {store.averageRating.toFixed(1)}
                  </Text>
                  {store.reviewCount > 0 && (
                    <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                      ({store.reviewCount})
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 2. 🍽 Type · 📍 Adresse · Ville */}
            <View style={styles.metaRow}>
              <AppIcon name={typeConfig.icon} size={10} color={typeColor} />
              <Text style={[styles.metaText, { color: typeColor }]} numberOfLines={1}>
                {storeTypeLabel}
              </Text>
              {store.address ? (
                <>
                  <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />
                  <MapPinIcon size={9} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                    {store.address}
                  </Text>
                </>
              ) : null}
              <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />
              <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                {store.city}
              </Text>
            </View>

            {/* 3. Certifieur : 🏷 Nom (only if certified) */}
            {isCertified && certifierSlug && (
              <View style={styles.certifierRow}>
                <Text style={[styles.italicLabel, { color: colors.textMuted }]}>
                  Certifieur :
                </Text>
                <CertifierLogo certifierId={certifierSlug} size={14} fallbackColor={config.color} />
                <Text style={[styles.certifierName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {certifierDisplayName}
                </Text>
              </View>
            )}

            {/* 4. ①②③④⑤ Grade + Adjectif (only if trustScore) */}
            {certifierTrustScore != null && (
              <View style={styles.gradeRow}>
                <NaqiyGradeBadge variant="strip" grade={getTrustGradeFromScore(certifierTrustScore)} showLabel={false} showLogo={false} />
                {gradeLabel && (
                  <Text style={[styles.gradeAdjectif, { color: getTrustGradeFromScore(certifierTrustScore).color }]}>
                    {gradeLabel}
                  </Text>
                )}
              </View>
            )}

            {/* ── Action buttons ── */}
            <View style={styles.actions}>
              <PressableScale
                onPress={handleDirections}
                style={[styles.actionPill, { backgroundColor: isDark ? `${gold[500]}12` : `${brand.primary}0A` }]}
                accessibilityLabel="Itinéraire"
              >
                <View style={styles.actionPillInner}>
                  <NavigationArrowIcon size={14} color={isDark ? gold[500] : brand.primary} weight="fill" />
                  <Text style={[styles.actionPillText, { color: isDark ? gold[500] : brand.primary }]}>
                    Itinéraire
                  </Text>
                </View>
              </PressableScale>

              {hasPhone && (
                <PressableScale
                  onPress={handleCall}
                  style={[styles.actionIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}
                  accessibilityLabel="Appeler"
                >
                  <PhoneIcon size={16} color={colors.textSecondary} />
                </PressableScale>
              )}

              <PressableScale
                onPress={handleShare}
                style={[styles.actionIcon, { backgroundColor: isDark ? `${gold[500]}10` : `${gold[500]}08` }]}
                accessibilityLabel="Partager"
              >
                <ShareNetworkIcon size={16} color={isDark ? gold[400] : gold[700]} />
              </PressableScale>
            </View>
          </View>

          {/* Heart unfavorite — top-right overlay */}
          <PressableScale
            onPress={handleRemove}
            style={styles.heartBtn}
            accessibilityLabel={t.favorites.removeConfirm}
          >
            <View style={[styles.heartCircle, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }]}>
              <HeartIcon size={14} color="#ef4444" weight="fill" />
            </View>
          </PressableScale>
        </View>
      </PressableScale>

      {/* Hidden share card for capture */}
      <View style={styles.offscreen} pointerEvents="none">
        <StoreShareCardView
          ref={shareCardRef}
          data={{
            storeName: store.name,
            address: store.address,
            city: store.city,
            halalCertified: !!isCertified,
            certifierName: certifierDisplayName,
            averageRating: store.averageRating,
            reviewCount: store.reviewCount,
            storeType: store.storeType,
          }}
          labels={{
            certifiedLabel: "Certifié Halal",
            openNow: "Ouvert",
            closed: "Fermé",
            verifiedWith: "Vérifié avec Naqiy",
            tagline: "Scanne. Comprends. Choisis.",
          }}
        />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outer: { marginHorizontal: 16, marginBottom: 10 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  imageEdge: {
    width: 88,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  infoColumn: { flex: 1, paddingVertical: 10, paddingLeft: 12, paddingRight: 8 },

  // 1. Name + Rating row
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2, flexShrink: 1 },
  ratingInline: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11, fontWeight: "700" },
  reviewCount: { fontSize: 10, fontWeight: "500" },

  // 2. Type · Address · City
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, flexShrink: 1 },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25 },

  // 3. Certifier
  certifierRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  italicLabel: { fontSize: 10, fontWeight: "500", fontStyle: "italic" },
  certifierName: { fontSize: 10, fontWeight: "700", flexShrink: 1 },

  // 4. Grade
  gradeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  gradeAdjectif: { fontSize: 10, fontWeight: "700" },

  // Actions — 44px min touch target (Apple HIG / Material)
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  actionPill: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
  },
  actionPillInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionPillText: { fontSize: 12, fontWeight: "700" },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Heart overlay
  heartBtn: { position: "absolute", top: 6, right: 6 },
  heartCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Offscreen share card
  offscreen: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
});
