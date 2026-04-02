/**
 * Ethical Alerts Screen — Apple Notifications-inspired design
 *
 * Compact cards, temporal grouping, monochrome glass, single severity
 * indicator, blur-gated tiering, sophisticated share system.
 *
 * Features:
 * - Temporal groups (Today, This week, Older) with sticky section headers
 * - Compact cards (72px) — see 5-6 without scrolling
 * - Single severity dot (no redundant gradients/bars/glows)
 * - Read/unread: bold title + dot vs muted
 * - Tiering: free=3 visible, rest blurred with lock overlay + upsell CTA
 * - Long-press → share sheet (branded image card)
 * - Infinite scroll, pull-to-refresh, cursor pagination
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  ChecksIcon,
  CloudSlashIcon,
  LockSimpleIcon,
} from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { EmptyState, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { AlertsSkeleton } from "@/components/skeletons";
import { useTranslation, useHaptics, useTheme, usePremium } from "@/hooks";
import { useMe } from "@/hooks/useAuth";
import type { TranslationKeys } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";
import { brand, glass, gold } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";
import { fontWeight, headingFontFamily } from "@/theme/typography";

// ── Constants ────────────────────────────────────────────

const FREE_ALERT_LIMIT = 3;

type Severity = "critical" | "warning" | "info";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const CATEGORY_ICONS: Record<string, IconName> = {
  recall: "warning",
  fraud: "gavel",
  boycott: "block",
  certification: "verified",
  community: "groups",
};

const SEVERITY_FILTERS: { id: string; severity?: Severity }[] = [
  { id: "all" },
  { id: "critical", severity: "critical" },
  { id: "warning", severity: "warning" },
  { id: "info", severity: "info" },
];

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

// ── Temporal grouping ────────────────────────────────────

type TemporalGroup = "today" | "thisWeek" | "older";

function getTemporalGroup(date: string | Date): TemporalGroup {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 1 && now.getDate() === d.getDate()) return "today";
  if (diffDays < 7) return "thisWeek";
  return "older";
}

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

// ── Alert item type ──────────────────────────────────────

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

// ── Section list item (alert or section header) ──────────

type ListItem =
  | { type: "header"; group: TemporalGroup; label: string }
  | { type: "alert"; data: AlertItem; index: number; isRead: boolean; categoryName: string; isGated: boolean };

// ── Compact Alert Card ───────────────────────────────────

interface CompactAlertCardProps {
  alert: AlertItem;
  isRead: boolean;
  isGated: boolean;
  categoryName: string;
  isDark: boolean;
  colors: { textPrimary: string; textSecondary: string; textMuted: string; border: string };
  t: TranslationKeys;
  locale: string;
  onPress: (id: string) => void;
  onLongPress: (alert: AlertItem) => void;
}

const CompactAlertCard = React.memo(function CompactAlertCard({
  alert,
  isRead,
  isGated,
  categoryName,
  isDark,
  colors,
  t,
  locale,
  onPress,
  onLongPress,
}: CompactAlertCardProps) {
  const severity = (alert.severity as Severity) || "info";
  const sevColor = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.info;

  const hasImage = !!alert.imageUrl;

  return (
    <PressableScale
      onPress={() => onPress(alert.id)}
      onLongPress={() => onLongPress(alert)}
      delayLongPress={400}
      disabled={isGated}
      style={[styles.cardOuter, { opacity: isRead && !isGated ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={alert.title}
      accessibilityHint={isGated ? t.alerts.unlockAll : undefined}
    >
      {/* Inner row container — this is where layout lives */}
      <View
        style={[
          styles.cardInner,
          {
            backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
            borderColor: isDark ? glass.dark.border : glass.light.border,
          },
        ]}
      >
        {/* Left col: image (or severity strip if no image) */}
        {hasImage ? (
          <Image
            source={{ uri: alert.imageUrl! }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.severityStripNoImage, { backgroundColor: sevColor }]} />
        )}

        {/* Right col: text content */}
        <View style={styles.cardContent}>
          {/* Meta row: category pill + time */}
          <View style={styles.metaRow}>
            {categoryName ? (
              <View style={[styles.categoryPill, { backgroundColor: `${sevColor}18` }]}>
                <View style={[styles.categoryPillDot, { backgroundColor: sevColor }]} />
                <Text style={[styles.categoryLabel, { color: sevColor }]} numberOfLines={1}>
                  {categoryName}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
              {formatRelativeTime(alert.publishedAt, t, locale)}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.textPrimary,
                fontWeight: isRead ? "500" : "700",
                fontFamily: isRead ? undefined : headingFontFamily.bold,
              },
            ]}
            numberOfLines={2}
          >
            {alert.title}
          </Text>

          {/* Summary */}
          <Text
            style={[styles.cardSummary, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {alert.summary}
          </Text>
        </View>

        {/* Unread indicator */}
        {!isRead && !isGated && (
          <View style={[styles.unreadDot, { backgroundColor: sevColor }]} />
        )}

        {/* Blur overlay for gated cards */}
        {isGated && (
          <>
            <BlurView
              intensity={isDark ? 20 : 15}
              tint={isDark ? "dark" : "light"}
              style={styles.blurOverlay}
            />
            <View style={styles.lockBadge}>
              <LockSimpleIcon size={14} color={gold[500]} weight="fill" />
            </View>
          </>
        )}
      </View>
    </PressableScale>
  );
});

// ── Section Header ───────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  isDark: boolean;
  colors: { textSecondary: string };
}

const SectionHeader = React.memo(function SectionHeader({
  label,
  isDark,
  colors,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, {
        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      }]} />
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.sectionLine, {
        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      }]} />
    </View>
  );
});

// ── Main Screen ──────────────────────────────────────────

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t, language } = useTranslation();
  const locale = LOCALE_MAP[language] ?? "fr-FR";
  const { data: me } = useMe();
  const { isPremium, showPaywall } = usePremium();
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

  // Refetch read status when returning to alerts tab (after reading alert details)
  useFocusEffect(
    useCallback(() => {
      if (me) {
        readStatusQuery.refetch();
        alertsQuery.refetch();
      }
    }, [me?.id]),
  );
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

  const filteredItems = useMemo(
    () => (me ? allItems.filter((a) => !dismissedIds.has(a.id)) : allItems),
    [allItems, dismissedIds, me],
  );

  const isLimited = !isPremium && filteredItems.length > FREE_ALERT_LIMIT;

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

  // ── Build sectioned list with temporal grouping ──
  const sectionedItems = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    let lastGroup: TemporalGroup | null = null;

    const groupLabel: Record<TemporalGroup, string> = {
      today: t.alerts.groupToday ?? "Aujourd'hui",
      thisWeek: t.alerts.groupThisWeek ?? "Cette semaine",
      older: t.alerts.groupOlder ?? "Plus ancien",
    };

    for (let i = 0; i < filteredItems.length; i++) {
      const item = filteredItems[i];
      const group = getTemporalGroup(item.publishedAt);
      const isGated = isLimited && i >= FREE_ALERT_LIMIT;

      if (group !== lastGroup) {
        result.push({ type: "header", group, label: groupLabel[group] });
        lastGroup = group;
      }

      result.push({
        type: "alert",
        data: item,
        index: i,
        isRead: readIds.has(item.id),
        categoryName: getCategoryName(item.categoryId),
        isGated,
      });
    }

    return result;
  }, [filteredItems, readIds, getCategoryName, isLimited, t]);

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

  // ── Share (long-press) ──
  const handleAlertShare = useCallback(
    async (alert: AlertItem) => {
      impact();
      const severityLabel = (t.alerts.severity as Record<string, string>)[alert.severity] ?? "";
      const categoryName = getCategoryName(alert.categoryId);

      const lines = [
        `${severityLabel.toUpperCase()}${categoryName ? ` \u00b7 ${categoryName}` : ""}`,
        "",
        alert.title,
        alert.summary,
      ];
      if (alert.sourceUrl) lines.push("", alert.sourceUrl);
      lines.push("", `\u2014 via Naqiy \u00b7 naqiy.app`);

      await Share.share({
        title: alert.title,
        message: lines.join("\n"),
        ...(Platform.OS === "ios" && alert.sourceUrl ? { url: alert.sourceUrl } : {}),
      });
    },
    [impact, t, getCategoryName],
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

  // Unread count for header badge
  const unreadCount = useMemo(
    () => filteredItems.filter((a) => !readIds.has(a.id)).length,
    [filteredItems, readIds],
  );

  // ── Loading ──
  if (alertsQuery.isPending) {
    return <AlertsSkeleton />;
  }

  return (
    <View style={styles.root}>
      <PremiumBackground />

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View
          style={[
            styles.headerGlass,
            {
              backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)",
              borderBottomColor: isDark ? glass.dark.border : glass.light.border,
            },
          ]}
        >
          {/* Title row */}
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
                <ArrowLeftIcon size={20} color={colors.textPrimary} />
              </Pressable>
              <Text
                accessibilityRole="header"
                style={[styles.headerTitle, { color: colors.textPrimary }]}
              >
                {t.alerts.title}
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.headerBadge, { backgroundColor: SEVERITY_COLOR.critical }]}>
                  <Text style={styles.headerBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {me && unreadCount > 0 && (
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
                  <ChecksIcon size={20}
                    color={isDark ? gold[500] : brand.primary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter row — single line: categories + severity merged */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {/* Severity pills first */}
            {SEVERITY_FILTERS.map((filter) => {
              const isActive = activeSeverity === filter.id;
              const sevColor = filter.severity ? SEVERITY_COLOR[filter.severity] : null;

              return (
                <Pressable
                  key={`sev-${filter.id}`}
                  onPress={() => handleSeverityChange(filter.id)}
                  style={[
                    styles.filterChip,
                    isActive
                      ? {
                          backgroundColor: isDark ? "#ffffff" : "#0f172a",
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
                >
                  <View style={styles.filterChipInner}>
                    {sevColor && (
                      <View
                        style={[
                          styles.filterDot,
                          { backgroundColor: isActive ? sevColor : sevColor },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: isActive
                            ? (isDark ? "#0f172a" : "#ffffff")
                            : (isDark ? "#a0a0a0" : "#64748b"),
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {severityLabels[filter.id]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Separator */}
            {categories.length > 0 && (
              <View style={[styles.filterSeparator, {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }]} />
            )}

            {/* Category chips */}
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const catName =
                language === "ar"
                  ? cat.nameAr ?? cat.nameFr ?? cat.name
                  : language === "fr"
                    ? cat.nameFr ?? cat.name
                    : cat.name;

              return (
                <Pressable
                  key={`cat-${cat.id}`}
                  onPress={() => handleCategoryChange(cat.id)}
                  style={[
                    styles.filterChip,
                    isActive
                      ? {
                          backgroundColor: cat.color ?? brand.primary,
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
                >
                  <View style={styles.filterChipInner}>
                    <AppIcon
                      name={CATEGORY_ICONS[cat.id] ?? "info"}
                      size={12}
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
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── Error State ── */}
      {alertsQuery.isError && (
        <View style={styles.errorWrap}>
          <CloudSlashIcon size={32} color="#ef4444" />
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
          data={sectionedItems}
          keyExtractor={(item) =>
            item.type === "header" ? `hdr-${item.group}` : item.data.id
          }
          getItemType={(item) => item.type}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <SectionHeader
                  label={item.label}
                  isDark={isDark}
                  colors={colors}
                />
              );
            }

            return (
              <CompactAlertCard
                alert={item.data}
                isRead={item.isRead}
                isGated={item.isGated}
                categoryName={item.categoryName}
                isDark={isDark}
                colors={colors}
                t={t}
                locale={locale}
                onPress={item.isGated ? () => showPaywall("alert_history") : handleAlertPress}
                onLongPress={handleAlertShare}
              />
            );
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
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
            ) : isLimited ? (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <PressableScale
                  onPress={() => showPaywall("alert_history")}
                  style={[
                    styles.upsellCard,
                    {
                      backgroundColor: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.04)",
                      borderColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.10)",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t.alerts.unlockAll}
                >
                  <LockSimpleIcon size={18} color={isDark ? gold[400] : gold[700]} weight="fill" />
                  <View style={styles.upsellTextWrap}>
                    <Text style={[styles.upsellTitle, { color: colors.textPrimary }]}>
                      {`+${filteredItems.length - FREE_ALERT_LIMIT} ${t.alerts.upsellTitle}`}
                    </Text>
                    <Text style={[styles.upsellSub, { color: colors.textSecondary }]}>
                      {t.alerts.upsellSub}
                    </Text>
                  </View>
                  <CaretRightIcon size={14} color={colors.textMuted} />
                </PressableScale>
              </Animated.View>
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

  // ── Header ──
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    letterSpacing: -0.5,
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },

  // ── Filters (single row) ──
  filtersRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
    alignItems: "center",
  },
  filterChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: "center",
  },
  filterChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 12, lineHeight: 16 },
  filterSeparator: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
  },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Compact Alert Card ──
  cardOuter: {
    marginBottom: 10,
  },
  cardInner: {
    flexDirection: "row",
    height: 110,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  // Image — left column, fills full card height
  cardImage: {
    width: 90,
    height: 110,
  },
  // Severity strip fallback when no image
  severityStripNoImage: {
    width: 4,
    height: 110,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  // Text — right column
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  cardSummary: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.7,
    marginTop: 2,
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // ── Blur gate for free tier ──
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  lockBadge: {
    position: "absolute",
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },

  // ── Error ──
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  errorText: { fontSize: 15, fontWeight: "500", textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: "#0d1b13", fontWeight: "700", fontSize: 14 },

  // ── Footer ──
  footerLoader: { paddingVertical: 24, alignItems: "center" },
  upsellCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  upsellTextWrap: { flex: 1, gap: 1 },
  upsellTitle: { fontSize: 13, fontWeight: "700" },
  upsellSub: { fontSize: 11 },
});
