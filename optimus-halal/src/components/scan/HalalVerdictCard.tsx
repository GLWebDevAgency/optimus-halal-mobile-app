/**
 * HalalVerdictCard — 4 Madhab Verdict Rows
 *
 * Our killer differentiator: 4 schools displayed with equal visual weight.
 * User's madhab gets gold star but is NOT visually elevated (Al-Niyyah).
 * Consensus badge when all 4 agree. Conflict breathing animation when they differ.
 *
 * @module components/scan/HalalVerdictCard
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  MosqueIcon,
  StarIcon,
  CheckCircleIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  MADHAB_LABEL_KEY,
  type HalalStatusKey,
} from "./scan-constants";
import type { MadhabVerdict } from "./scan-types";

// ── Types ──

export interface HalalVerdictCardProps {
  madhabVerdicts: MadhabVerdict[];
  userMadhab: string;
  effectiveHeroStatus: HalalStatusKey;
  ingredientCount: number;
  additiveCount: number;
  onPressMadhab: (verdict: MadhabVerdict) => void;
  onPressCard: () => void;
  staggerIndex?: number;
}

// ── Status color helper ──

function getStatusColor(status: HalalStatusKey): string {
  return halalStatusTokens[status]?.base ?? halalStatusTokens.unknown.base;
}

function getStatusLabel(status: HalalStatusKey, t: ReturnType<typeof useTranslation>["t"]): string {
  const map: Record<string, string> = {
    halal: t.scanResult.halal,
    haram: t.scanResult.haram,
    doubtful: t.scanResult.doubtful,
    unknown: t.scanResult.unknown,
  };
  return map[status] ?? status;
}

// ── MadhabRow sub-component ──

function MadhabRow({
  verdict,
  isUserMadhab,
  isConflicting,
  index,
  onPress,
}: {
  verdict: MadhabVerdict;
  isUserMadhab: boolean;
  isConflicting: boolean;
  majorityStatus: HalalStatusKey;
  index: number;
  onPress: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const statusColor = getStatusColor(verdict.status);
  const statusLabel = getStatusLabel(verdict.status, t);
  const madhabLabelKey = MADHAB_LABEL_KEY[verdict.madhab as keyof typeof MADHAB_LABEL_KEY];
  const madhabLabel = madhabLabelKey
    ? (t.scanResult as Record<string, string>)[madhabLabelKey] ?? verdict.madhab
    : verdict.madhab;

  // Conflict count (additives + ingredients)
  const conflictCount =
    (verdict.conflictingAdditives?.length ?? 0) +
    (verdict.conflictingIngredients?.length ?? 0);

  // Conflict breathing animation
  const breathOpacity = useSharedValue(1);
  useEffect(() => {
    if (isConflicting && !reducedMotion) {
      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
      );
    }
  }, [isConflicting, reducedMotion]);

  const rowAnimStyle = useAnimatedStyle(() => ({
    opacity: isConflicting ? breathOpacity.value : 1,
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${madhabLabel}: ${statusLabel}`}>
      <Animated.View
        entering={FadeInUp.delay(index * 80).duration(250)}
        style={[styles.madhabRow, rowAnimStyle]}
      >
        {/* Star for user madhab */}
        <View style={styles.starSlot}>
          {isUserMadhab && (
            <StarIcon size={14} color={gold[500]} weight="fill" />
          )}
        </View>

        {/* Madhab name */}
        <Text
          style={[
            styles.madhabName,
            {
              color: isUserMadhab
                ? (isDark ? gold[400] : gold[700])
                : colors.textPrimary,
              fontWeight: isUserMadhab ? fontWeightTokens.bold : fontWeightTokens.regular,
            },
          ]}
          numberOfLines={1}
        >
          {madhabLabel}
        </Text>

        {/* Status dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

        {/* Status label */}
        <Text style={[styles.statusLabel, { color: statusColor }]} numberOfLines={1}>
          {statusLabel}
        </Text>

        {/* Conflict count (replaces trust bar — backend has no per-madhab score) */}
        {conflictCount > 0 && (
          <Text style={[styles.conflictCount, { color: colors.textMuted }]}>
            {conflictCount} conflit{conflictCount > 1 ? "s" : ""}
          </Text>
        )}

        {/* Caret */}
        <CaretRightIcon size={14} color={colors.textMuted} />
      </Animated.View>
    </Pressable>
  );
}

// ── Main Component ──

export function HalalVerdictCard({
  madhabVerdicts,
  userMadhab,
  effectiveHeroStatus,
  ingredientCount,
  additiveCount,
  onPressMadhab,
  onPressCard,
  staggerIndex = 2,
}: HalalVerdictCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  // Check consensus
  const allStatuses = madhabVerdicts.map((v) => v.status);
  const isConsensus = allStatuses.length > 0 && allStatuses.every((s) => s === allStatuses[0]);
  const majorityStatus: HalalStatusKey = isConsensus ? allStatuses[0] : effectiveHeroStatus;
  const consensusColor = getStatusColor(majorityStatus);

  // Sort: user madhab first
  const sortedVerdicts = [...madhabVerdicts].sort((a, b) => {
    if (a.madhab === userMadhab) return -1;
    if (b.madhab === userMadhab) return 1;
    return 0;
  });

  // Consensus badge
  const consensusBadge = isConsensus ? (
    <View style={[styles.consensusBadge, {
      backgroundColor: isDark
        ? halalStatusTokens[majorityStatus]?.bgDark ?? "rgba(107,114,128,0.20)"
        : halalStatusTokens[majorityStatus]?.bg ?? "rgba(107,114,128,0.12)",
    }]}>
      <CheckCircleIcon size={12} color={consensusColor} weight="fill" />
      <Text style={[styles.consensusText, { color: consensusColor }]}>
        {t.scanResult.unanime}
      </Text>
    </View>
  ) : null;

  // Empty state: no verdicts
  if (madhabVerdicts.length === 0) {
    return (
      <SectionCard
        icon={<MosqueIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
        title={t.scanResult.avisEcoles}
        staggerIndex={staggerIndex}
      >
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {t.scanResult.analyseAlgorithmique}
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<MosqueIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.avisEcoles}
      rightElement={consensusBadge}
      staggerIndex={staggerIndex}
    >
      {/* Madhab Rows */}
      <View style={styles.madhabList}>
        {sortedVerdicts.map((verdict, idx) => (
          <MadhabRow
            key={verdict.madhab}
            verdict={verdict}
            isUserMadhab={verdict.madhab === userMadhab}
            isConflicting={!isConsensus && verdict.status !== majorityStatus}
            majorityStatus={majorityStatus}
            index={idx}
            onPress={() => {
              impact();
              onPressMadhab(verdict);
            }}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerMeta, { color: colors.textMuted }]}>
            {ingredientCount > 0 || additiveCount > 0
              ? `${ingredientCount} ingr. · ${additiveCount} add.`
              : t.scanResult.unverified}
          </Text>
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            {t.scanResult.decisionNote}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            impact();
            onPressCard();
          }}
          style={styles.footerCTA}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.voirDetail}
        >
          <Text style={[styles.footerCTAText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirDetail}
          </Text>
          <CaretRightIcon size={14} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  madhabList: {
    gap: spacing.sm,
  },
  madhabRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    gap: spacing.md,
  },
  starSlot: {
    width: 14,
    alignItems: "center",
  },
  madhabName: {
    width: 72,
    fontSize: fontSizeTokens.bodySmall,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    width: 56,
    fontSize: fontSizeTokens.caption,
  },
  conflictCount: {
    flex: 1,
    fontSize: fontSizeTokens.micro,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
    gap: 2,
  },
  footerMeta: {
    fontSize: fontSizeTokens.caption,
  },
  footerNote: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
  },
  footerCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerCTAText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  consensusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  consensusText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  emptyText: {
    fontSize: fontSizeTokens.bodySmall,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
