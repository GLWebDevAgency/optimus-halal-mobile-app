/**
 * MadhabVerdictCard — Per-madhab verdict rings with trust scores.
 *
 * Premium glass card displaying the 4 Islamic schools of thought
 * (Hanafi, Shafi'i, Maliki, Hanbali) as animated score rings.
 *
 * Features:
 * - Section header with title + consensus badge
 * - 4 verdict rings with culturally-appropriate icons
 * - Unanimous consensus message when all schools agree
 * - Contextual notes (certifier vs algorithmic source)
 * - Hadith card when verdict is doubtful (gold calligraphic feel)
 *
 * Aligned with Al-Niyyah (neutralite confessionnelle):
 * All 4 schools displayed equally. User's school is subtly
 * highlighted with gold accent but never elevated above others.
 *
 * @module components/scan/MadhabVerdictCard
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  CheckCircleIcon,
  HandTapIcon,
  InfoIcon,
  ScalesIcon,
} from "phosphor-react-native";
import Animated, { FadeInUp, FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui/PressableScale";
import { MadhabScoreRing } from "@/components/scan/MadhabScoreRing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { glass, gold, halalStatus as halalStatusColors } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { MADHAB_LABEL_KEY, MADHAB_TRUST_KEY, SUSPENSE_DURATION } from "./scan-constants";

// ── Props ────────────────────────────────────────────────────────────────────

export interface MadhabVerdictCardProps {
  madhabVerdicts: Array<{
    madhab: string;
    status: "halal" | "doubtful" | "haram" | "unknown";
    conflictingAdditives: Array<{
      code: string;
      name: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
    conflictingIngredients?: Array<{
      pattern: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
  }>;
  certifierData: any;
  userMadhab: string;
  effectiveHeroStatus: string;
  onSelectMadhab: (madhab: any) => void;
}

// ── Unanimous status visual config ───────────────────────────────────────────

const UNANIMOUS_VISUALS: Record<string, { color: string; bgHex: { dark: string; light: string }; borderHex: { dark: string; light: string } }> = {
  halal: {
    color: halalStatusColors.halal.base,
    bgHex: { dark: "14", light: "0C" },
    borderHex: { dark: "25", light: "15" },
  },
  haram: {
    color: halalStatusColors.haram.base,
    bgHex: { dark: "14", light: "0C" },
    borderHex: { dark: "25", light: "15" },
  },
  doubtful: {
    color: halalStatusColors.doubtful.base,
    bgHex: { dark: "14", light: "0C" },
    borderHex: { dark: "25", light: "15" },
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export function MadhabVerdictCard({
  madhabVerdicts,
  certifierData,
  userMadhab,
  effectiveHeroStatus,
  onSelectMadhab,
}: MadhabVerdictCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  if (madhabVerdicts.length === 0) return null;

  // ── Derived state ──────────────────────────────────────────────
  const isUnanimous = madhabVerdicts.every(v => v.status === madhabVerdicts[0].status);
  const unanimousStatus = isUnanimous ? madhabVerdicts[0].status : null;
  const unanimousVisual = unanimousStatus ? UNANIMOUS_VISUALS[unanimousStatus] : null;

  const unanimousMessage =
    unanimousStatus === "halal"
      ? t.scanResult.madhabUnanimousHalal
      : unanimousStatus === "haram"
        ? t.scanResult.madhabUnanimousHaram
        : unanimousStatus === "doubtful"
          ? t.scanResult.madhabUnanimousDoubtful
          : null;

  const VERDICT_LABEL: Record<string, string> = {
    halal: t.scanResult.verdictHalal,
    doubtful: t.scanResult.verdictDoubtful,
    haram: t.scanResult.verdictHaram,
    unknown: t.scanResult.verdictUnknown,
  };

  return (
    <View>
      {/* ── Section Header ── */}
      <Animated.View
        entering={FadeIn.delay(SUSPENSE_DURATION + 350).duration(400)}
        style={[styles.sectionHeader, { marginHorizontal: spacing["3xl"] }]}
      >
        <View style={styles.sectionTitleRow}>
          <ScalesIcon
            size={15}
            color={isDark ? gold[400] : gold[700]}
            weight="fill"
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? gold[400] : gold[700] },
            ]}
          >
            {t.scanResult.madhabOpinions}
          </Text>
        </View>

        {isUnanimous && unanimousVisual && (
          <View
            style={[
              styles.consensusChip,
              {
                backgroundColor: `${unanimousVisual.color}${isDark ? unanimousVisual.bgHex.dark : unanimousVisual.bgHex.light}`,
                borderColor: `${unanimousVisual.color}${isDark ? unanimousVisual.borderHex.dark : unanimousVisual.borderHex.light}`,
              },
            ]}
          >
            <CheckCircleIcon
              size={11}
              color={unanimousVisual.color}
              weight="fill"
            />
            <Text
              style={[
                styles.consensusChipText,
                { color: unanimousVisual.color },
              ]}
            >
              Unanime
            </Text>
          </View>
        )}
      </Animated.View>

      {/* ── Glass Card ── */}
      <Animated.View
        entering={FadeInUp.delay(SUSPENSE_DURATION + 400).duration(500).springify().damping(14).stiffness(170).mass(0.9)}
        style={[
          styles.madhabCard,
          {
            backgroundColor: isDark ? glass.dark.bg : "#ffffff",
            borderColor: isDark ? glass.dark.border : glass.light.borderStrong,
            marginHorizontal: spacing["3xl"],
          },
        ]}
      >
        {/* ── Ring Row ── */}
        <View style={styles.madhabRow}>
          {madhabVerdicts.map((v, i) => {
            const labelKey = MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
            const label = labelKey ? t.scanResult[labelKey] : v.madhab;

            const trustKey = MADHAB_TRUST_KEY[v.madhab as keyof typeof MADHAB_TRUST_KEY];
            const madhabTrustScore = certifierData && trustKey
              ? (certifierData as Record<string, unknown>)[trustKey] as number | null ?? null
              : null;

            return (
              <PressableScale
                key={v.madhab}
                onPress={() => {
                  impact();
                  onSelectMadhab(v);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${v.status}${madhabTrustScore !== null ? `, ${t.scanResult.madhabTrustScoreLabel} ${madhabTrustScore}/100` : ""}`}
              >
                <MadhabScoreRing
                  label={label}
                  verdict={v.status as "halal" | "doubtful" | "haram" | "unknown"}
                  trustScore={madhabTrustScore}
                  verdictLabel={!certifierData ? VERDICT_LABEL[v.status] : undefined}
                  conflictCount={v.conflictingAdditives.length + (v.conflictingIngredients?.length ?? 0)}
                  isUserSchool={userMadhab === v.madhab}
                  staggerIndex={i}
                />
              </PressableScale>
            );
          })}
        </View>

        {/* ── Unanimous consensus message ── */}
        {isUnanimous && unanimousMessage && unanimousVisual && (
          <Animated.View
            entering={FadeIn.delay(SUSPENSE_DURATION + 600).duration(400)}
            style={[
              styles.unanimousMessage,
              {
                backgroundColor: `${unanimousVisual.color}${isDark ? "0C" : "08"}`,
                borderColor: `${unanimousVisual.color}${isDark ? "18" : "10"}`,
              },
            ]}
          >
            <Text
              style={[
                styles.unanimousText,
                { color: unanimousVisual.color },
              ]}
            >
              {unanimousMessage}
            </Text>
          </Animated.View>
        )}

        {/* ── Tap hint (when no certifier) ── */}
        {!certifierData && (
          <View style={styles.madhabTapHint}>
            <HandTapIcon size={11} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              {t.scanResult.madhabTapHint}
            </Text>
          </View>
        )}

        {/* ── Info note ── */}
        <View style={styles.madhabInfoNote}>
          <InfoIcon size={11} color={colors.textMuted} style={{ marginTop: 1 }} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            {certifierData?.name
              ? t.scanResult.madhabCertifierNote.replace("{{certifier}}", certifierData.name)
              : t.scanResult.madhabAlgoNote}
          </Text>
        </View>

        {/* ── Hadith card (doubtful only — gold calligraphic feel) ── */}
        {effectiveHeroStatus === "doubtful" && (
          <Animated.View
            entering={FadeInDown.delay(SUSPENSE_DURATION + 800).duration(500).springify().damping(14).stiffness(170).mass(0.9)}
            style={[
              styles.hadithCard,
              {
                backgroundColor: isDark ? `${gold[500]}0C` : `${gold[500]}08`,
                borderColor: isDark ? `${gold[500]}20` : `${gold[500]}12`,
                ...(Platform.OS === "ios" && {
                  shadowColor: gold[500],
                  shadowOpacity: isDark ? 0.12 : 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 8,
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[`${gold[500]}00`, gold[500], `${gold[500]}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.hadithAccentLine}
            />
            <Text style={[styles.hadithText, { color: isDark ? gold[200] : gold[800] }]}>
              {t.scanResult.hadithHalalBayyin}
            </Text>
            <Text style={[styles.hadithSource, { color: isDark ? gold[400] : gold[600] }]}>
              — {t.scanResult.hadithHalalBayyinSource}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  consensusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  consensusChipText: {
    fontSize: 10,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },

  // Card
  madhabCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  madhabRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingBottom: spacing.sm,
  },

  // Consensus
  unanimousMessage: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  unanimousText: {
    fontSize: 11,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "center",
    lineHeight: 16,
    letterSpacing: 0.1,
  },

  // Notes
  madhabTapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    width: "100%",
  },
  madhabInfoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  noteText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    lineHeight: 14,
    flex: 1,
  },

  // Hadith
  hadithCard: {
    width: "100%",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  hadithAccentLine: {
    width: "40%",
    height: 1,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  hadithText: {
    fontSize: Platform.OS === "android" ? 12 : 11,
    fontWeight: Platform.OS === "android" ? fontWeightTokens.regular : fontWeightTokens.medium,
    lineHeight: Platform.OS === "android" ? 20 : 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  hadithSource: {
    fontSize: Platform.OS === "android" ? 10 : 9,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "center",
    marginTop: spacing.xs,
    letterSpacing: Platform.OS === "android" ? 0.2 : 0.4,
  },
});
