/**
 * Ethical Alerts Screen — Premium World-Class Design
 *
 * Timeline-inspired layout with glass-morphism cards, severity gradients,
 * gold accents, staggered animations, and premium filter system.
 *
 * Features:
 * - Infinite scroll with cursor-based pagination
 * - Dual filter: category chips + severity pills
 * - Read/unread visual state (bold + glow dot for unread)
 * - "Mark all as read" header action
 * - Card tap → detail screen with haptic
 * - Pull-to-refresh
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Shadow } from "react-native-shadow-2";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { EmptyState, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { AlertsSkeleton } from "@/components/skeletons";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import { useMe } from "@/hooks/useAuth";
import type { TranslationKeys } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";
import { brand, glass, gold } from "@/theme/colors";

const STAGGER_MS = 50;

// ── Severity Config ────────────────────────────────────────

type Severity = "critical" | "warning" | "info";

const SEVERITY_CONFIG: Record<
  Severity,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bg: string;
    gradient: [string, string];
    glowDark: string;
    glowLight: string;
  }
> = {
  critical: {
    icon: "error",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    gradient: ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.03)"],
    glowDark: "rgba(239,68,68,0.20)",
    glowLight: "rgba(239,68,68,0.08)",
  },
  warning: {
    icon: "warning",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    gradient: ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.02)"],
    glowDark: "rgba(245,158,11,0.18)",
    glowLight: "rgba(245,158,11,0.06)",
  },
  info: {
    icon: "info",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.10)",
    gradient: ["rgba(59,130,246,0.10)", "rgba(59,130,246,0.02)"],
    glowDark: "rgba(59,130,246,0.15)",
    glowLight: "rgba(59,130,246,0.05)",
  },
};

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  recall: "warning",
  fraud: "gavel",
  boycott: "block",
  certification: "verified",
  community: "groups",
};

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

const SEVERITY_FILTERS: { id: string; severity?: Severity }[] = [
  { id: "all" },
  { id: "critical", severity: "critical" },
  { id: "warning", severity: "warning" },
  { id: "info", severity: "info" },
];

// ── Relative Time ──────────────────────────────────────────

function formatRelativeTime(date: string | Date, t: TranslationKeys, locale: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t.alerts.timeAgoJustNow;
  if (diffMin < 60) return t.alerts.timeAgoMinutes.replace("{{count}}", String(diffMin));
  if (diffHours < 24) return t.alerts.timeAgoHours.replace("{{count}}", String(diffHours));
  if (diffDays < 7) return t.alerts.timeAgoDays.replace("{{count}}", String(diffDays));
  return new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

// ── Premium Alert Card ──────────────────────────────────────

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

interface AlertCardProps {
  alert: AlertItem;
  index: number;
  isDark: boolean;
  colors: { textPrimary: string; textSecondary: string; textMuted: string; border: string };
  t: TranslationKeys;
  locale: string;
  isRead: boolean;
  categoryName: string;
  onPress: (id: string) => void;
}

const AlertCard = React.memo(function AlertCard({
  alert,
  index,
  isDark,
  colors,
  t,
  locale,
  isRead,
  categoryName,
  onPress,
}: AlertCardProps) {
  const severity = (alert.severity as Severity) || "info";
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * STAGGER_MS)
        .duration(450)
        .springify()
        .damping(20)}
    >
      <Shadow
        distance={isDark ? 6 : 8}
        startColor={isDark ? config.glowDark : "rgba(0,0,0,0.04)"}
        offset={[0, 2]}
        style={{ borderRadius: 20, width: "100%", marginBottom: 14 }}
      >
        <PressableScale
          onPress={() => onPress(alert.id)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
              borderColor: isDark ? glass.dark.border : glass.light.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={alert.title}
        >
          {/* Severity gradient glow — top edge */}
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardGlow}
            pointerEvents="none"
          />

          {/* Left severity accent bar */}
          <View style={[styles.severityBar, { backgroundColor: config.color }]} />

          <View style={styles.cardInner}>
            {/* Top row: unread glow dot + severity badge + category + time */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardTopLeft}>
                {!isRead && (
                  <View style={styles.unreadDotWrap}>
                    <View style={[styles.unreadDotGlow, { backgroundColor: config.color }]} />
                    <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
                  </View>
                )}
                <View style={[styles.severityPill, { backgroundColor: config.bg }]}>
                  <MaterialIcons name={config.icon} size={11} color={config.color} />
                  <Text style={[styles.severityText, { color: config.color }]}>
                    {t.alerts.severity[severity]}
                  </Text>
                </View>
                {categoryName ? (
                  <View style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
                    },
                  ]}>
                    <MaterialIcons
                      name={CATEGORY_ICONS[alert.categoryId ?? ""] ?? "info"}
                      size={10}
                      color={isDark ? "#d1d5db" : "#64748b"}
                    />
                    <Text style={[styles.categoryText, { color: isDark ? "#d1d5db" : "#64748b" }]}>
                      {categoryName}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatRelativeTime(alert.publishedAt, t, locale)}
              </Text>
            </View>

            {/* Title + optional thumbnail */}
            <View style={styles.titleRow}>
              <View style={styles.titleWrap}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: colors.textPrimary,
                      fontWeight: isRead ? "500" : "700",
                      opacity: isRead ? 0.8 : 1,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {alert.title}
                </Text>
                <Text
                  style={[styles.cardSummary, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {alert.summary}
                </Text>
              </View>

              {alert.imageUrl && (
                <View style={styles.thumbWrap}>
                  <Image
                    source={{ uri: alert.imageUrl }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Subtle gold frame on image */}
                  <View
                    style={[
                      styles.thumbFrame,
                      {
                        borderColor: isDark
                          ? "rgba(207,165,51,0.20)"
                          : "rgba(0,0,0,0.08)",
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Source domain + chevron */}
            <View style={styles.cardFooter}>
              {alert.sourceUrl ? (
                <View style={styles.sourceRow}>
                  <MaterialIcons name="language" size={12} color={colors.textMuted} />
                  <Text
                    style={[styles.sourceText, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {(() => {
                      try { return new URL(alert.sourceUrl).hostname.replace("www.", ""); }
                      catch { return ""; }
                    })()}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <MaterialIcons
                name="arrow-forward-ios"
                size={12}
                color={isDark ? "rgba(207,165,51,0.40)" : "rgba(0,0,0,0.20)"}
              />
            </View>
          </View>
        </PressableScale>
      </Shadow>
    </Animated.View>
  );
});

// ── Main Screen ────────────────────────────────────────────

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t, language } = useTranslation();
  const locale = LOCALE_MAP[language] ?? "fr-FR";
  const { data: me } = useMe();
  const utils = trpc.useUtils();

  const [activeSeverity, setActiveSeverity] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const selectedSeverity = SEVERITY_FILTERS.find((f) => f.id === activeSeverity)?.severity;

  // ── Data ──
  const alertsQuery = trpc.alert.list.useInfiniteQuery(
    {
      limit: 20,
      ...(selectedSeverity ? { severity: selectedSeverity } : {}),
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 60_000,
    },
  );

  const categoriesQuery = trpc.alert.getCategories.useQuery(undefined, { staleTime: 300_000 });
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const readStatusQuery = trpc.alert.getReadAlertIds.useQuery(undefined, {
    enabled: !!me,
    staleTime: 30_000,
  });
  const readIds = useMemo(
    () => new Set(readStatusQuery.data?.readIds ?? []),
    [readStatusQuery.data?.readIds],
  );
  const dismissedIds = useMemo(
    () => new Set(readStatusQuery.data?.dismissedIds ?? []),
    [readStatusQuery.data?.dismissedIds],
  );

  const allItems = useMemo(
    () => (alertsQuery.data?.pages.flatMap((p) => p.items) ?? []) as AlertItem[],
    [alertsQuery.data?.pages],
  );

  const visibleItems = useMemo(
    () => (me ? allItems.filter((a) => !dismissedIds.has(a.id)) : allItems),
    [allItems, dismissedIds, me],
  );

  const getCategoryName = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return "";
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return categoryId;
      if (language === "ar") return cat.nameAr ?? cat.nameFr ?? cat.name;
      if (language === "fr") return cat.nameFr ?? cat.name;
      return cat.name;
    },
    [categories, language],
  );

  // ── Mark all as read ──
  const markAllMutation = trpc.alert.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.alert.getUnreadCount.invalidate();
      utils.alert.getReadAlertIds.invalidate();
    },
  });

  const handleMarkAllRead = useCallback(() => {
    impact();
    markAllMutation.mutate();
  }, [impact, markAllMutation]);

  // ── Navigation ──
  const handleBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleAlertPress = useCallback(
    (alertId: string) => {
      impact();
      router.push(`/alerts/${alertId}`);
    },
    [impact],
  );

  const handleSeverityChange = useCallback(
    (filterId: string) => {
      impact();
      setActiveSeverity(filterId);
    },
    [impact],
  );

  const handleCategoryChange = useCallback(
    (catId: string | null) => {
      impact();
      setActiveCategory((prev) => (prev === catId ? null : catId));
    },
    [impact],
  );

  const handleRefresh = useCallback(() => {
    alertsQuery.refetch();
    readStatusQuery.refetch();
  }, [alertsQuery, readStatusQuery]);

  const handleEndReached = useCallback(() => {
    if (alertsQuery.hasNextPage && !alertsQuery.isFetchingNextPage) {
      alertsQuery.fetchNextPage();
    }
  }, [alertsQuery]);

  const severityLabels: Record<string, string> = {
    all: t.common.all,
    critical: t.alerts.severity.critical,
    warning: t.alerts.severity.warning,
    info: t.alerts.severity.info,
  };

  // ── Loading ──
  if (alertsQuery.isPending) {
    return <AlertsSkeleton />;
  }

  return (
    <View style={styles.root}>
      <PremiumBackground />

      {/* ── Premium Header ── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {/* Title row with glass bg */}
        <View
          style={[
            styles.headerGlass,
            {
              backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)",
              borderBottomColor: isDark ? glass.dark.border : glass.light.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={handleBack}
                style={[
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.common.back}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              </Pressable>
              <View style={styles.headerTitleWrap}>
                <MaterialIcons
                  name="shield"
                  size={20}
                  color={isDark ? gold[500] : brand.primary}
                />
                <Text
                  accessibilityRole="header"
                  style={[styles.headerTitle, { color: colors.textPrimary }]}
                >
                  {t.alerts.title}
                </Text>
              </View>
            </View>

            {me && (
              <Pressable
                onPress={handleMarkAllRead}
                style={[
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.alerts.markAllRead}
              >
                <MaterialIcons
                  name="done-all"
                  size={20}
                  color={isDark ? gold[500] : brand.primary}
                />
              </Pressable>
            )}
          </View>

          {/* Category chips — scrollable row with glass pills */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                const catName =
                  language === "ar"
                    ? cat.nameAr ?? cat.nameFr ?? cat.name
                    : language === "fr"
                      ? cat.nameFr ?? cat.name
                      : cat.name;

                return (
                  <PressableScale
                    key={cat.id}
                    onPress={() => handleCategoryChange(cat.id)}
                    style={[
                      styles.filterChip,
                      isActive
                        ? {
                            backgroundColor: cat.color ?? brand.primary,
                            borderWidth: 1,
                            borderColor: "transparent",
                          }
                        : {
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(0,0,0,0.03)",
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.06)",
                          },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${catName}${isActive ? `, ${t.common.selected}` : ""}`}
                  >
                    <View style={styles.filterChipInner}>
                      <MaterialIcons
                        name={CATEGORY_ICONS[cat.id] ?? "info"}
                        size={13}
                        color={isActive ? "#fff" : (isDark ? "#a0a0a0" : "#64748b")}
                      />
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: isActive ? "#fff" : (isDark ? "#a0a0a0" : "#64748b"),
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                      >
                        {catName}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </ScrollView>
          )}

          {/* Severity pills row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filtersRow, { paddingBottom: 14 }]}
          >
            {SEVERITY_FILTERS.map((filter) => {
              const isActive = activeSeverity === filter.id;
              const sevConfig = filter.severity ? SEVERITY_CONFIG[filter.severity] : null;

              return (
                <PressableScale
                  key={filter.id}
                  onPress={() => handleSeverityChange(filter.id)}
                  style={[
                    styles.filterChip,
                    isActive
                      ? {
                          backgroundColor: sevConfig?.color ?? (isDark ? "#ffffff" : "#0f172a"),
                          borderWidth: 1,
                          borderColor: "transparent",
                        }
                      : {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.03)",
                          borderWidth: 1,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${severityLabels[filter.id]}${isActive ? `, ${t.common.selected}` : ""}`}
                >
                  <View style={styles.filterChipInner}>
                    {sevConfig && (
                      <View
                        style={[
                          styles.severityDotSmall,
                          { backgroundColor: isActive ? "#fff" : sevConfig.color },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: isActive
                            ? "#ffffff"
                            : isDark ? "#a0a0a0" : "#64748b",
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {severityLabels[filter.id]}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── Error State ── */}
      {alertsQuery.isError && (
        <View style={styles.errorWrap}>
          <View
            style={[
              styles.errorIconWrap,
              {
                backgroundColor: isDark
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(239,68,68,0.08)",
              },
            ]}
          >
            <MaterialIcons name="cloud-off" size={32} color="#ef4444" />
          </View>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t.alerts.loadError}
          </Text>
          <PressableScale
            onPress={() => alertsQuery.refetch()}
            style={[styles.retryBtn, { backgroundColor: brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </PressableScale>
        </View>
      )}

      {/* ── List ── */}
      {!alertsQuery.isError && (
        <FlashList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AlertCard
              alert={item}
              index={index}
              isDark={isDark}
              colors={colors}
              t={t}
              locale={locale}
              isRead={readIds.has(item.id)}
              categoryName={getCategoryName(item.categoryId)}
              onPress={handleAlertPress}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off"
              title={t.alerts.empty}
              message={t.alerts.noAlerts}
            />
          }
          ListFooterComponent={
            alertsQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={isDark ? gold[500] : brand.primary} />
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={alertsQuery.isFetching && !alertsQuery.isPending}
              onRefresh={handleRefresh}
              tintColor={isDark ? gold[500] : brand.primary}
            />
          }
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { zIndex: 10 },
  headerGlass: { borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },

  // Filters
  filtersRow: { paddingHorizontal: 16, paddingTop: 6, gap: 8 },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: "center",
  },
  filterChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterText: { fontSize: 13, lineHeight: 16, includeFontPadding: false },
  severityDotSmall: { width: 6, height: 6, borderRadius: 3 },

  // Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  severityBar: {
    width: 3,
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    borderRadius: 2,
  },
  cardInner: { paddingVertical: 16, paddingLeft: 18, paddingRight: 16 },

  // Card top
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  unreadDotWrap: { width: 10, height: 10, alignItems: "center", justifyContent: "center" },
  unreadDotGlow: { position: "absolute", width: 10, height: 10, borderRadius: 5, opacity: 0.4 },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },
  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  severityText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryText: { fontSize: 10, fontWeight: "600" },
  timeText: { fontSize: 11, fontWeight: "500" },

  // Card title
  titleRow: { flexDirection: "row", gap: 14 },
  titleWrap: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, lineHeight: 21, letterSpacing: -0.2 },
  cardSummary: { fontSize: 13, lineHeight: 19, opacity: 0.85 },

  // Thumbnail
  thumbWrap: { position: "relative" },
  thumb: { width: 76, height: 76, borderRadius: 14 },
  thumbFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1,
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
  },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sourceText: { fontSize: 11, fontWeight: "500", maxWidth: 180 },

  // Error
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  errorIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 15, fontWeight: "500", marginTop: 16, textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: "#0d1b13", fontWeight: "700", fontSize: 14 },

  // Footer
  footerLoader: { paddingVertical: 24, alignItems: "center" },
});
