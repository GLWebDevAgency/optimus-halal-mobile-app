/**
 * Certifier Trust Ranking Screen
 * Wired to tRPC certifier.ranking (Sprint 9)
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────

interface CertifierItem {
  id: string;
  name: string;
  website: string | null;
  creationYear: number | null;
  halalAssessment: boolean;
  trustScore: number | null;
  acceptsStunning: boolean;
  controllersAreEmployees: boolean;
  controllersPresentEachProduction: boolean;
}

// ── Helpers ───────────────────────────────────────

function getTrustColor(score: number | null, isDark: boolean) {
  if (score === null) return isDark ? "#9ca3af" : "#6b7280";
  if (score >= 80) return isDark ? "#4ade80" : "#16a34a";
  if (score >= 60) return isDark ? "#fbbf24" : "#ca8a04";
  if (score >= 40) return isDark ? "#fb923c" : "#ea580c";
  return isDark ? "#f87171" : "#dc2626";
}

function getTrustBg(score: number | null, isDark: boolean) {
  if (score === null) return isDark ? "rgba(156,163,175,0.15)" : "rgba(156,163,175,0.1)";
  if (score >= 80) return isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)";
  if (score >= 60) return isDark ? "rgba(234,179,8,0.15)" : "rgba(234,179,8,0.1)";
  if (score >= 40) return isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.1)";
  return isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)";
}

function getTrustLabel(score: number | null, t: ReturnType<typeof useTranslation>["t"]): string {
  if (score === null) return t.certifierRanking.trustLabels.na;
  if (score >= 80) return t.certifierRanking.trustLabels.reliable;
  if (score >= 60) return t.certifierRanking.trustLabels.correct;
  if (score >= 40) return t.certifierRanking.trustLabels.average;
  return t.certifierRanking.trustLabels.weak;
}

// ── Certifier Card Component ──────────────────────

const CertifierCard = React.memo(function CertifierCard({
  item,
  index,
  rank,
  isDark,
  colors,
  t,
}: {
  item: CertifierItem;
  index: number;
  rank: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const trustColor = getTrustColor(item.trustScore, isDark);
  const trustBg = getTrustBg(item.trustScore, isDark);
  const trustLabel = getTrustLabel(item.trustScore, t);

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
        }}
      >
        {/* Header: Rank + Name + Score */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          {/* Rank badge */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: rank <= 3 ? trustBg : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: rank <= 3 ? trustColor : colors.textMuted,
              }}
            >
              {rank}
            </Text>
          </View>

          {/* Name + year */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.creationYear && (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {t.certifierRanking.since.replace("{{year}}", String(item.creationYear))}
              </Text>
            )}
          </View>

          {/* Trust Score */}
          <View
            style={{
              backgroundColor: trustBg,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: trustColor }}>
              {item.trustScore ?? "—"}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "600", color: trustColor, marginTop: 1 }}>
              {trustLabel}
            </Text>
          </View>
        </View>

        {/* Criteria badges */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <CriteriaBadge
            passed={item.halalAssessment}
            label={t.certifierRanking.criteria.halalValidated}
            icon="verified"
            isDark={isDark}
            colors={colors}
          />
          <CriteriaBadge
            passed={!item.acceptsStunning}
            label={item.acceptsStunning ? t.certifierRanking.criteria.stunning : t.certifierRanking.criteria.noStunning}
            icon={item.acceptsStunning ? "flash-on" : "flash-off"}
            isDark={isDark}
            colors={colors}
          />
          <CriteriaBadge
            passed={item.controllersAreEmployees}
            label={t.certifierRanking.criteria.employees}
            icon="badge"
            isDark={isDark}
            colors={colors}
          />
          <CriteriaBadge
            passed={item.controllersPresentEachProduction}
            label={t.certifierRanking.criteria.permanentPresence}
            icon="visibility"
            isDark={isDark}
            colors={colors}
          />
        </View>

        {/* Website link */}
        {item.website && (
          <TouchableOpacity
            onPress={() => Linking.openURL(item.website!)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 }}
            accessibilityRole="link"
            accessibilityLabel={`Visiter le site de ${item.name}`}
          >
            <MaterialIcons name="open-in-new" size={12} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
              {t.certifierRanking.officialWebsite}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// ── Criteria Badge ────────────────────────────────

function CriteriaBadge({
  passed,
  label,
  icon,
  isDark,
  colors,
}: {
  passed: boolean;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const bg = passed
    ? isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)"
    : isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)";
  const textColor = passed
    ? isDark ? "#4ade80" : "#16a34a"
    : isDark ? "#f87171" : "#dc2626";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <MaterialIcons
        name={passed ? "check-circle" : "cancel"}
        size={12}
        color={textColor}
      />
      <Text style={{ fontSize: 10, fontWeight: "600", color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

const certifierKeyExtractor = (item: CertifierItem) => item.id;

// ── Main Screen ───────────────────────────────────

export default function CertifierRankingScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = trpc.certifier.ranking.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 }
  );

  const items = useMemo(() => (data ?? []) as CertifierItem[], [data]);
  const trustedCount = useMemo(() => items.filter((c) => c.halalAssessment).length, [items]);

  const renderItem = useCallback(
    ({ item, index }: { item: CertifierItem; index: number }) => (
      <CertifierCard
        item={item}
        index={index}
        rank={index + 1}
        isDark={isDark}
        colors={colors}
        t={t}
      />
    ),
    [isDark, colors, t]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginEnd: 12,
              height: 44,
              width: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 22,
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              borderWidth: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text
              style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary }}
              accessibilityRole="header"
            >
              {t.certifierRanking.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {(trustedCount > 1 ? t.certifierRanking.validatedCountPlural : t.certifierRanking.validatedCount).replace("{{validated}}", String(trustedCount)).replace("{{total}}", String(items.length))}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16 }}>
            {t.certifierRanking.loadError}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
              {t.common.retry}
            </Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
          <MaterialIcons name="workspace-premium" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 16 }}>
            {t.certifierRanking.noCertifiers}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
              paddingHorizontal: 32,
            }}
          >
            {t.certifierRanking.noCertifiersDesc}
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={certifierKeyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
