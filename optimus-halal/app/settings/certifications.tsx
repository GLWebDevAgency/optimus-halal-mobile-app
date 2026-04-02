/**
 * Certifications Preferences Screen — Refonte v2
 *
 * Donnees live tRPC (plus de hardcode), groupement par NaqiyGrade,
 * CertifierLogo, NaqiyGradeBadge compact, toggles persistants.
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CloudSlashIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import { usePreferencesStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { AppIcon } from "@/lib/icons";
import { trpc } from "@/lib/trpc";
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

interface RankedCertifier {
  id: string;
  name: string;
  website: string | null;
  halalAssessment: boolean;
  trustScore: number;
  trustGrade: TrustGrade;
}

interface GradeGroup {
  grade: TrustGrade;
  items: RankedCertifier[];
}

// ── Certifier Card ────────────────────────────────

function CertifierPrefCard({
  item,
  isEnabled,
  onToggle,
  isDark,
  colors,
}: {
  item: RankedCertifier;
  isEnabled: boolean;
  onToggle: () => void;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const grade = item.trustGrade ?? getTrustGradeFromScore(item.trustScore);
  const isN1 = grade.grade === 1;

  return (
    <View
      style={[
        styles.prefCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
          borderColor: isEnabled
            ? "rgba(212,175,55,0.4)"
            : isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
          opacity: isEnabled ? 1 : 0.65,
        },
        isEnabled && styles.prefCardGlow,
      ]}
    >
      <View style={styles.prefTopRow}>
        <CertifierLogo certifierId={item.id} size={40} fallbackColor={grade.color} />
        <View style={styles.prefInfo}>
          {/* Name row */}
          <View style={styles.prefNameRow}>
            <Text style={[styles.prefName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <NaqiyGradeBadge variant="compact" grade={grade} />
            <Text style={[styles.prefScore, { color: grade.color }]}>
              {item.trustScore}
            </Text>
          </View>
          {/* Badges */}
          {isN1 && (
            <View style={styles.prefBadges}>
              <View style={styles.recommendedBadge}>
                <AppIcon name="verified" size={10} color={GOLD} />
                <Text style={styles.recommendedText}>Recommande</Text>
              </View>
            </View>
          )}
        </View>
        <Switch
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{
            false: isDark ? "#374151" : "#d1d5db",
            true: colors.primary,
          }}
          thumbColor="#ffffff"
          ios_backgroundColor={isDark ? "#374151" : "#d1d5db"}
          style={styles.switchScale}
          accessibilityRole="switch"
          accessibilityLabel={item.name}
          accessibilityState={{ checked: isEnabled }}
        />
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────

export default function CertificationsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { certifications, toggleCertification } = usePreferencesStore();

  const { data, isLoading, isError, refetch } = trpc.certifier.ranking.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 },
  );

  const items = useMemo(
    () => (data ?? []) as RankedCertifier[],
    [data],
  );

  // Group by grade
  const gradeGroups = useMemo<GradeGroup[]>(() => {
    const map = new Map<number, GradeGroup>();
    for (const item of items) {
      const grade = item.trustGrade ?? getTrustGradeFromScore(item.trustScore);
      const key = grade.grade;
      if (!map.has(key)) map.set(key, { grade, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => a.grade.grade - b.grade.grade);
  }, [items]);

  const isCertEnabled = useCallback(
    (id: string) => certifications.includes(id),
    [certifications],
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? "rgba(16, 34, 23, 0.95)"
                : "rgba(246, 248, 247, 0.95)",
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BackButton />
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              {t.certifications.title}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

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
                <Text style={{ fontWeight: fontWeight.bold, color: isDark ? "#102217" : "#0d1b13" }}>
                  {t.common.retry}
                </Text>
              </View>
            </PressableScale>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.introBlock}
            >
              <Text style={[styles.introText, { color: colors.textSecondary }]}>
                {t.certifications.description}
              </Text>
            </Animated.View>

            {/* Grade groups */}
            {gradeGroups.map((group, gi) => (
              <Animated.View
                key={group.grade.grade}
                entering={FadeInDown.delay(150 + gi * 80).duration(400)}
              >
                {/* Section header */}
                <View style={styles.sectionHeader}>
                  <NaqiyGradeBadge variant="compact" grade={group.grade} />
                  <Text style={styles.sectionTitle}>{group.grade.label}</Text>
                  <Text style={styles.sectionCount}>({group.items.length})</Text>
                </View>

                {/* Cards */}
                {group.items.map((item) => (
                  <CertifierPrefCard
                    key={item.id}
                    item={item}
                    isEnabled={isCertEnabled(item.id)}
                    onToggle={() => toggleCertification(item.id)}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
              </Animated.View>
            ))}

            {/* Ethical Criteria */}
            <Text style={styles.ethicalTitle}>
              {t.certifications.categories?.ethical ?? "Criteres Ethiques"}
            </Text>
            <View
              style={[
                styles.ethicalCard,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
                  borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
                },
              ]}
            >
              <View style={styles.ethicalRow}>
                <View style={styles.ethicalIcon}>
                  <AppIcon name="eco" size={22} color={isDark ? "#4ade80" : "#16a34a"} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.ethicalNameRow}>
                    <Text style={[styles.ethicalName, { color: colors.textPrimary }]}>
                      Agriculture Biologique
                    </Text>
                    <Switch
                      value={isCertEnabled("bio")}
                      onValueChange={() => toggleCertification("bio")}
                      trackColor={{
                        false: isDark ? "#374151" : "#d1d5db",
                        true: colors.primary,
                      }}
                      thumbColor="#ffffff"
                      ios_backgroundColor={isDark ? "#374151" : "#d1d5db"}
                      style={styles.switchScale}
                      accessibilityRole="switch"
                      accessibilityLabel="Agriculture Biologique"
                      accessibilityState={{ checked: isCertEnabled("bio") }}
                    />
                  </View>
                  <Text style={[styles.ethicalDesc, { color: colors.textSecondary }]}>
                    Privilegier les produits certifies AB ou Eurofeuille.
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(243, 244, 246, 1)",
                  borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
                },
              ]}
            >
              <View style={styles.infoBlob} />
              <View style={styles.infoRow}>
                <AppIcon name="info" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                    Pourquoi choisir ?
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Choisir vos certifications permet d&apos;exclure automatiquement
                    les produits qui ne correspondent pas a vos criteres
                    religieux ou ethiques lors du scan.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: "center",
  },

  // Intro
  introBlock: {
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing.md,
    marginBottom: spacing["3xl"],
  },
  introText: {
    fontSize: fontSize.body,
    lineHeight: 20,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing["2xl"],
    marginTop: spacing["2xl"],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: Platform.OS === "android" ? 0.2 : 1,
    color: GOLD,
  },
  sectionCount: {
    fontSize: 10,
    color: "#666",
  },

  // Pref Card
  prefCard: {
    marginHorizontal: spacing.xl,
    marginBottom: 10,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  prefCardGlow: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  prefTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  prefInfo: {
    flex: 1,
    minWidth: 0,
  },
  prefNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  prefName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
  },
  prefScore: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.black,
  },
  prefBadges: {
    flexDirection: "row",
    marginTop: 4,
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: GOLD,
  },

  switchScale: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },

  // Ethical
  ethicalTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: Platform.OS === "android" ? 0.2 : 1,
    color: GOLD,
    marginHorizontal: spacing["2xl"],
    marginTop: spacing["3xl"],
    marginBottom: spacing.lg,
  },
  ethicalCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ethicalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  ethicalIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  ethicalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ethicalName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  ethicalDesc: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },

  // Info card
  infoCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing["3xl"],
    marginBottom: spacing["4xl"],
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoBlob: {
    position: "absolute",
    right: -16,
    top: -16,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(34,197,94,0.08)",
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  infoTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
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
});
