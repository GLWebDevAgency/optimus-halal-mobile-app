import React from "react";
import { View, Text, Pressable, ActivityIndicator, Linking, ScrollView, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { ArrowSquareOutIcon, ChatCircleIcon, GlobeIcon, MapTrifoldIcon, NavigationArrowIcon, PhoneIcon, SealCheckIcon, ShareNetworkIcon, SignInIcon, StarIcon, ThumbsUpIcon, XIcon } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "../ui/PressableScale";
import { CertifierLogo } from "../scan/CertifierLogo";
import { storeTypeColors } from "@/theme/colors";
import { AppIcon } from "@/lib/icons";
import {
  StoreFeatureProperties,
  ThemeColors,
  STORE_TYPE_ICON,
  STORE_CERTIFIER_TO_ID,
  formatDistance,
  openStatusColor,
  openStatusBg,
  openStatusLabel,
} from "./types";

// Day names indexed by storeHours.dayOfWeek (0=Sunday, 6=Saturday)
const DAY_KEYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const;

interface StoreHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

interface StoreReview {
  id: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date | string;
  userName: string;
}

interface GoogleReview {
  id: string;
  authorName: string;
  authorPhotoUri: string | null;
  rating: number;
  text: string | null;
  relativeTime: string | null;
  languageCode: string | null;
}

interface StoreDetail {
  description?: string | null;
  website?: string | null;
  email?: string | null;
  googleMapsUrl?: string | null;
  googlePhotos?: string[] | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  hours: StoreHour[];
  topReviews: StoreReview[];
  googleReviewsData: GoogleReview[];
  ratingHistogram: Record<number, number>;
  [key: string]: unknown;
}

interface Props {
  store: StoreFeatureProperties;
  detail?: StoreDetail;
  isDetailLoading?: boolean;
  isExpanded?: boolean;
  animatedSheetIndex: SharedValue<number>;
  certifierTrustScore?: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDirections: () => void;
  onCall: () => void;
  onShare: () => void;
  onClose: () => void;
  colors: ThemeColors;
}

// Photo gallery thumbnail dimensions
const PHOTO_SIZE = 100;
const PHOTO_GAP = 8;

// Square action buttons (collapsed peek)
const SQUARE_BTN_COL_WIDTH = 56;
const IMAGE_BTN_GAP = 8;

// Score-based badge colors — semantic trust feedback
function trustScoreColor(score: number, isDark: boolean): string {
  if (score >= 80) return isDark ? "#4ade80" : "#16a34a";
  if (score >= 60) return isDark ? "#fbbf24" : "#d97706";
  if (score >= 40) return isDark ? "#fb923c" : "#ea580c";
  return isDark ? "#f87171" : "#dc2626";
}

function trustScoreBg(score: number, isDark: boolean): string {
  if (score >= 80) return isDark ? "rgba(74,222,128,0.12)" : "rgba(22,163,74,0.10)";
  if (score >= 60) return isDark ? "rgba(251,191,36,0.12)" : "rgba(217,119,6,0.10)";
  if (score >= 40) return isDark ? "rgba(251,146,60,0.12)" : "rgba(234,88,12,0.10)";
  return isDark ? "rgba(248,113,113,0.12)" : "rgba(220,38,38,0.10)";
}

export const StoreDetailCard = React.memo(function StoreDetailCard({
  store,
  detail,
  isDetailLoading,
  isExpanded,
  animatedSheetIndex,
  certifierTrustScore,
  isFavorite,
  onToggleFavorite,
  onDirections,
  onCall,
  onShare,
  onClose,
  colors,
}: Props) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const certifierId = STORE_CERTIFIER_TO_ID[store.certifier];
  const typeIcon = STORE_TYPE_ICON[store.storeType] ?? "store";
  const typeColor =
    storeTypeColors[store.storeType as keyof typeof storeTypeColors]?.base ?? colors.primary;

  // Current day of week in Europe/Paris (matches backend EXTRACT(DOW FROM NOW() AT TIME ZONE 'Europe/Paris'))
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();

  // Google photos from detail (enriched data)
  const googlePhotos = detail?.googlePhotos?.filter(Boolean) ?? [];

  // ─── Animated styles synced to bottom sheet position ───────────
  // Content width = screen - horizontal padding (px-5 = 20px each side)
  const contentWidth = screenWidth - 40;
  const collapsedImageWidth = contentWidth - SQUARE_BTN_COL_WIDTH - IMAGE_BTN_GAP;

  // Image: expands from 75% → 100% width as sheet rises (index 0 → 0.5)
  const imageContainerStyle = useAnimatedStyle(() => ({
    width: interpolate(
      animatedSheetIndex.value,
      [0, 0.5],
      [collapsedImageWidth, contentWidth],
      Extrapolation.CLAMP,
    ),
  }));

  // Square buttons: fade out + shrink as sheet rises (index 0 → 0.3)
  const squareButtonsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedSheetIndex.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(animatedSheetIndex.value, [0, 0.3], [1, 0.8], Extrapolation.CLAMP),
      },
    ],
  }));

  // Full-width buttons: expand + fade in as sheet rises (index 0.3 → 0.7)
  const fullWidthButtonsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedSheetIndex.value, [0.3, 0.7], [0, 1], Extrapolation.CLAMP),
    height: interpolate(animatedSheetIndex.value, [0.3, 0.7], [0, 56], Extrapolation.CLAMP),
    overflow: "hidden" as const,
  }));

  return (
    <BottomSheetScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInUp.duration(300)} className="px-5 pb-4">
        {/* ─── Row 1: Header (icon + name + address + share/close) ─── */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-start flex-1 pr-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 overflow-hidden"
              style={{ backgroundColor: `${typeColor}18` }}
            >
              {store.logoUrl ? (
                <Image
                  source={{ uri: store.logoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <AppIcon name={typeIcon} size={20} color={typeColor} />
              )}
            </View>
            <View className="flex-1">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {store.name}
              </Text>
              <Text
                className="text-sm mt-0.5"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {store.address}, {store.city}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5">
            {onToggleFavorite && (
              <Pressable
                onPress={onToggleFavorite}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: isFavorite ? `${colors.primary}15` : colors.buttonSecondary }}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <AppIcon name={isFavorite ? "favorite" : "favorite-border"}
                  size={16}
                  color={isFavorite ? "#ef4444" : colors.textSecondary} />
              </Pressable>
            )}
            <Pressable
              onPress={onShare}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.buttonSecondary }}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <ShareNetworkIcon size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.buttonSecondary }}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <XIcon size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ─── Row 2: Image (animated 75%→100%) + square action buttons ─── */}
        <View className="flex-row mb-3" style={{ gap: IMAGE_BTN_GAP, height: 120 }}>
          {/* Animated image container */}
          <Animated.View
            style={[
              { height: 120, borderRadius: 12, overflow: "hidden" },
              imageContainerStyle,
            ]}
          >
            {store.imageUrl ? (
              <>
                <Image
                  source={{ uri: store.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={[
                    "transparent",
                    isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
                  ]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                  }}
                />
              </>
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.buttonSecondary,
                }}
              >
                <AppIcon name={typeIcon} size={36} color={colors.textMuted} />
              </View>
            )}
          </Animated.View>

          {/* Square action buttons — fade out as sheet expands */}
          <Animated.View
            style={[
              {
                width: SQUARE_BTN_COL_WIDTH,
                justifyContent: "center" as const,
                gap: 8,
              },
              squareButtonsStyle,
            ]}
            pointerEvents={isExpanded ? "none" : "auto"}
          >
            <PressableScale
              onPress={onDirections}
              accessibilityRole="button"
              accessibilityLabel={t.map.getDirections}
            >
              <View
                className="items-center justify-center rounded-xl"
                style={{
                  width: SQUARE_BTN_COL_WIDTH,
                  height: SQUARE_BTN_COL_WIDTH,
                  backgroundColor: colors.primary,
                }}
              >
                <SignInIcon size={22} color="#fff" />
              </View>
            </PressableScale>

            {store.phone ? (
              <PressableScale
                onPress={onCall}
                accessibilityRole="button"
                accessibilityLabel={t.map.callStore}
              >
                <View
                  className="items-center justify-center rounded-xl"
                  style={{
                    width: SQUARE_BTN_COL_WIDTH,
                    height: SQUARE_BTN_COL_WIDTH,
                    backgroundColor: colors.buttonSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <PhoneIcon size={22} color={colors.primary} />
                </View>
              </PressableScale>
            ) : null}
          </Animated.View>
        </View>

        {/* ─── Row 3: Badges (fused certifier + status + rating + distance) ─── */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          {store.openStatus && store.openStatus !== "unknown" && (
            <View
              className="px-2.5 py-1 rounded-lg flex-row items-center gap-1"
              style={{ backgroundColor: openStatusBg(store.openStatus, isDark) }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: openStatusColor(store.openStatus, isDark),
                }}
              />
              <Text
                className="text-[11px] font-bold"
                style={{ color: openStatusColor(store.openStatus, isDark) }}
              >
                {openStatusLabel(store.openStatus, t)}
              </Text>
            </View>
          )}

          {/* Fused certifier badge: logo + acronym + score (colored by trust level) */}
          {certifierId ? (
            <View
              className="px-2 py-1 rounded-lg flex-row items-center gap-1.5"
              style={{
                backgroundColor: certifierTrustScore != null
                  ? trustScoreBg(certifierTrustScore, isDark)
                  : colors.primaryLight,
              }}
            >
              <CertifierLogo certifierId={certifierId} size={14} />
              <Text
                className="text-[11px] font-bold"
                style={{
                  color: certifierTrustScore != null
                    ? trustScoreColor(certifierTrustScore, isDark)
                    : colors.primary,
                }}
              >
                {store.certifier.toUpperCase()}
                {certifierTrustScore != null && ` \u00B7 ${certifierTrustScore}/100`}
              </Text>
            </View>
          ) : store.halalCertified ? (
            <View
              className="px-2.5 py-1 rounded-lg flex-row items-center gap-1"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <SealCheckIcon size={12} color={colors.primary} />
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                HALAL
              </Text>
            </View>
          ) : null}

          {store.averageRating > 0 && (
            <View className="flex-row items-center gap-1">
              <StarIcon size={14} color="#fbbf24" />
              <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                {store.averageRating.toFixed(1)}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                ({store.reviewCount})
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <NavigationArrowIcon size={12} color={colors.textMuted} />
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {formatDistance(store.distance)}
            </Text>
          </View>
        </View>

        {/* ─── Full-width action buttons (animated: fade in as sheet expands) ─── */}
        <Animated.View style={fullWidthButtonsStyle}>
          <View className="flex-row gap-3">
            <PressableScale
              onPress={onDirections}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={`${t.map.getDirections} ${store.name}`}
            >
              <View
                className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl"
                style={{
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <SignInIcon size={20} color="#fff" />
                <Text className="text-sm font-bold text-white">{t.map.getDirections}</Text>
              </View>
            </PressableScale>

            {store.phone && (
              <PressableScale
                onPress={onCall}
                accessibilityRole="button"
                accessibilityLabel={`${t.map.callStore} ${store.name}`}
              >
                <View
                  className="flex-row items-center justify-center gap-2 py-3.5 px-5 rounded-2xl"
                  style={{
                    backgroundColor: colors.buttonSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <PhoneIcon size={20} color={colors.primary} />
                  <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                    {t.map.callStore}
                  </Text>
                </View>
              </PressableScale>
            )}
          </View>
        </Animated.View>

        {/* ─── Expanded section (fetched on pull-up) ─── */}
        {isExpanded && (
          <Animated.View entering={FadeIn.duration(300)}>
            {isDetailLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : detail ? (
              <>
                {/* Google Photos Gallery */}
                {googlePhotos.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(50).duration(250)}
                    className="mt-4"
                  >
                    <Text
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      {t.map.googlePhotos}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: PHOTO_GAP }}
                    >
                      {googlePhotos.map((uri, idx) => (
                        <View
                          key={idx}
                          className="rounded-xl overflow-hidden"
                          style={{
                            width: PHOTO_SIZE,
                            height: PHOTO_SIZE,
                            backgroundColor: colors.buttonSecondary,
                          }}
                        >
                          <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            transition={200}
                            recyclingKey={`gp-${idx}`}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}

                {/* Description */}
                {detail.description && (
                  <Animated.View
                    entering={FadeInDown.delay(80).duration(250)}
                    className="mt-4"
                  >
                    <Text
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      {t.map.storeDetail}
                    </Text>
                    <Text
                      className="text-sm leading-5"
                      style={{ color: colors.textSecondary }}
                    >
                      {detail.description}
                    </Text>
                  </Animated.View>
                )}

                {/* Weekly hours */}
                {detail.hours.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(120).duration(250)}
                    className="mt-4"
                  >
                    <Text
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      {t.map.hours}
                    </Text>
                    <View
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                      }}
                    >
                      {(() => {
                        // Group hours by dayOfWeek — stores with split periods
                        // (e.g. Sat 09:00-12:30 + 14:00-18:00) have multiple entries per day
                        const grouped = new Map<number, typeof detail.hours>();
                        for (const h of detail.hours) {
                          const arr = grouped.get(h.dayOfWeek) ?? [];
                          arr.push(h);
                          grouped.set(h.dayOfWeek, arr);
                        }
                        return Array.from(grouped.entries()).map(([day, entries]) => {
                          const isToday = day === today;
                          const dayLabel =
                            t.map.days?.[DAY_KEYS[day]] ?? DAY_KEYS[day];
                          const allClosed = entries.every((e) => e.isClosed);
                          const timeStr = allClosed
                            ? t.map.closed
                            : entries
                                .filter((e) => !e.isClosed)
                                .map(
                                  (e) => `${e.openTime} \u2013 ${e.closeTime}`,
                                )
                                .join(", ");
                          return (
                            <View
                              key={day}
                              className="flex-row items-center justify-between px-3 py-2"
                              style={
                                isToday
                                  ? {
                                      backgroundColor: isDark
                                        ? "rgba(255,255,255,0.08)"
                                        : "rgba(0,0,0,0.05)",
                                    }
                                  : undefined
                              }
                            >
                              <Text
                                className={`text-sm ${isToday ? "font-bold" : "font-medium"}`}
                                style={{
                                  color: isToday
                                    ? colors.textPrimary
                                    : colors.textSecondary,
                                }}
                              >
                                {dayLabel}
                                {isToday ? " \u2022" : ""}
                              </Text>
                              <Text
                                className={`text-sm ${isToday ? "font-bold" : ""}`}
                                style={{
                                  color: allClosed
                                    ? isDark
                                      ? "#f87171"
                                      : "#dc2626"
                                    : colors.textSecondary,
                                }}
                              >
                                {timeStr}
                              </Text>
                            </View>
                          );
                        });
                      })()}
                    </View>
                  </Animated.View>
                )}

                {/* Rating distribution + user reviews */}
                {store.reviewCount > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(190).duration(250)}
                    className="mt-4"
                  >
                    <Text
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      {t.map.reviews.replace(
                        "{{count}}",
                        String(store.reviewCount),
                      )}
                    </Text>

                    {/* Rating histogram */}
                    {detail.ratingHistogram && (
                      <View className="mb-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            detail.ratingHistogram[star] ?? 0;
                          const maxCount = Math.max(
                            ...Object.values(detail.ratingHistogram),
                            1,
                          );
                          const pct = (count / maxCount) * 100;
                          return (
                            <View
                              key={star}
                              className="flex-row items-center gap-2 mb-1"
                            >
                              <Text
                                className="text-[11px] w-3 text-right font-medium"
                                style={{ color: colors.textMuted }}
                              >
                                {star}
                              </Text>
                              <StarIcon size={10}
                                color="#fbbf24" />
                              <View
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.06)",
                                }}
                              >
                                <View
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: "#fbbf24",
                                  }}
                                />
                              </View>
                              <Text
                                className="text-[11px] w-5 font-medium"
                                style={{ color: colors.textMuted }}
                              >
                                {count}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Top user reviews */}
                    {detail.topReviews.map((review) => (
                      <View
                        key={review.id}
                        className="mb-3 px-3 py-3 rounded-xl"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-2">
                            <View
                              className="w-7 h-7 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: `${colors.primary}20`,
                              }}
                            >
                              <Text
                                className="text-[11px] font-bold"
                                style={{ color: colors.primary }}
                              >
                                {(review.userName ?? "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </Text>
                            </View>
                            <Text
                              className="text-sm font-semibold"
                              style={{ color: colors.textPrimary }}
                            >
                              {review.userName ?? t.map.anonymousUser}
                            </Text>
                            {review.isVerifiedPurchase && (
                              <SealCheckIcon size={12}
                                color={colors.primary} />
                            )}
                          </View>
                          <View className="flex-row items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <AppIcon key={i}
                                name={
                                  i < review.rating ? "star" : "star-border"
                                }
                                size={12}
                                color="#fbbf24" />
                            ))}
                          </View>
                        </View>
                        {review.comment && (
                          <Text
                            className="text-sm leading-5"
                            style={{ color: colors.textSecondary }}
                            numberOfLines={4}
                          >
                            {review.comment}
                          </Text>
                        )}
                        {review.helpfulCount > 0 && (
                          <View className="flex-row items-center gap-1 mt-1.5">
                            <ThumbsUpIcon size={10}
                              color={colors.textMuted} />
                            <Text
                              className="text-[10px]"
                              style={{ color: colors.textMuted }}
                            >
                              {review.helpfulCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Google Reviews */}
                {detail.googleReviewsData.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(240).duration(250)}
                    className="mt-4"
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <ChatCircleIcon size={14}
                        color={colors.textMuted} />
                      <Text
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: colors.textMuted }}
                      >
                        {t.map.googleReviews}
                      </Text>
                      {detail.googleRating != null && (
                        <View className="flex-row items-center gap-1 ml-auto">
                          <StarIcon size={12}
                            color="#fbbf24" />
                          <Text
                            className="text-xs font-bold"
                            style={{ color: colors.textPrimary }}
                          >
                            {detail.googleRating.toFixed(1)}
                          </Text>
                          {detail.googleReviewCount != null && (
                            <Text
                              className="text-[10px]"
                              style={{ color: colors.textMuted }}
                            >
                              ({detail.googleReviewCount})
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {detail.googleReviewsData.map((review) => (
                      <View
                        key={review.id}
                        className="mb-3 px-3 py-3 rounded-xl"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-2">
                            {review.authorPhotoUri ? (
                              <Image
                                source={{ uri: review.authorPhotoUri }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                }}
                                contentFit="cover"
                                transition={150}
                              />
                            ) : (
                              <View
                                className="w-7 h-7 rounded-full items-center justify-center"
                                style={{
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.06)",
                                }}
                              >
                                <Text
                                  className="text-[11px] font-bold"
                                  style={{ color: colors.textMuted }}
                                >
                                  {review.authorName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View>
                              <Text
                                className="text-sm font-semibold"
                                style={{ color: colors.textPrimary }}
                              >
                                {review.authorName}
                              </Text>
                              {review.relativeTime && (
                                <Text
                                  className="text-[10px]"
                                  style={{ color: colors.textMuted }}
                                >
                                  {review.relativeTime}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View className="flex-row items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <AppIcon key={i}
                                name={
                                  i < review.rating ? "star" : "star-border"
                                }
                                size={12}
                                color="#fbbf24" />
                            ))}
                          </View>
                        </View>
                        {review.text && (
                          <Text
                            className="text-sm leading-5"
                            style={{ color: colors.textSecondary }}
                            numberOfLines={4}
                          >
                            {review.text}
                          </Text>
                        )}
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Website + Google Maps links */}
                <Animated.View
                  entering={FadeInDown.delay(290).duration(250)}
                  className="mt-3 gap-2"
                >
                  {detail.website && (
                    <PressableScale
                      onPress={() => Linking.openURL(detail.website!)}
                      accessibilityRole="link"
                      accessibilityLabel={t.map.website}
                    >
                      <View
                        className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        }}
                      >
                        <GlobeIcon size={16}
                          color={colors.primary} />
                        <Text
                          className="text-sm font-medium flex-1"
                          style={{ color: colors.primary }}
                          numberOfLines={1}
                        >
                          {t.map.website}
                        </Text>
                        <ArrowSquareOutIcon size={12}
                          color={colors.textMuted} />
                      </View>
                    </PressableScale>
                  )}

                  {detail.googleMapsUrl && (
                    <PressableScale
                      onPress={() => Linking.openURL(detail.googleMapsUrl!)}
                      accessibilityRole="link"
                      accessibilityLabel={t.map.openOnGoogleMaps}
                    >
                      <View
                        className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                        }}
                      >
                        <MapTrifoldIcon size={16}
                          color={colors.primary} />
                        <Text
                          className="text-sm font-medium flex-1"
                          style={{ color: colors.primary }}
                          numberOfLines={1}
                        >
                          {t.map.openOnGoogleMaps}
                        </Text>
                        <ArrowSquareOutIcon size={12}
                          color={colors.textMuted} />
                      </View>
                    </PressableScale>
                  )}
                </Animated.View>
              </>
            ) : null}
          </Animated.View>
        )}
      </Animated.View>
    </BottomSheetScrollView>
  );
});
