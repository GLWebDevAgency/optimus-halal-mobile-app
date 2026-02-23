/**
 * Article Detail Screen — "Killer 2026" Design
 *
 * Full-bleed cover, parallax header, elegant typography,
 * premium background, share action, tag chips.
 */

import React, { useCallback } from "react";
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
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks";
import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { trpc } from "@/lib/trpc";
import { brand, gold } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_HEIGHT = 360;

const TYPE_COLORS: Record<string, string> = {
  blog: brand.primary,
  educational: brand.primary,
  partner_news: gold[500],
  community: "#3b82f6",
};

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const { impact } = useHaptics();

  const { data: article, isLoading, error } = trpc.article.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );

  const handleBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    impact();
    await Share.share({
      title: article.title,
      message: article.externalLink
        ? `${article.title}\n${article.externalLink}`
        : article.title,
      ...(Platform.OS === "ios" && article.externalLink
        ? { url: article.externalLink }
        : {}),
    });
  }, [article, impact]);

  const handleOpenSource = useCallback(() => {
    impact();
    if (article?.externalLink) Linking.openURL(article.externalLink);
  }, [impact, article?.externalLink]);

  const typeLabel =
    article?.type === "partner_news"
      ? t.home.partnerBadge
      : article?.type === "educational"
        ? t.home.guideBadge
        : article?.type === "community"
          ? t.articles.communityBadge
          : t.home.blogBadge;

  const accentColor = TYPE_COLORS[article?.type ?? "blog"] ?? brand.primary;

  const dateLocale = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR";
  const formattedDate = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // --- Loading state ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <PremiumBackground />
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  // --- Error state ---
  if (error || !article) {
    return (
      <View style={styles.center}>
        <PremiumBackground />
        <MaterialIcons name="article" size={64} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {t.articles.notFound}
        </Text>
        <PressableScale
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: brand.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Text style={styles.backButtonText}>{t.common.back}</Text>
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
        {/* ---- Cover Image Hero ---- */}
        <View style={styles.coverWrap}>
          {article.coverImage ? (
            <Image
              source={{ uri: article.coverImage }}
              style={styles.coverImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={
                isDark
                  ? ["#132a1a", "#0a1a10"]
                  : ["#ecfdf5", "#f0fdf4"]
              }
              style={styles.coverImage}
            />
          )}

          {/* Scrim */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.4)",
              "transparent",
              "transparent",
              isDark ? "rgba(10,26,16,0.95)" : "rgba(248,250,249,0.95)",
            ]}
            locations={[0, 0.3, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={handleBack}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t.articles.share}
            >
              <MaterialIcons name="share" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Badge */}
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.badgeWrap}
          >
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{typeLabel}</Text>
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
            {article.title}
          </Animated.Text>

          {/* Meta row */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.metaRow}
          >
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {article.author}
              </Text>
            </View>
            <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {article.readTimeMinutes ?? 3} min
              </Text>
            </View>
            <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </Animated.View>

          {/* Arabesque wavelet divider */}
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={styles.waveletRow}
          >
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Svg width={24} height={12} viewBox="0 0 24 12">
              <Path
                d="M0,6 Q6,0 12,6 Q18,12 24,6"
                stroke={brand.primary}
                strokeWidth={1.5}
                fill="none"
                opacity={0.4}
              />
            </Svg>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Excerpt */}
          {article.excerpt && (
            <Animated.Text
              entering={FadeInDown.delay(350).duration(500)}
              style={[styles.excerpt, { color: colors.textSecondary }]}
            >
              {article.excerpt}
            </Animated.Text>
          )}

          {/* Body content */}
          {article.content && (
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Text style={[styles.body, { color: colors.textPrimary }]}>
                {article.content}
              </Text>
            </Animated.View>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(450).duration(500)}
              style={styles.tagsWrap}
            >
              {article.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isDark
                        ? "rgba(19,236,106,0.12)"
                        : "rgba(19,236,106,0.08)",
                      borderColor: isDark
                        ? "rgba(19,236,106,0.20)"
                        : "rgba(19,236,106,0.15)",
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: brand.primary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* External link CTA */}
          {article.externalLink && (
            <Animated.View entering={FadeInDown.delay(500).duration(500)}>
              <PressableScale
                onPress={handleOpenSource}
                style={[styles.ctaButton, { backgroundColor: brand.primary }]}
                accessibilityRole="link"
                accessibilityLabel={t.home.readOnSource}
              >
                <MaterialIcons name="open-in-new" size={18} color="#fff" />
                <Text style={styles.ctaText}>{t.home.readOnSource}</Text>
              </PressableScale>
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
  errorText: { fontSize: 16, fontWeight: "500", marginTop: 8 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: { position: "absolute", bottom: 20, left: 20 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

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

  excerpt: {
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 20,
  },

  body: { fontSize: 16, lineHeight: 28, fontWeight: "400" },

  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 28,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontWeight: "600" },

  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
