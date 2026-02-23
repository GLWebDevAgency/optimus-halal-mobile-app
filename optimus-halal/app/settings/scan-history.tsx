/**
 * Scan History Screen — Premium Refonte
 *
 * Ch03 Al-Taqwa: "L'historique est dans settings/scan-history.tsx,
 * pas sur l'écran d'accueil. Il n'y a pas de résumé hebdomadaire
 * de vos scans haram." — It's a personal journal, not a surveillance tool.
 *
 * Layout:
 *   HEADER — gold accent, scan count subtitle
 *   SCAN CARDS — compact horizontal rows, glass-morphism, gold borders
 *     Product image | Name/Brand/Time | Status badge + confidence %
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useScanHistory } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { EmptyState, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";

const GOLD = "#d4af37";

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

// ── Status helpers ────────────────────────────────

type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";

interface StatusConfig {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgColor: string;
  textColor: string;
  iconColor: string;
  borderColor: string;
}

function getStatusConfig(status: string | null, isDark: boolean, t: ReturnType<typeof useTranslation>["t"]): StatusConfig {
  switch (status as HalalStatus) {
    case "halal":
      return {
        label: t.scanHistory.statusHalal,
        icon: "verified",
        bgColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
        textColor: isDark ? "#4ade80" : "#15803d",
        iconColor: "#22c55e",
        borderColor: isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.2)",
      };
    case "haram":
      return {
        label: t.scanHistory.statusHaram,
        icon: "cancel",
        bgColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
        textColor: isDark ? "#f87171" : "#dc2626",
        iconColor: "#ef4444",
        borderColor: isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)",
      };
    case "doubtful":
      return {
        label: t.scanHistory.statusDoubtful,
        icon: "help",
        bgColor: isDark ? "rgba(249,115,22,0.12)" : "rgba(249,115,22,0.08)",
        textColor: isDark ? "#fb923c" : "#c2410c",
        iconColor: "#f97316",
        borderColor: isDark ? "rgba(249,115,22,0.25)" : "rgba(249,115,22,0.2)",
      };
    default:
      return {
        label: t.scanHistory.statusUnknown,
        icon: "help-outline",
        bgColor: isDark ? "rgba(156,163,175,0.12)" : "rgba(156,163,175,0.08)",
        textColor: isDark ? "#9ca3af" : "#6b7280",
        iconColor: "#9ca3af",
        borderColor: isDark ? "rgba(156,163,175,0.2)" : "rgba(156,163,175,0.15)",
      };
  }
}

function formatDate(date: string | Date, t: ReturnType<typeof useTranslation>["t"], locale: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t.alerts.timeAgoJustNow;
  if (diffMin < 60) return t.alerts.timeAgoMinutes.replace("{{count}}", String(diffMin));
  if (diffH < 24) return t.alerts.timeAgoHours.replace("{{count}}", String(diffH));
  if (diffDays < 7) return t.alerts.timeAgoDays.replace("{{count}}", String(diffDays));
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

// ── Types ─────────────────────────────────────────

interface ScanItem {
  id: string;
  barcode: string;
  halalStatus: string | null;
  confidenceScore: number | null;
  scannedAt: Date;
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    category: string | null;
  } | null;
}

// ── Scan Row Component ────────────────────────────

interface ScanRowProps {
  item: ScanItem;
  index: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  language: string;
}

const ScanRow = React.memo(function ScanRow({ item, index, isDark, colors, t, language }: ScanRowProps) {
  const locale = LOCALE_MAP[language] ?? "fr-FR";
  const status = getStatusConfig(item.halalStatus, isDark, t);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 400)).duration(350)}>
      <PressableScale
        onPress={() => router.push(`/scan-result?barcode=${item.barcode}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.product?.name ?? item.barcode}, ${status.label}`}
        style={{
          marginHorizontal: 16,
          marginBottom: 10,
        }}
      >
        {/* Inner row — flexDirection must be here, NOT on PressableScale
            (PressableScale wraps children in Animated.View which resets flex) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
            borderWidth: 1,
            borderColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.1)",
          }}
        >
          {/* ── Product Image ── */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8f7f4",
              borderWidth: 1,
              borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.06)",
            }}
          >
            {item.product?.imageUrl ? (
              <Image
                source={{ uri: item.product.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="inventory-2" size={22} color={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"} />
              </View>
            )}
          </View>

          {/* ── Product Info ── */}
          <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {item.product?.name ?? t.scanHistory.unknownProduct}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
              {item.product?.brand && (
                <Text
                  style={{ fontSize: 12, color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {item.product.brand}
                </Text>
              )}
              {item.product?.brand && (
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
              )}
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {formatDate(item.scannedAt, t, locale)}
              </Text>
            </View>
            {/* Confidence score — Ch02 Al-Ilm: transparency on certainty */}
            {item.confidenceScore != null && item.confidenceScore > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MaterialIcons name="speed" size={10} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                <Text style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                  {`${Math.round(item.confidenceScore * 100)}% ${t.scanResult.confidence}`}
                </Text>
              </View>
            )}
          </View>

          {/* ── Status Badge ── */}
          <View style={{ alignItems: "center", gap: 3 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: status.bgColor,
                borderWidth: 1,
                borderColor: status.borderColor,
              }}
            >
              <MaterialIcons name={status.icon} size={18} color={status.iconColor} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: "700", color: status.textColor, letterSpacing: 0.3 }}>
              {status.label}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const scanKeyExtractor = (item: ScanItem) => item.id;

// ── Main Screen ───────────────────────────────────

export default function ScanHistoryScreen() {
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const { data, isLoading, isError, refetch } = useScanHistory({ limit: 50 });

  const scans = useMemo(() => (data?.items ?? []) as ScanItem[], [data]);

  const renderItem = useCallback(
    ({ item, index }: { item: ScanItem; index: number }) => (
      <ScanRow item={item} index={index} isDark={isDark} colors={colors} t={t} language={language} />
    ),
    [isDark, colors, t, language]
  );

  // Loading
  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1 }}>
          <Header isDark={isDark} colors={colors} t={t} />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>{t.common.loading}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Error
  if (isError) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1 }}>
          <Header isDark={isDark} colors={colors} t={t} />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
              marginBottom: 16,
            }}>
              <MaterialIcons name="cloud-off" size={32} color={isDark ? "#f87171" : "#ef4444"} />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
              {t.scanHistory.loadError}
            </Text>
            <PressableScale
              onPress={() => refetch()}
              style={{
                marginTop: 20,
                backgroundColor: GOLD,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              accessibilityRole="button"
              accessibilityLabel={t.common.retry}
            >
              <Text style={{ color: "#0C0C0C", fontWeight: "800", fontSize: 14 }}>{t.common.retry}</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <Header isDark={isDark} colors={colors} t={t} count={scans.length} />

      {scans.length === 0 ? (
        <EmptyState
          icon="history"
          title={t.scanHistory.noScans}
          message={t.scanHistory.noScansDesc}
          actionLabel={t.scanHistory.scanProduct}
          onAction={() => router.navigate("/(tabs)/scanner")}
        />
      ) : (
        <FlashList
          data={scans}
          keyExtractor={scanKeyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Header Component ──────────────────────────────

function Header({ isDark, colors, t, count }: { isDark: boolean; colors: any; t: any; count?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <PressableScale
          onPress={() => router.back()}
          style={{
            marginEnd: 14,
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
            borderColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.12)",
            borderWidth: 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 24, fontWeight: "800", letterSpacing: -0.5, color: colors.textPrimary }}
            accessibilityRole="header"
          >
            {t.scanHistory.title}
          </Text>
          {count !== undefined && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
              <Text style={{ fontSize: 12, color: isDark ? "rgba(212,175,55,0.7)" : "rgba(146,112,12,0.8)", fontWeight: "600" }}>
                {(count > 1 ? t.scanHistory.scanCountPlural : t.scanHistory.scanCount).replace("{{count}}", String(count))}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
