/**
 * Scan History Screen
 * Wired to tRPC scan.getHistory (Sprint 9)
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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

// ── Status helpers ────────────────────────────────

type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";

interface StatusConfig {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

function getStatusConfig(status: string | null, isDark: boolean): StatusConfig {
  switch (status as HalalStatus) {
    case "halal":
      return {
        label: "Halal",
        icon: "verified",
        bgColor: isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)",
        textColor: isDark ? "#4ade80" : "#15803d",
        iconColor: "#22c55e",
      };
    case "haram":
      return {
        label: "Haram",
        icon: "cancel",
        bgColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
        textColor: isDark ? "#f87171" : "#dc2626",
        iconColor: "#ef4444",
      };
    case "doubtful":
      return {
        label: "Douteux",
        icon: "help",
        bgColor: isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.1)",
        textColor: isDark ? "#fb923c" : "#c2410c",
        iconColor: "#f97316",
      };
    default:
      return {
        label: "Inconnu",
        icon: "help-outline",
        bgColor: isDark ? "rgba(156,163,175,0.15)" : "rgba(156,163,175,0.1)",
        textColor: isDark ? "#9ca3af" : "#6b7280",
        iconColor: "#9ca3af",
      };
  }
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
}

const ScanRow = React.memo(function ScanRow({ item, index, isDark, colors }: ScanRowProps) {
  const status = getStatusConfig(item.halalStatus, isDark);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <TouchableOpacity
        onPress={() => router.push(`/scan-result?barcode=${item.barcode}`)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.product?.name ?? item.barcode}, ${status.label}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderWidth: 1,
        }}
      >
        {/* Product Image */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
            marginRight: 12,
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
              <MaterialIcons name="inventory-2" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}
            numberOfLines={1}
          >
            {item.product?.name ?? "Produit inconnu"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }} numberOfLines={1}>
            {item.product?.brand ?? item.barcode}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>
            {formatDate(item.scannedAt)}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={{ alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: status.bgColor,
            }}
          >
            <MaterialIcons name={status.icon} size={18} color={status.iconColor} />
          </View>
          <Text style={{ fontSize: 9, fontWeight: "600", color: status.textColor }}>
            {status.label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const scanKeyExtractor = (item: ScanItem) => item.id;

// ── Main Screen ───────────────────────────────────

export default function ScanHistoryScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useScanHistory({ limit: 50 });

  const scans = useMemo(() => (data?.items ?? []) as ScanItem[], [data]);

  const renderItem = useCallback(
    ({ item, index }: { item: ScanItem; index: number }) => (
      <ScanRow item={item} index={index} isDark={isDark} colors={colors} />
    ),
    [isDark, colors]
  );

  // Loading
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header colors={colors} t={t} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header colors={colors} t={t} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
            Impossible de charger l'historique
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
          >
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header colors={colors} t={t} count={scans.length} />

      {scans.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
          <MaterialIcons name="history" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 16 }}>
            Aucun scan
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
            Scannez un produit pour voir son historique ici.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/scanner")}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Scanner un produit"
          >
            <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#102217" : "#0d1b13"} />
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>Scanner un produit</Text>
          </TouchableOpacity>
        </View>
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
  );
}

// ── Header Component ──────────────────────────────

function Header({ colors, t, count }: { colors: any; t: any; count?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 12,
            height: 40,
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            backgroundColor: colors.card,
            borderColor: colors.borderLight,
            borderWidth: 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text
            style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary }}
            accessibilityRole="header"
          >
            Historique
          </Text>
          {count !== undefined && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {count} scan{count > 1 ? "s" : ""} effectué{count > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
