/**
 * Boycott List Screen — BDS & Ethical Alerts
 * Wired to tRPC boycott.list (Sprint 9)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { trpc } from "@/lib/trpc";

// ── Level helpers ─────────────────────────────────

type BoycottLevel = "official_bds" | "grassroots" | "pressure" | "community";

function getLevelFilters(t: ReturnType<typeof useTranslation>["t"]): { id: BoycottLevel | "all"; label: string }[] {
  return [
    { id: "all", label: t.boycott.filters.all },
    { id: "official_bds", label: t.boycott.filters.officialBds },
    { id: "grassroots", label: t.boycott.filters.grassroots },
    { id: "pressure", label: t.boycott.filters.pressure },
    { id: "community", label: t.boycott.filters.community },
  ];
}

function getLevelConfig(level: string, isDark: boolean, t: ReturnType<typeof useTranslation>["t"]) {
  switch (level) {
    case "official_bds":
      return {
        label: t.boycott.levels.bds,
        bgColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
        textColor: isDark ? "#f87171" : "#dc2626",
        icon: "gavel" as const,
      };
    case "grassroots":
      return {
        label: t.boycott.levels.grassroots,
        bgColor: isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.1)",
        textColor: isDark ? "#fb923c" : "#c2410c",
        icon: "people" as const,
      };
    case "pressure":
      return {
        label: t.boycott.levels.pressure,
        bgColor: isDark ? "rgba(234,179,8,0.15)" : "rgba(234,179,8,0.1)",
        textColor: isDark ? "#fbbf24" : "#a16207",
        icon: "trending-up" as const,
      };
    default:
      return {
        label: t.boycott.levels.community,
        bgColor: isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)",
        textColor: isDark ? "#60a5fa" : "#2563eb",
        icon: "groups" as const,
      };
  }
}

function getSeverityColor(severity: string, isDark: boolean) {
  switch (severity) {
    case "critical":
      return isDark ? "#f87171" : "#dc2626";
    case "high":
      return isDark ? "#fb923c" : "#ea580c";
    default:
      return isDark ? "#fbbf24" : "#ca8a04";
  }
}

// ── Boycott Card Component ────────────────────────

interface BoycottItem {
  id: string;
  companyName: string;
  brands: string[];
  parentCompany: string | null;
  boycottLevel: string;
  severity: string;
  reason: string;
  reasonSummary: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  logoUrl: string | null;
}

const BoycottCard = React.memo(function BoycottCard({
  item,
  index,
  isDark,
  colors,
  t,
}: {
  item: BoycottItem;
  index: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const level = getLevelConfig(item.boycottLevel, isDark, t);
  const severityColor = getSeverityColor(item.severity, isDark);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderWidth: 1,
          borderLeftWidth: 4,
          borderLeftColor: severityColor,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }} numberOfLines={1}>
              {item.companyName}
            </Text>
            {item.parentCompany && (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {t.boycott.parentGroup} : {item.parentCompany}
              </Text>
            )}
          </View>
          <View style={{ backgroundColor: level.bgColor, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name={level.icon} size={12} color={level.textColor} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: level.textColor, textTransform: "uppercase" }}>
              {level.label}
            </Text>
          </View>
        </View>

        {/* Brands */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {item.brands.slice(0, 6).map((brand) => (
            <View
              key={brand}
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "500" }}>
                {brand}
              </Text>
            </View>
          ))}
          {item.brands.length > 6 && (
            <Text style={{ fontSize: 11, color: colors.textMuted, alignSelf: "center" }}>
              +{item.brands.length - 6}
            </Text>
          )}
        </View>

        {/* Reason */}
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>
          {item.reasonSummary || item.reason}
        </Text>

        {/* Source */}
        {item.sourceName && (
          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>
            {t.boycott.source} : {item.sourceName}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

const boycottKeyExtractor = (item: BoycottItem) => item.id;

// ── Main Screen ───────────────────────────────────

export default function BoycottListScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<BoycottLevel | "all">("all");

  const level = selectedLevel === "all" ? undefined : selectedLevel;
  const { data, isLoading, isError, refetch } = trpc.boycott.list.useQuery(
    { level, limit: 100 },
    { staleTime: 1000 * 60 * 10 }
  );

  const items = useMemo(() => (data?.items ?? []) as BoycottItem[], [data]);

  const renderItem = useCallback(
    ({ item, index }: { item: BoycottItem; index: number }) => (
      <BoycottCard item={item} index={index} isDark={isDark} colors={colors} t={t} />
    ),
    [isDark, colors, t]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginEnd: 12, height: 44, width: 44, alignItems: "center", justifyContent: "center",
              borderRadius: 22, backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary }} accessibilityRole="header">
              {t.boycott.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {(items.length > 1 ? t.boycott.companyCountPlural : t.boycott.companyCount).replace("{{count}}", String(items.length))}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Level Filter */}
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <FlashList
          horizontal
          data={getLevelFilters(t)}
          keyExtractor={(item) => item.id}
          renderItem={({ item: filter }) => {
            const isSelected = selectedLevel === filter.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedLevel(filter.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.borderLight, borderWidth: 1,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: isSelected ? "700" : "500",
                  color: isSelected ? (isDark ? "#102217" : "#0d1b13") : colors.textSecondary,
                }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          showsHorizontalScrollIndicator={false}
        />
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16 }}>{t.boycott.loadError}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
          <MaterialIcons name="check-circle" size={64} color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 16 }}>{t.boycott.noCompanies}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
            {t.boycott.noCompaniesDesc}
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={boycottKeyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
