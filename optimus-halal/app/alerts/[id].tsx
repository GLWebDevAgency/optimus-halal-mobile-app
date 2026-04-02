/**
 * Alert Detail Screen — Premium World-Class Design
 *
 * Full-bleed cover hero with severity-tinted gradient, glass-morphism badges,
 * arabesque wavelet divider, elegant typography, source CTA, related alerts.
 * Auto mark-as-read on mount for authenticated users.
 *
 * Design: mirrors articles/[id].tsx premium patterns with severity-aware theming.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowSquareOutIcon, BellRingingIcon, CaretRightIcon, ClockIcon, GlobeIcon, SparkleIcon } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shadow } from "react-native-shadow-2";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks";
import { useMe } from "@/hooks/useAuth";
import { PremiumBackground } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { PressableScale } from "@/components/ui/PressableScale";
import { NaqiyMarkdown } from "@/components/ui/NaqiyMarkdown";
import { RecallInfoSection } from "@/components/content/RecallInfoSection";
import { trpc } from "@/lib/trpc";
import { brand, glass, gold } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_HEIGHT = 340;

type Severity = "critical" | "warning" | "info";

const SEVERITY_CONFIG: Record<
  Severity,
  {
    color: string;
    icon: IconName;
    heroGradientDark: [string, string, string];
    heroGradientLight: [string, string, string];
  }
> = {
  critical: {
    color: "#ef4444",
    icon: "error",
    heroGradientDark: ["#1a0a0a", "#1e1111", "#0C0C0C"],
    heroGradientLight: ["#fef2f2", "#fecaca", "#f3f1ed"],
  },
  warning: {
    color: "#f59e0b",
    icon: "warning",
    heroGradientDark: ["#1a140a", "#1e1b11", "#0C0C0C"],
    heroGradientLight: ["#fffbeb", "#fde68a", "#f3f1ed"],
  },
  info: {
    color: "#3b82f6",
    icon: "info",
    heroGradientDark: ["#0a0f1a", "#111722", "#0C0C0C"],
    heroGradientLight: ["#eff6ff", "#bfdbfe", "#f3f1ed"],
  },
};

const CATEGORY_ICONS: Record<string, IconName> = {
  recall: "warning",
  fraud: "gavel",
  boycott: "block",
  certification: "verified",
  community: "groups",
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const { impact } = useHaptics();
  const { data: me } = useMe();
  const utils = trpc.useUtils();

  const { data: alert, isLoading, error } = trpc.alert.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );

  const { data: categories } = trpc.alert.getCategories.useQuery(undefined, {
    staleTime: 300_000,
  });

  // Related alerts (same category, exclude self)
  const { data: relatedData } = trpc.alert.list.useQuery(
    { limit: 4, category: alert?.categoryId ?? undefined },
    { enabled: !!alert?.categoryId, staleTime: 60_000 },
  );

  const relatedAlerts = useMemo(
    () => (relatedData?.items ?? []).filter((a) => a.id !== id).slice(0, 3),
    [relatedData, id],
  );

  // Auto mark as read for authenticated users
  const markAsRead = trpc.alert.markAsRead.useMutation({
    onSuccess: () => {
      utils.alert.getUnreadCount.invalidate();
      utils.alert.getReadAlertIds.invalidate();
    },
  });

  useEffect(() => {
    if (me && id) {
      markAsRead.mutate({ alertId: id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me?.id]);

  const handleBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleShare = useCallback(async () => {
    if (!alert) return;
    impact();
    await Share.share({
      title: alert.title,
      message: alert.sourceUrl
        ? `${alert.title}\n${alert.sourceUrl}`
        : alert.title,
      ...(Platform.OS === "ios" && alert.sourceUrl
        ? { url: alert.sourceUrl }
        : {}),
    });
  }, [alert, impact]);

  const handleOpenSource = useCallback(() => {
    impact();
    if (alert?.sourceUrl) Linking.openURL(alert.sourceUrl);
  }, [impact, alert?.sourceUrl]);

  const handleRelatedPress = useCallback(
    (alertId: string) => {
      impact();
      router.push(`/alerts/${alertId}`);
    },
    [impact],
  );

  const severity = (alert?.severity as Severity) ?? "info";
  const sevConfig = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  const categoryIcon = CATEGORY_ICONS[alert?.categoryId ?? "community"] ?? "info";

  const categoryName = useMemo(() => {
    if (!alert?.categoryId || !categories) return "";
    const cat = categories.find((c) => c.id === alert.categoryId);
    if (!cat) return alert.categoryId;
    if (language === "ar") return cat.nameAr ?? cat.nameFr ?? cat.name;
    if (language === "fr") return cat.nameFr ?? cat.name;
    return cat.name;
  }, [alert?.categoryId, categories, language]);

  const dateLocale = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR";
  const formattedDate = alert?.publishedAt
    ? new Date(alert.publishedAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const sourceHostname = useMemo(() => {
    if (!alert?.sourceUrl) return "";
    try { return new URL(alert.sourceUrl).hostname.replace("www.", ""); }
    catch { return ""; }
  }, [alert?.sourceUrl]);

  // --- Loading ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <PremiumBackground />
        <ActivityIndicator size="large" color={isDark ? gold[500] : brand.primary} />
      </View>
    );
  }

  // --- Error / Not found ---
  if (error || !alert) {
    return (
      <View style={styles.center}>
        <PremiumBackground />
        <View
          style={[
            styles.errorIconBg,
            { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" },
          ]}
        >
          <BellRingingIcon size={40} color="#ef4444" />
        </View>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {t.alerts.notFound}
        </Text>
        <PressableScale
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: brand.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Text style={styles.backBtnText}>{t.common.back}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ---- Cover / Hero ---- */}
        <View style={styles.coverWrap}>
          {alert.imageUrl ? (
            <Image
              source={{ uri: alert.imageUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={isDark ? sevConfig.heroGradientDark : sevConfig.heroGradientLight}
              style={styles.coverImage}
            />
          )}

          {/* Scrim gradient — stronger at top (for icons) and bottom (for text fade) */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.50)",
              "transparent",
              "transparent",
              isDark ? "rgba(12,12,12,0.98)" : "rgba(243,241,237,0.98)",
            ]}
            locations={[0, 0.3, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar — glass icon buttons */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <BackButton variant="overlay" />

            <ShareButton variant="overlay" onPress={handleShare} label={t.alerts.share} />
          </View>

          {/* Badges row — severity + category (glass pills) */}
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.badgesRow}
          >
            <View style={[styles.severityBadge, { backgroundColor: sevConfig.color }]}>
              <AppIcon name={sevConfig.icon} size={12} color="#fff" />
              <Text style={styles.badgeText}>
                {t.alerts.severity[severity]}
              </Text>
            </View>
            <View
              style={[
                styles.categoryChip,
                {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.25)",
                },
              ]}
            >
              <AppIcon name={categoryIcon} size={12} color="#fff" />
              <Text style={styles.categoryChipText}>
                {categoryName}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* ---- Content ---- */}
        <View style={styles.contentWrap}>
          {/* Title */}
          <Animated.Text
            entering={FadeInUp.delay(100).duration(500)}
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {alert.title}
          </Animated.Text>

          {/* Meta row — date + source domain */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.metaRow}
          >
            <View style={styles.metaItem}>
              <ClockIcon size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formattedDate}
              </Text>
            </View>
            {sourceHostname ? (
              <>
                <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
                <View style={styles.metaItem}>
                  <GlobeIcon size={14} color={colors.textMuted} />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {sourceHostname}
                  </Text>
                </View>
              </>
            ) : null}
          </Animated.View>

          {/* Arabesque wavelet divider — severity-tinted */}
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={styles.waveletRow}
          >
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Svg width={24} height={12} viewBox="0 0 24 12">
              <Path
                d="M0,6 Q6,0 12,6 Q18,12 24,6"
                stroke={sevConfig.color}
                strokeWidth={1.5}
                fill="none"
                opacity={0.5}
              />
            </Svg>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Summary — italic lead paragraph */}
          <Animated.Text
            entering={FadeInDown.delay(350).duration(500)}
            style={[styles.summary, { color: colors.textSecondary }]}
          >
            {alert.summary}
          </Animated.Text>

          {/* Content — dual mode: structured recall cards vs markdown */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            {alert.recallData ? (
              <RecallInfoSection data={alert.recallData} />
            ) : (
              <NaqiyMarkdown accentColor={sevConfig.color}>
                {alert.content}
              </NaqiyMarkdown>
            )}
          </Animated.View>

          {/* Source CTA — only for non-recall alerts (recalls have their own buttons) */}
          {!alert.recallData && alert.sourceUrl && (
            <Animated.View entering={FadeInDown.delay(450).duration(500)}>
              <PressableScale
                onPress={handleOpenSource}
                style={[
                  styles.ctaButton,
                  { backgroundColor: isDark ? "#ffffff" : "#0f172a" },
                ]}
                accessibilityRole="link"
                accessibilityLabel={t.alerts.viewSource}
              >
                <ArrowSquareOutIcon size={18} color={isDark ? "#0f172a" : "#ffffff"} />
                <Text style={[styles.ctaText, { color: isDark ? "#0f172a" : "#ffffff" }]}>
                  {t.alerts.viewSource}
                </Text>
                <Text style={[styles.ctaDomain, { color: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)" }]}>
                  {sourceHostname}
                </Text>
              </PressableScale>
            </Animated.View>
          )}

          {/* Related alerts — premium glass cards */}
          {relatedAlerts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(500)}>
              <View style={styles.relatedHeader}>
                <SparkleIcon size={16}
                  color={isDark ? gold[500] : brand.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t.alerts.relatedAlerts}
                </Text>
              </View>
              {relatedAlerts.map((related, index) => {
                const relSev = (related.severity as Severity) ?? "info";
                const relConfig = SEVERITY_CONFIG[relSev] ?? SEVERITY_CONFIG.info;

                return (
                  <Animated.View
                    key={related.id}
                    entering={FadeInDown.delay(550 + index * 60).duration(400)}
                  >
                    <PressableScale
                      onPress={() => handleRelatedPress(related.id)}
                      style={[
                        styles.relatedCard,
                        {
                          backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                          borderColor: isDark ? glass.dark.border : glass.light.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={related.title}
                    >
                      {/* Severity accent */}
                      <View
                        style={[styles.relatedAccent, { backgroundColor: relConfig.color }]}
                      />
                      <View style={styles.relatedContent}>
                        <View style={styles.relatedTopRow}>
                          <View style={[styles.relatedSevDot, { backgroundColor: relConfig.color }]} />
                          <Text style={[styles.relatedSevLabel, { color: relConfig.color }]}>
                            {t.alerts.severity[relSev]}
                          </Text>
                        </View>
                        <Text
                          style={[styles.relatedTitle, { color: colors.textPrimary }]}
                          numberOfLines={2}
                        >
                          {related.title}
                        </Text>
                        <Text style={[styles.relatedMeta, { color: colors.textMuted }]}>
                          {new Date(related.publishedAt).toLocaleDateString(dateLocale, {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                      </View>
                      <CaretRightIcon size={14}
                        color={isDark ? "rgba(207,165,51,0.40)" : "rgba(0,0,0,0.20)"} />
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  errorIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontWeight: "500", marginTop: 8 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Cover hero
  coverWrap: { width: SCREEN_WIDTH, height: COVER_HEIGHT, position: "relative" },
  coverImage: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  badgesRow: {
    position: "absolute",
    bottom: 20,
    left: 20,
    flexDirection: "row",
    gap: 8,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryChipText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Content
  contentWrap: { paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: "800", lineHeight: 34, letterSpacing: -0.5 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontWeight: "500" },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },

  waveletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1 },

  summary: {
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 20,
  },

  body: { fontSize: 16, lineHeight: 28, fontWeight: "400" },

  // Source CTA
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 22,
    marginTop: 28,
  },
  ctaText: { fontSize: 15, fontWeight: "700" },
  ctaDomain: { fontSize: 12, fontWeight: "500" },

  // Related alerts
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 36,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  relatedAccent: {
    width: 3,
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    borderRadius: 2,
  },
  relatedContent: { flex: 1, paddingLeft: 4, gap: 4 },
  relatedTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  relatedSevDot: { width: 6, height: 6, borderRadius: 3 },
  relatedSevLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  relatedTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  relatedMeta: { fontSize: 12, fontWeight: "500" },
});
