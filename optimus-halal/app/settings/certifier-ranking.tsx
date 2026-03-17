/**
 * Certifier Trust Ranking Screen — Refonte v2
 *
 * NaqiyGradeBadge strip, CertifierLogo, practice icons compactes,
 * filtrage par grade, legende des pratiques.
 */

import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ArrowLeftIcon, CloudSlashIcon, CrownIcon } from "phosphor-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { AppIcon, type IconName } from "@/lib/icons";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import {
  NaqiyGradeBadge,
  getTrustGradeFromScore,
  TRUST_GRADES,
  type TrustGrade,
} from "@/components/scan/NaqiyGradeBadge";
import { gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

const GOLD = gold[500];

// ── Types ─────────────────────────────────────────

interface CertifierRankingItem {
  id: string;
  name: string;
  website: string | null;
  halalAssessment: boolean;
  trustScore: number;
  trustGrade: TrustGrade;
  practices: {
    acceptsStunning: boolean | null;
    controllersAreEmployees: boolean | null;
    controllersPresentEachProduction: boolean | null;
    hasSalariedSlaughterers: boolean | null;
  };
}

// ── Practice Icon ─────────────────────────────────

interface PracticeDef {
  icon: IconName;
  labelKey: string;
  getValue: (item: CertifierRankingItem) => boolean;
}

const PRACTICE_DEFS: PracticeDef[] = [
  { icon: "restaurant", labelKey: "halalValidated", getValue: (item) => item.halalAssessment },
  { icon: "flash-off", labelKey: "noStunning", getValue: (item) => item.practices.acceptsStunning === false },
  { icon: "badge", labelKey: "employees", getValue: (item) => item.practices.controllersAreEmployees === true },
  { icon: "visibility", labelKey: "permanentPresence", getValue: (item) => item.practices.controllersPresentEachProduction === true },
];

function PracticeIcon({
  passed,
  icon,
  isDark,
}: {
  passed: boolean;
  icon: IconName;
  isDark: boolean;
}) {
  const bg = passed
    ? isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)"
    : isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)";
  const dotColor = passed ? "#22c55e" : "#ef4444";
  const iconColor = passed
    ? isDark ? "#4ade80" : "#16a34a"
    : isDark ? "#f87171" : "#dc2626";

  return (
    <View style={[styles.practiceIcon, { backgroundColor: bg }]}>
      <AppIcon name={icon} size={14} color={iconColor} />
      <View style={[styles.practiceDot, { backgroundColor: dotColor }]} />
    </View>
  );
}

// ── Grade Scale Reference ─────────────────────────

function GradeScaleReference({ isDark }: { isDark: boolean }) {
  const ranges = ["90-100", "70-89", "51-69", "35-50", "0-34"];
  return (
    <View style={[styles.gradeScale, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }]}>
      {TRUST_GRADES.map((g, i) => (
        <View key={g.grade} style={styles.scaleItem}>
          <View style={[styles.scalePill, { backgroundColor: g.color }]}>
            <Text style={styles.scalePillText}>{g.arabic}</Text>
          </View>
          <Text style={styles.scaleRange}>{ranges[i]}</Text>
          <Text style={styles.scaleLabel}>{g.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Filter Pill ───────────────────────────────────

function FilterPill({
  label,
  active,
  onPress,
  isDark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View
        style={[
          styles.filterPill,
          active && styles.filterPillActive,
          !active && { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" },
        ]}
      >
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Certifier Card ────────────────────────────────

const CertifierCard = React.memo(function CertifierCard({
  item,
  index,
  rank,
  isDark,
  colors,
  t,
}: {
  item: CertifierRankingItem;
  index: number;
  rank: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const grade = item.trustGrade ?? getTrustGradeFromScore(item.trustScore);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View
        style={[
          styles.certCard,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
            borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
          },
        ]}
      >
        {/* Row 1: Rank + Logo + Name */}
        <View style={styles.certTopRow}>
          <View
            style={[
              styles.rankBadge,
              rank <= 3
                ? { backgroundColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)" }
                : { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" },
            ]}
          >
            <Text style={[styles.rankText, { color: rank <= 3 ? GOLD : colors.textMuted }]}>
              {rank}
            </Text>
          </View>
          <CertifierLogo certifierId={item.id} size={34} fallbackColor={grade.color} />
          <Text style={[styles.certName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Row 2: NaqiyGradeBadge strip + score */}
        <View style={styles.certGradeRow}>
          <NaqiyGradeBadge variant="strip" grade={grade} showLabel={false} />
          <Text style={[styles.certScore, { color: grade.color }]}>
            {item.trustScore}/100
          </Text>
        </View>

        {/* Row 3: Practice icons */}
        <View style={styles.practicesRow}>
          {PRACTICE_DEFS.map((def) => (
            <PracticeIcon key={def.icon} passed={def.getValue(item)} icon={def.icon} isDark={isDark} />
          ))}
        </View>

        {/* Website link */}
        {item.website && (
          <PressableScale
            onPress={() => Linking.openURL(item.website!.startsWith("http") ? item.website! : `https://${item.website}`)}
            accessibilityRole="link"
            accessibilityLabel={`${t.certifierRanking.officialWebsite} ${item.name}`}
          >
            <View style={styles.websiteRow}>
              <AppIcon name="open-in-new" size={12} color={GOLD} />
              <Text style={styles.websiteText}>
                {t.certifierRanking.officialWebsite}
              </Text>
            </View>
          </PressableScale>
        )}
      </View>
    </Animated.View>
  );
});

// ── Legend Card ────────────────────────────────────

function PracticeLegend({
  isDark,
  colors,
  t,
}: {
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const legends: { icon: IconName; label: string }[] = [
    { icon: "restaurant", label: t.certifierRanking.criteria.halalValidated },
    { icon: "flash-off", label: t.certifierRanking.criteria.noStunning },
    { icon: "badge", label: t.certifierRanking.criteria.employees },
    { icon: "visibility", label: t.certifierRanking.criteria.permanentPresence },
  ];

  return (
    <View
      style={[
        styles.legendCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
          borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
        },
      ]}
    >
      <Text style={styles.legendTitle}>
        {t.certifierRanking.legendTitle ?? "PRATIQUES"}
      </Text>
      <View style={styles.legendGrid}>
        {legends.map((l) => (
          <View key={l.icon} style={styles.legendItem}>
            <View style={[styles.legendIconBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
              <AppIcon name={l.icon} size={12} color={colors.textMuted} />
            </View>
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────

const certifierKeyExtractor = (item: CertifierRankingItem) => item.id;

export default function CertifierRankingScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = trpc.certifier.ranking.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 },
  );

  const items = useMemo(
    () => (data ?? []) as CertifierRankingItem[],
    [data],
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === null) return items;
    return items.filter((c) => {
      const grade = c.trustGrade ?? getTrustGradeFromScore(c.trustScore);
      return grade.grade === activeFilter;
    });
  }, [items, activeFilter]);

  const trustedCount = useMemo(
    () => items.filter((c) => c.halalAssessment).length,
    [items],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CertifierRankingItem; index: number }) => (
      <CertifierCard
        item={item}
        index={index}
        rank={index + 1}
        isDark={isDark}
        colors={colors}
        t={t}
      />
    ),
    [isDark, colors, t],
  );

  const filters = useMemo(() => {
    const all = { grade: null, label: t.common?.all ?? "Tous" };
    const gradeFilters = TRUST_GRADES.map((g) => ({
      grade: g.grade,
      label: `N${g.arabic} ${g.label}`,
    }));
    return [all, ...gradeFilters];
  }, [t]);

  const ListHeader = useMemo(
    () => (
      <>
        {/* Grade Scale */}
        <GradeScaleReference isDark={isDark} />

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => (
            <FilterPill
              key={f.grade ?? "all"}
              label={f.label}
              active={activeFilter === f.grade}
              onPress={() => setActiveFilter(f.grade)}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      </>
    ),
    [isDark, filters, activeFilter],
  );

  const ListFooter = useMemo(
    () => <PracticeLegend isDark={isDark} colors={colors} t={t} />,
    [isDark, colors, t],
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[
            styles.header,
            { borderBottomColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.12)" },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
                  borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <ArrowLeftIcon size={20} color={colors.textPrimary} />
            </Pressable>
            <View>
              <Text
                style={[styles.headerTitle, { color: colors.textPrimary }]}
                accessibilityRole="header"
              >
                {t.certifierRanking.title}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {(trustedCount > 1
                  ? t.certifierRanking.validatedCountPlural
                  : t.certifierRanking.validatedCount
                )
                  .replace("{{validated}}", String(trustedCount))
                  .replace("{{total}}", String(items.length))}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <CloudSlashIcon size={64} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {t.certifierRanking.loadError}
            </Text>
            <PressableScale onPress={() => refetch()} accessibilityRole="button">
              <View style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.retryText, { color: isDark ? "#102217" : "#0d1b13" }]}>
                  {t.common.retry}
                </Text>
              </View>
            </PressableScale>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <CrownIcon size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {t.certifierRanking.noCertifiers}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {t.certifierRanking.noCertifiersDesc}
            </Text>
          </View>
        ) : (
          <FlashList
            data={filteredItems}
            keyExtractor={certifierKeyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginEnd: spacing.lg,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },

  // Grade Scale
  gradeScale: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    padding: 10,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  scaleItem: {
    alignItems: "center",
    gap: 3,
  },
  scalePill: {
    width: 36,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  scalePillText: {
    fontSize: 11,
    fontWeight: fontWeight.black,
    color: "#fff",
  },
  scaleRange: {
    fontSize: 8,
    fontWeight: fontWeight.semiBold,
    color: "#666",
  },
  scaleLabel: {
    fontSize: 7,
    fontWeight: fontWeight.semiBold,
    color: "#888",
  },

  // Filters
  filterRow: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  filterPillActive: {
    backgroundColor: "rgba(212,175,55,0.15)",
    borderColor: "rgba(212,175,55,0.3)",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: fontWeight.semiBold,
    color: "#999",
  },
  filterPillTextActive: {
    color: GOLD,
  },

  // Card
  certCard: {
    marginHorizontal: spacing.xl,
    marginBottom: 10,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  certTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  certName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  certGradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  certScore: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.black,
  },

  // Practice icons
  practicesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  practiceIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  practiceDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#0C0C0C",
  },

  // Website
  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  websiteText: {
    fontSize: 11,
    fontWeight: fontWeight.semiBold,
    color: GOLD,
  },

  // Legend
  legendCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  legendTitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "46%",
  },
  legendIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  legendLabel: {
    fontSize: 11,
    flex: 1,
  },

  // States
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  retryText: {
    fontWeight: fontWeight.bold,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
