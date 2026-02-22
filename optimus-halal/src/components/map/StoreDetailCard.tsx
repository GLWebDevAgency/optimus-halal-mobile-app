import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { storeTypeColors } from "@/theme/colors";
import {
  StoreFeatureProperties,
  ThemeColors,
  STORE_TYPE_ICON,
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

interface StoreDetail {
  description?: string | null;
  website?: string | null;
  email?: string | null;
  hours: StoreHour[];
  topReviews: StoreReview[];
  ratingHistogram: Record<number, number>;
  [key: string]: unknown; // Allow extra store fields from getById
}

interface Props {
  store: StoreFeatureProperties;
  detail?: StoreDetail;
  isDetailLoading?: boolean;
  isExpanded?: boolean;
  onDirections: () => void;
  onCall: () => void;
  onShare: () => void;
  onClose: () => void;
  colors: ThemeColors;
}

export const StoreDetailCard = React.memo(function StoreDetailCard({
  store,
  detail,
  isDetailLoading,
  isExpanded,
  onDirections,
  onCall,
  onShare,
  onClose,
  colors,
}: Props) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;
  const typeIcon = STORE_TYPE_ICON[store.storeType] ?? "store";
  const typeColor = storeTypeColors[store.storeType as keyof typeof storeTypeColors]?.base ?? colors.primary;

  // Current day of week (Paris timezone approximation — JS Date uses device locale)
  const today = new Date().getDay();

  return (
    <BottomSheetScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInUp.duration(300)} className="px-5 pb-4">
        {/* Store image hero */}
        {store.imageUrl && (
          <View className="mb-3 rounded-xl overflow-hidden" style={{ height: 120 }}>
            <Image
              source={{ uri: store.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={["transparent", isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)"]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40 }}
            />
          </View>
        )}

        {/* Header row */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-start flex-1 pr-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${typeColor}18` }}
            >
              <MaterialIcons name={typeIcon} size={20} color={typeColor} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                {store.name}
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {store.address}, {store.city}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={onShare}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.buttonSecondary }}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <MaterialIcons name="share" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.buttonSecondary }}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <MaterialIcons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges row */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          {store.openStatus && store.openStatus !== "unknown" && (
            <View
              className="px-2.5 py-1 rounded-lg flex-row items-center gap-1"
              style={{ backgroundColor: openStatusBg(store.openStatus, isDark) }}
            >
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: openStatusColor(store.openStatus, isDark),
              }} />
              <Text className="text-[11px] font-bold" style={{ color: openStatusColor(store.openStatus, isDark) }}>
                {openStatusLabel(store.openStatus, t)}
              </Text>
            </View>
          )}
          {certLabel && (
            <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors.primaryLight }}>
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>{certLabel}</Text>
            </View>
          )}
          {store.halalCertified && (
            <View className="px-2.5 py-1 rounded-lg flex-row items-center gap-1" style={{ backgroundColor: `${colors.primary}15` }}>
              <MaterialIcons name="verified" size={12} color={colors.primary} />
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>HALAL</Text>
            </View>
          )}
          {store.averageRating > 0 && (
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="star" size={14} color="#fbbf24" />
              <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{store.averageRating.toFixed(1)}</Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>({store.reviewCount})</Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="near-me" size={12} color={colors.textMuted} />
            <Text className="text-xs" style={{ color: colors.textMuted }}>{formatDistance(store.distance)}</Text>
          </View>
        </View>

        {/* Hours row (peek — today only) */}
        {!isExpanded && store.openTime && store.closeTime && (
          <View
            className="flex-row items-center gap-2 mb-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
          >
            <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {t.map.hours} : {store.openTime} – {store.closeTime}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onDirections}
            className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${t.map.getDirections} ${store.name}`}
          >
            <MaterialIcons name="directions" size={20} color="#fff" />
            <Text className="text-sm font-bold text-white">{t.map.getDirections}</Text>
          </TouchableOpacity>

          {store.phone && (
            <TouchableOpacity
              onPress={onCall}
              className="flex-row items-center justify-center gap-2 py-3.5 px-5 rounded-2xl"
              style={{
                backgroundColor: colors.buttonSecondary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t.map.callStore} ${store.name}`}
            >
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>{t.map.callStore}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Expanded section (fetched on pull-up) ─── */}
        {isExpanded && (
          <Animated.View entering={FadeIn.duration(300)}>
            {isDetailLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : detail ? (
              <>
                {/* Description */}
                {detail.description && (
                  <View className="mt-4">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
                      {t.map.storeDetail}
                    </Text>
                    <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                      {detail.description}
                    </Text>
                  </View>
                )}

                {/* Weekly hours */}
                {detail.hours.length > 0 && (
                  <View className="mt-4">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
                      {t.map.hours}
                    </Text>
                    <View
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                    >
                      {detail.hours.map((h) => {
                        const isToday = h.dayOfWeek === today;
                        const dayLabel = t.map.days?.[DAY_KEYS[h.dayOfWeek]] ?? DAY_KEYS[h.dayOfWeek];
                        return (
                          <View
                            key={h.dayOfWeek}
                            className="flex-row items-center justify-between px-3 py-2"
                            style={isToday ? { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" } : undefined}
                          >
                            <Text
                              className={`text-sm ${isToday ? "font-bold" : "font-medium"}`}
                              style={{ color: isToday ? colors.textPrimary : colors.textSecondary }}
                            >
                              {dayLabel}
                              {isToday ? " •" : ""}
                            </Text>
                            <Text
                              className={`text-sm ${isToday ? "font-bold" : ""}`}
                              style={{ color: h.isClosed ? (isDark ? "#f87171" : "#dc2626") : colors.textSecondary }}
                            >
                              {h.isClosed ? t.map.closed : `${h.openTime} – ${h.closeTime}`}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Rating distribution + reviews */}
                {store.reviewCount > 0 && (
                  <View className="mt-4">
                    <Text className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
                      {t.map.reviews.replace("{{count}}", String(store.reviewCount))}
                    </Text>

                    {/* Rating histogram */}
                    {detail.ratingHistogram && (
                      <View className="mb-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = detail.ratingHistogram[star] ?? 0;
                          const maxCount = Math.max(...Object.values(detail.ratingHistogram), 1);
                          const pct = (count / maxCount) * 100;
                          return (
                            <View key={star} className="flex-row items-center gap-2 mb-1">
                              <Text className="text-[11px] w-3 text-right font-medium" style={{ color: colors.textMuted }}>
                                {star}
                              </Text>
                              <MaterialIcons name="star" size={10} color="#fbbf24" />
                              <View className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                                <View
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, backgroundColor: "#fbbf24" }}
                                />
                              </View>
                              <Text className="text-[11px] w-5 font-medium" style={{ color: colors.textMuted }}>
                                {count}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Top reviews */}
                    {detail.topReviews.map((review) => (
                      <View
                        key={review.id}
                        className="mb-3 px-3 py-3 rounded-xl"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-2">
                            <View
                              className="w-7 h-7 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${colors.primary}20` }}
                            >
                              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                                {(review.userName ?? "?").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                              {review.userName ?? t.map.anonymousUser}
                            </Text>
                            {review.isVerifiedPurchase && (
                              <MaterialIcons name="verified" size={12} color={colors.primary} />
                            )}
                          </View>
                          <View className="flex-row items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <MaterialIcons
                                key={i}
                                name={i < review.rating ? "star" : "star-border"}
                                size={12}
                                color="#fbbf24"
                              />
                            ))}
                          </View>
                        </View>
                        {review.comment && (
                          <Text className="text-sm leading-5" style={{ color: colors.textSecondary }} numberOfLines={4}>
                            {review.comment}
                          </Text>
                        )}
                        {review.helpfulCount > 0 && (
                          <View className="flex-row items-center gap-1 mt-1.5">
                            <MaterialIcons name="thumb-up" size={10} color={colors.textMuted} />
                            <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                              {review.helpfulCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Website link */}
                {detail.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(detail.website!)}
                    className="mt-3 flex-row items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                    accessibilityRole="link"
                    accessibilityLabel={t.map.website}
                  >
                    <MaterialIcons name="language" size={16} color={colors.primary} />
                    <Text className="text-sm font-medium" style={{ color: colors.primary }} numberOfLines={1}>
                      {t.map.website}
                    </Text>
                    <MaterialIcons name="open-in-new" size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </Animated.View>
        )}
      </Animated.View>
    </BottomSheetScrollView>
  );
});
