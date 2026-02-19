/**
 * Ethical Alerts Feed Screen
 *
 * Flux d'alertes temps réel depuis l'API avec:
 * - Filtres par sévérité (Tous, Critique, Avertissement, Info)
 * - Timeline avec carte d'alerte stylée par sévérité
 * - Pull-to-refresh + pagination cursor
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInLeft,
} from "react-native-reanimated";

import { Card, EmptyState, IslamicPattern } from "@/components/ui";
import { AlertsSkeleton } from "@/components/skeletons";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import type { TranslationKeys } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";
import { semantic } from "@/theme/colors";

// ── Severity → Visual Config ────────────────────────────────

type Severity = "critical" | "warning" | "info";

const SEVERITY_CONFIG: Record<
  Severity,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bgColor: string;
  }
> = {
  critical: {
    icon: "error",
    color: semantic.danger.base,
    bgColor: "rgba(239,68,68,0.1)",
  },
  warning: {
    icon: "warning",
    color: semantic.warning.base,
    bgColor: "rgba(245,158,11,0.15)",
  },
  info: {
    icon: "info",
    color: semantic.info.base,
    bgColor: "rgba(59,130,246,0.1)",
  },
};

// ── Locale Map ──────────────────────────────────────────────

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

// ── Relative Time Helper ────────────────────────────────────

function formatRelativeTime(date: string | Date, t: any, locale: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t.alerts.timeAgoJustNow;
  if (diffMin < 60) return t.alerts.timeAgoMinutes.replace("{{count}}", String(diffMin));
  if (diffHours < 24) return t.alerts.timeAgoHours.replace("{{count}}", String(diffHours));
  if (diffDays < 7) return t.alerts.timeAgoDays.replace("{{count}}", String(diffDays));
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

// ── Alert Card ──────────────────────────────────────────────

interface AlertItem {
  id: string;
  title: string;
  summary: string;
  severity: string;
  imageUrl: string | null;
  publishedAt: string | Date;
  sourceUrl: string | null;
  categoryId: string | null;
}

/** Theme colors subset needed by AlertCard */
interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderLight: string;
  buttonSecondary: string;
}

interface AlertCardProps {
  alert: AlertItem;
  index: number;
  isDark: boolean;
  colors: ThemeColors;
  t: TranslationKeys;
  locale: string;
}

const AlertCard = React.memo(function AlertCard({ alert, index, isDark, colors, t, locale }: AlertCardProps) {
  const severity = (alert.severity as Severity) || "info";
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  const severityLabel = t.alerts.severity[severity] ?? t.alerts.severity.info;

  return (
    <Animated.View
      entering={FadeInLeft.delay(100 + index * 80).duration(400)}
      className="flex-row"
    >
      {/* Timeline Icon */}
      <View className="items-center w-14 pt-1">
        <View
          className="w-14 h-14 rounded-full items-center justify-center border-4"
          style={{
            backgroundColor: config.bgColor,
            borderColor: isDark ? "#112116" : "#f6f8f6",
          }}
        >
          <MaterialIcons name={config.icon} size={24} color={config.color} />
        </View>
        {/* Timeline line */}
        <View
          className="flex-1 w-0.5 mt-2"
          style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
        />
      </View>

      {/* Card Content */}
      <View className="flex-1 pl-3 pb-8">
        {/* Badge & Time */}
        <View className="flex-row items-center justify-between mb-2">
          <View
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: config.bgColor }}
          >
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {severityLabel}
            </Text>
          </View>
          <Text
            className="text-xs font-medium"
            style={{ color: colors.textMuted }}
          >
            {formatRelativeTime(alert.publishedAt, t, locale)}
          </Text>
        </View>

        {/* Card */}
        <Card variant="outlined" className="overflow-hidden">
          {/* Image for critical alerts */}
          {severity === "critical" && alert.imageUrl && (
            <View className="h-40 w-full relative overflow-hidden">
              <Image
                source={{ uri: alert.imageUrl }}
                className="w-full h-full"
                contentFit="cover"
                transition={200}
                accessibilityLabel={`${alert.title}`}
              />
              <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Text className="absolute bottom-3 left-4 text-white text-lg font-bold">
                {alert.title}
              </Text>
            </View>
          )}

          <View className="p-4">
            {/* Title (non-critical, or critical without image) */}
            {(severity !== "critical" || !alert.imageUrl) && (
              <View className="flex-row gap-4 mb-3">
                <View className="flex-1">
                  <Text
                    className="font-bold text-lg leading-tight mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    {alert.title}
                  </Text>
                  <Text
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textSecondary }}
                  >
                    {alert.summary}
                  </Text>
                </View>
                {severity !== "critical" && alert.imageUrl && (
                  <View
                    className="w-24 h-24 rounded-lg overflow-hidden"
                    style={{ backgroundColor: colors.buttonSecondary }}
                  >
                    <Image
                      source={{ uri: alert.imageUrl }}
                      className="w-full h-full"
                      contentFit="cover"
                      transition={200}
                      accessibilityLabel={`Image : ${alert.title}`}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Summary for critical with image */}
            {severity === "critical" && alert.imageUrl && (
              <Text
                className="text-sm leading-relaxed mb-3"
                style={{ color: colors.textSecondary }}
              >
                {alert.summary}
              </Text>
            )}

            {/* Source link */}
            {alert.sourceUrl && (
              <View
                className="pt-3 flex-row items-center justify-between"
                style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.buttonSecondary }}
                  >
                    <MaterialIcons name="public" size={12} color="#64748b" />
                  </View>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.textMuted }}
                  >
                    {t.alerts.source}
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  accessibilityRole="link"
                  accessibilityLabel={`${t.alerts.viewSource} - ${alert.title}`}
                  onPress={() => {
                    if (alert.sourceUrl) Linking.openURL(alert.sourceUrl);
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: config.color }}
                  >
                    {t.alerts.viewSource}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={14} color={config.color} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
      </View>
    </Animated.View>
  );
});

// ── Main Screen ─────────────────────────────────────────────

const FILTERS: { id: string; severity?: "critical" | "warning" | "info" }[] = [
  { id: "all" },
  { id: "critical", severity: "critical" },
  { id: "warning", severity: "warning" },
  { id: "info", severity: "info" },
];

// Filter labels are resolved from t.alerts.severity + t.common.all inside the component

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t, language } = useTranslation();
  const locale = LOCALE_MAP[language] ?? "fr-FR";

  const [activeFilter, setActiveFilter] = useState("all");

  const filterLabels: Record<string, string> = {
    all: t.common.all,
    critical: t.alerts.severity.critical,
    warning: t.alerts.severity.warning,
    info: t.alerts.severity.info,
  };

  const selectedSeverity = FILTERS.find((f) => f.id === activeFilter)?.severity;

  const alertsQuery = trpc.alert.list.useQuery(
    {
      limit: 20,
      ...(selectedSeverity ? { severity: selectedSeverity } : {}),
    },
    { staleTime: 60_000 }
  );

  const alertItems = (alertsQuery.data?.items ?? []) as AlertItem[];

  const handleFilterChange = useCallback(
    (filterId: string) => {
      impact();
      setActiveFilter(filterId);
    },
    [impact]
  );

  const handleRefresh = useCallback(() => {
    alertsQuery.refetch();
  }, [alertsQuery]);

  // Loading state
  if (alertsQuery.isPending) {
    return <AlertsSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Background Islamic Pattern */}
      <IslamicPattern variant="tessellation" opacity={0.02} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          paddingTop: insets.top,
          backgroundColor: isDark ? "rgba(10,26,16,0.95)" : "rgba(248,250,249,0.95)",
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3">
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              <MaterialIcons name="security" size={20} color="#0d1b13" />
            </View>
            <Text
              accessibilityRole="header"
              className="text-xl font-bold tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              {t.alerts.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings/notifications")}
            className="relative p-2 rounded-full"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.settings}
            accessibilityHint={t.common.notifications}
          >
            <MaterialIcons
              name="settings"
              size={24}
              color={isDark ? "#d1d5db" : "#475569"}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleFilterChange(filter.id)}
                className="h-9 px-5 rounded-full items-center justify-center"
                style={
                  isActive
                    ? { backgroundColor: isDark ? "#ffffff" : "#0f172a" }
                    : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight }
                }
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${filterLabels[filter.id]}${
                  isActive ? `, ${t.common.selected}` : ""
                }`}
                accessibilityHint={filterLabels[filter.id]}
              >
                <Text
                  className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                  style={{
                    color: isActive
                      ? (isDark ? "#0f172a" : "#ffffff")
                      : colors.textSecondary,
                  }}
                >
                  {filterLabels[filter.id]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      </Animated.View>

      {/* Error State */}
      {alertsQuery.isError && (
        <View className="flex-1 items-center justify-center p-8">
          <MaterialIcons
            name="cloud-off"
            size={48}
            color={isDark ? "#475569" : "#94a3b8"}
          />
          <Text
            className="text-base font-medium mt-4 text-center"
            style={{ color: colors.textMuted }}
          >
            {t.alerts.loadError}
          </Text>
          <TouchableOpacity
            onPress={() => alertsQuery.refetch()}
            className="mt-4 px-6 py-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
            activeOpacity={0.8}
          >
            <Text className="font-bold text-sm" style={{ color: "#0d1b13" }}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!alertsQuery.isError && (
        <FlashList
          data={alertItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AlertCard alert={item} index={index} isDark={isDark} colors={colors} t={t} locale={locale} />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off"
              title={t.common.noResults}
              message={t.common.noResults}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={alertsQuery.isFetching && !alertsQuery.isPending}
              onRefresh={handleRefresh}
              tintColor={isDark ? colors.primary : "#059669"}
            />
          }
        />
      )}
    </View>
  );
}
