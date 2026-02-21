/**
 * Article List Screen — "Killer 2026" Design
 *
 * Filter chips (type + tags), search, infinite scroll,
 * premium background, card-based layout.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { PremiumBackground, EmptyState } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { brand, gold } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

type ArticleType = "blog" | "partner_news" | "educational" | "community";

const TYPE_FILTERS: { key: ArticleType | "all"; icon: string }[] = [
  { key: "all", icon: "auto-awesome" },
  { key: "blog", icon: "article" },
  { key: "educational", icon: "school" },
  { key: "partner_news", icon: "handshake" },
  { key: "community", icon: "groups" },
];

const TYPE_COLORS: Record<string, string> = {
  blog: brand.primary,
  educational: brand.primary,
  partner_news: gold[500],
  community: "#3b82f6",
};

export default function ArticlesListScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const { impact } = useHaptics();
  const dateLocale = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR";

  const [selectedType, setSelectedType] = useState<ArticleType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const typeFilter = selectedType === "all" ? undefined : selectedType;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.article.list.useInfiniteQuery(
      { type: typeFilter, limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 120_000,
      },
    );

  const articles = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        a.author.toLowerCase().includes(q),
    );
  }, [data?.pages, searchQuery]);

  const handleBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleArticlePress = useCallback(
    (id: string) => {
      impact();
      router.push(`/articles/${id}`);
    },
    [impact],
  );

  const handleFilterPress = useCallback(
    (key: ArticleType | "all") => {
      impact();
      setSelectedType(key);
    },
    [impact],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "partner_news": return t.home.partnerBadge;
      case "educational": return t.home.guideBadge;
      case "community": return t.articles.communityBadge;
      default: return t.home.blogBadge;
    }
  };

  const renderArticleCard = useCallback(
    ({ item, index }: { item: (typeof articles)[0]; index: number }) => {
      const accentColor = TYPE_COLORS[item.type] ?? brand.primary;
      const formattedDate = new Date(item.publishedAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
      });

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 60).duration(400)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <TouchableOpacity
            onPress={() => handleArticlePress(item.id)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            style={styles.cardInner}
          >
            {/* Cover */}
            <View style={styles.cardCover}>
              {item.coverImage ? (
                <Image
                  source={{ uri: item.coverImage }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={isDark ? ["#132a1a", "#0a1a10"] : ["#ecfdf5", "#f0fdf4"]}
                  style={styles.cardImage}
                />
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.5)"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Badge */}
              <View style={[styles.cardBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.cardBadgeText}>{getTypeLabel(item.type)}</Text>
              </View>
            </View>

            {/* Text content */}
            <View style={styles.cardContent}>
              <Text
                style={[styles.cardTitle, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              <View style={styles.cardMeta}>
                <Text style={[styles.cardMetaText, { color: colors.textMuted }]}>
                  {formattedDate}
                </Text>
                <View style={[styles.cardMetaDot, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.cardMetaText, { color: colors.textMuted }]}>
                  {item.readTimeMinutes ?? 3} min
                </Text>
              </View>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View style={styles.cardTags}>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Text
                      key={tag}
                      style={[styles.cardTagText, { color: brand.primary }]}
                    >
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [isDark, colors, handleArticlePress, t],
  );

  return (
    <View style={[styles.root]}>
      <PremiumBackground />

      {/* ---- Header ---- */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.headerIcon, { backgroundColor: colors.buttonSecondary }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.iconPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t.articles.title}
            </Text>
            <Svg width={20} height={10} viewBox="0 0 24 12">
              <Path
                d="M0,6 Q6,0 12,6 Q18,12 24,6"
                stroke={brand.primary}
                strokeWidth={1.5}
                fill="none"
                opacity={0.5}
              />
            </Svg>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.buttonSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.articles.searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {TYPE_FILTERS.map((filter) => {
            const isActive = filter.key === selectedType;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => handleFilterPress(filter.key)}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? brand.primary
                      : colors.buttonSecondary,
                    borderColor: isActive
                      ? brand.primary
                      : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <MaterialIcons
                  name={filter.icon as any}
                  size={16}
                  color={isActive ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {filter.key === "all"
                    ? t.common.all
                    : getTypeLabel(filter.key)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ---- Article grid ---- */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      ) : articles.length === 0 ? (
        <EmptyState
          icon="article"
          title={t.home.noArticles}
        />
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticleCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={brand.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },

  filtersRow: { gap: 8, paddingBottom: 14 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  gridContent: { paddingHorizontal: 20, paddingTop: 8 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },

  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardInner: { flex: 1 },
  cardCover: { width: "100%", height: 120, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  cardContent: { padding: 12, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMetaText: { fontSize: 11, fontWeight: "500" },
  cardMetaDot: { width: 2, height: 2, borderRadius: 1 },
  cardTags: { flexDirection: "row", gap: 6, marginTop: 2 },
  cardTagText: { fontSize: 11, fontWeight: "600" },
});
