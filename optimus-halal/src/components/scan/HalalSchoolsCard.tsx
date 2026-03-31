/**
 * HalalSchoolsCard — Interactive 4-School Madhab Deep-Dive
 *
 * Horizon Premium Minimalist layout: flat content on surface, no card wrapper.
 * Typography + whitespace + hairline dividers create visual structure.
 * Gold uppercase section header. Generous breathing room.
 *
 * @module components/scan/HalalSchoolsCard
 */

import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import {
  MosqueIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ListMagnifyingGlassIcon,

  BookOpenIcon,
  LeafIcon,
  FlaskIcon,
  SealCheckIcon,
  CaretRightIcon,
} from "phosphor-react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { CertifierLogo } from "./CertifierLogo";
import { MadhabScoreRing } from "./MadhabScoreRing";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens, fontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { letterSpacing } from "./scan-constants";
import {
  STATUS_CONFIG,
  MADHAB_LABEL_KEY,
  MADHAB_TRUST_KEY,
} from "./scan-constants";
import type { MadhabId, MadhabVerdict, CertifierInfo, DetectedAdditive } from "./scan-types";
import type { ScholarlySourceData } from "./ScholarlySourceSheet";
import { CertifierTrustRow } from "./CertifierTrustRow";
import { buildVerdictSummary, type MatrixLevel } from "@/utils/verdict-summary";

// ── Types ──

export interface HalalSchoolsCardProps {
  madhabVerdicts: MadhabVerdict[];
  userMadhab: MadhabId;
  certifierData: CertifierInfo | null;
  /** Halal analysis tier from backend (certified / analyzed_clean / doubtful / unknown) */
  halalTier?: string | null;
  /** Full list of product ingredients (from OFF/Gemini extraction) */
  ingredients: string[];
  ingredientRulings: Array<{
    pattern: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
  /** All detected additives from OFF product (enriched from DB) */
  detectedAdditives?: DetectedAdditive[];
  trustScore?: number;
  /** Certifier grade label for verdict summary (e.g. "Excellent", "Bon") */
  certifierGrade?: string | null;
  /** Certifier numeric score for verdict summary (0-100) */
  certifierScore?: number | null;
  /** Premium status — free users see consensus read-only, no madhab ring selector */
  isPremium?: boolean;
  onMadhabChange: (madhab: MadhabId) => void;
  onMadhabPress?: (verdict: MadhabVerdict) => void;
  onScholarlySourcePress: (data: ScholarlySourceData | ScholarlySourceData[]) => void;
  onTrustScorePress?: () => void;
  onIngredientPress?: (ingredient: string) => void;
  onAdditivePress?: (additive: DetectedAdditive, ruling?: string) => void;
  onNaqiyAdvicePress?: () => void;
  onUpsellPress?: () => void;
  staggerIndex?: number;
}

// ── Helper: get status color ──

function getStatusColor(status: string): string {
  return halalStatusTokens[status as keyof typeof halalStatusTokens]?.base
    ?? halalStatusTokens.unknown.base;
}

// ── Helper: resolve madhab label ──

function getMadhabLabel(
  madhab: MadhabId,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const key = MADHAB_LABEL_KEY[madhab as keyof typeof MADHAB_LABEL_KEY];
  if (!key) return madhab;
  return (t.scanResult as Record<string, string>)[key] ?? madhab;
}

// ── Helper: resolve status label ──

function getStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const config = STATUS_CONFIG[status];
  if (!config) return status;
  const labelKey = config.labelKey;
  return (t.scanResult as Record<string, string>)[labelKey] ?? status;
}

// ── Matrix color helpers ──

function getMatrixColor(level: MatrixLevel): string {
  switch (level) {
    case "high":
    case "good":
      return halalStatusTokens.halal.base;
    case "vigilance":
      return halalStatusTokens.doubtful.base;
    case "low":
      return halalStatusTokens.doubtful.base;
    case "danger":
      return halalStatusTokens.haram.base;
  }
}

function getMatrixBg(level: MatrixLevel, isDark: boolean): string {
  switch (level) {
    case "high":
      return isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)";
    case "good":
      return isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)";
    case "vigilance":
      return isDark ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.08)";
    case "low":
      return isDark ? "rgba(249,115,22,0.14)" : "rgba(249,115,22,0.10)";
    case "danger":
      return isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)";
  }
}

// ── A. VerdictSection — intelligent verdict summary + conflict details ──

interface VerdictSectionProps {
  activeVerdict: MadhabVerdict;
  allVerdicts: MadhabVerdict[];
  certifierName: string | null;
  certifierGrade: string | null;
  certifierScore: number | null;
  isPremium: boolean;
  onNaqiyAdvicePress?: () => void;
  onUpsellPress?: () => void;
}

function VerdictSection({
  activeVerdict,
  allVerdicts,
  certifierName,
  certifierGrade,
  certifierScore,
  isPremium,
  onNaqiyAdvicePress,
  onUpsellPress,
}: VerdictSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Deduplicated conflict count (doubtful + haram items across all schools)
  const conflictCount = useMemo(() => {
    const ids = new Set<string>();
    for (const v of allVerdicts) {
      for (const i of v.conflictingIngredients ?? []) {
        if (i.ruling !== "halal") ids.add(i.pattern);
      }
      for (const a of v.conflictingAdditives ?? []) {
        if (a.ruling !== "halal") ids.add(a.code);
      }
    }
    return ids.size;
  }, [allVerdicts]);

  // ── Build intelligent verdict summary ──
  const verdictSummary = useMemo(
    () =>
      buildVerdictSummary(
        {
          madhabVerdicts: allVerdicts.map((v) => ({
            madhab: v.madhab,
            status: v.status,
          })),
          certifierName,
          certifierGrade,
          certifierScore,
          conflictCount,
        },
        t.verdict,
      ),
    [allVerdicts, certifierName, certifierGrade, certifierScore, conflictCount, t.verdict],
  );

  // ── Conflicts: active school first, then merge from divergent schools ──
  // When there's divergence but the active school has no conflicts (e.g. Hanafi
  // considers lactosérum halal while Shafi'i/Maliki say doubtful), we show the
  // conflict items from the schools that DO disagree. Otherwise the user sees
  // "Divergence entre écoles" with no explanation of why.
  const collectConflicts = (verdict: MadhabVerdict) => {
    const items: Array<{ id: string; label: string; ruling: string; code?: string; school?: string; explanation: string; scholarlyReference: string | null }> = [];
    for (const i of verdict.conflictingIngredients ?? []) {
      items.push({ id: i.pattern, label: i.pattern, ruling: i.ruling, explanation: i.explanation, scholarlyReference: i.scholarlyReference });
    }
    for (const a of verdict.conflictingAdditives ?? []) {
      items.push({ id: a.code, label: a.name, code: a.code, ruling: a.ruling, explanation: a.explanation, scholarlyReference: a.scholarlyReference });
    }
    return items.filter((c) => c.ruling !== "halal");
  };

  let activeConflicts = collectConflicts(activeVerdict);

  // Fallback: if active school has no conflicts but divergence exists,
  // gather conflicts from disagreeing schools (deduplicated by id)
  if (activeConflicts.length === 0 && !verdictSummary.isConsensus) {
    const seen = new Set<string>();
    for (const v of allVerdicts) {
      if (v.madhab === activeVerdict.madhab) continue;
      for (const c of collectConflicts(v)) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          activeConflicts.push(c);
        }
      }
    }
  }

  const hasConflicts = activeConflicts.length > 0;

  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <Animated.View
      layout={Layout.springify().damping(14).stiffness(170)}
      style={styles.verdictSection}
    >
      {/* Matrix Verdict Card — unified NaqiyScore × composition × consensus */}
      {/* Free users: tappable → opens upsell sheet */}
      <Pressable
        disabled={isPremium || !onUpsellPress}
        onPress={onUpsellPress}
        accessibilityRole={!isPremium ? "button" : undefined}
        accessibilityLabel={!isPremium ? t.verdict.upsellTitle : undefined}
        style={[styles.verdictCard, {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        }]}
      >
        {/* Matrix label — bold colored badge */}
        <View style={styles.verdictCardHeader}>
          <View style={[styles.matrixLabelRow, {
            backgroundColor: getMatrixBg(verdictSummary.matrixLevel, isDark),
          }]}>
            <Text style={[styles.matrixLabelText, {
              color: getMatrixColor(verdictSummary.matrixLevel),
            }]}>
              {verdictSummary.matrixLabel}
            </Text>
          </View>
          {!isPremium && onUpsellPress && (
            <CaretRightIcon size={14} color={colors.textMuted} weight="bold" />
          )}
        </View>

        {/* Matrix phrase — unified explanation */}
        <Text style={[styles.matrixPhraseText, { color: colors.textPrimary }]}>
          {verdictSummary.matrixPhrase}
        </Text>
      </Pressable>

      {/* Naqiy advice button — ultra-premium brand treatment */}
      {verdictSummary.isDoubtful && onNaqiyAdvicePress && (
        <Pressable
          onPress={onNaqiyAdvicePress}
          accessibilityRole="button"
          accessibilityLabel={t.verdict.naqiyAdvice}
          style={styles.naqiyAdviceOuter}
        >
          <LinearGradient
            colors={
              isDark
                ? [gold[950], "rgba(212,175,55,0.15)", gold[950]]
                : ["rgba(212,175,55,0.10)", "rgba(75,122,56,0.06)", "rgba(212,175,55,0.10)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.naqiyAdviceGradient,
              {
                borderColor: isDark
                  ? "rgba(212,175,55,0.25)"
                  : "rgba(212,175,55,0.30)",
              },
            ]}
          >
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={styles.naqiyAdviceLogo}
              contentFit="contain"
            />
            <Text
              style={[
                styles.naqiyAdviceButtonText,
                { color: isDark ? gold[300] : gold[700] },
              ]}
            >
              {t.verdict.naqiyAdvice}
            </Text>
            <CaretRightIcon
              size={12}
              color={isDark ? gold[400] : gold[600]}
              weight="bold"
            />
          </LinearGradient>
        </Pressable>
      )}

      {/* Conflict substances — name + ruling only (details in Sources) */}
      {hasConflicts && (
        <Animated.View entering={FadeInDown.duration(280)} style={styles.conflictList}>
          {activeConflicts.map((conflict, index) => (
            <View
              key={`${conflict.id}-${index}`}
              style={[styles.conflictItem, { borderLeftColor: getStatusColor(conflict.ruling) }]}
            >
              <Text style={[styles.conflictLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {conflict.code ? `${conflict.code} · ${conflict.label}` : conflict.label}
              </Text>
              <Text style={[styles.conflictRuling, { color: getStatusColor(conflict.ruling) }]}>
                {conflict.ruling}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── B. MadhabRingRow — all 4 schools as score rings ──

interface MadhabRingRowProps {
  madhabVerdicts: MadhabVerdict[];
  activeMadhab: MadhabId;
  userMadhab: MadhabId;
  certifierData: CertifierInfo | null;
  onSelect: (madhab: MadhabId) => void;
  onMadhabPress?: (verdict: MadhabVerdict) => void;
}

function MadhabRingRow({
  madhabVerdicts,
  activeMadhab,
  userMadhab,
  certifierData,
  onSelect,
  onMadhabPress,
}: MadhabRingRowProps) {
  const { t } = useTranslation();
  const { impact } = useHaptics();

  const VERDICT_LABEL: Record<string, string> = {
    halal: t.scanResult.verdictHalal,
    doubtful: t.scanResult.verdictDoubtful,
    haram: t.scanResult.verdictHaram,
    unknown: t.scanResult.verdictUnknown,
  };

  return (
    <View style={styles.madhabRingRow}>
      {madhabVerdicts.map((v, i) => {
        const labelKey = MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
        const label = labelKey
          ? (t.scanResult as Record<string, string>)[labelKey] ?? v.madhab
          : v.madhab;

        const trustKey = MADHAB_TRUST_KEY[v.madhab as keyof typeof MADHAB_TRUST_KEY];
        const madhabTrustScore = certifierData && trustKey
          ? (certifierData as unknown as Record<string, unknown>)[trustKey] as number | null ?? null
          : null;

        return (
          <PressableScale
            key={v.madhab}
            onPress={() => {
              impact();
              onSelect(v.madhab);
              onMadhabPress?.(v);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${v.status}`}
            accessibilityHint={t.scanResult.madhabTapHint}
          >
            <MadhabScoreRing
              label={label}
              verdict={v.status as "halal" | "doubtful" | "haram" | "unknown"}
              trustScore={madhabTrustScore}
              verdictLabel={!certifierData ? VERDICT_LABEL[v.status] : undefined}
              conflictCount={
                (v.conflictingAdditives?.length ?? 0) +
                (v.conflictingIngredients?.length ?? 0)
              }
              isUserSchool={userMadhab === v.madhab}
              isActive={activeMadhab === v.madhab}
              staggerIndex={i}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}


// ── C2. AdditivesContent — shows ALL detected additives, color-coded by madhab ruling ──

function AdditivesContent({
  detectedAdditives,
  conflictingAdditives,
  isDark,
  colors,
  onAdditivePress,
}: {
  detectedAdditives: DetectedAdditive[];
  conflictingAdditives: MadhabVerdict["conflictingAdditives"];
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onAdditivePress?: (additive: DetectedAdditive, ruling?: string) => void;
}) {
  const { t } = useTranslation();

  // Build ruling lookup from madhab conflicting additives
  const rulingMap = useMemo(() => {
    const map = new Map<string, { ruling: string; explanation: string }>();
    for (const ca of conflictingAdditives) {
      map.set(ca.code, { ruling: ca.ruling, explanation: ca.explanation });
    }
    return map;
  }, [conflictingAdditives]);

  // Sort: conflicting first (haram > doubtful), then rest alphabetically
  const sorted = useMemo(() => {
    const STATUS_WEIGHT: Record<string, number> = { haram: 3, doubtful: 2, halal: 1 };
    return [...detectedAdditives].sort((a, b) => {
      const ra = rulingMap.get(a.code);
      const rb = rulingMap.get(b.code);
      const wa = ra ? (STATUS_WEIGHT[ra.ruling] ?? 0) : 0;
      const wb = rb ? (STATUS_WEIGHT[rb.ruling] ?? 0) : 0;
      if (wa !== wb) return wb - wa; // Conflicting first
      return a.code.localeCompare(b.code);
    });
  }, [detectedAdditives, rulingMap]);

  if (detectedAdditives.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {t.scanResult.additivesNone as string}
      </Text>
    );
  }

  return (
    <>
      {sorted.map((additive, index) => {
        const conflict = rulingMap.get(additive.code);
        const hasRuling = !!conflict;
        const rulingColor = hasRuling
          ? (STATUS_CONFIG[conflict.ruling] ?? STATUS_CONFIG.unknown).color
          : undefined;

        // Toxicity indicator color (for non-halal-conflicting additives)
        const toxColor = !hasRuling ? TOXICITY_COLOR[additive.toxicityLevel] : undefined;

        const Wrapper = onAdditivePress ? Pressable : View;
        const wrapperProps = onAdditivePress
          ? { onPress: () => onAdditivePress(additive, conflict?.ruling) }
          : {};

        return (
          <Wrapper
            key={additive.code}
            accessibilityRole={onAdditivePress ? "button" : undefined}
            accessibilityLabel={`${additive.code} ${additive.nameFr}`}
            {...wrapperProps}
            style={[
              styles.listItem,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              },
            ] as any}
          >
            {/* Left: color indicator bar for conflicting additives */}
            {hasRuling && (
              <View style={[styles.additiveIndicator, { backgroundColor: rulingColor }]} />
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.additiveRow}>
                <Text
                  style={[
                    styles.additiveCode,
                    { color: hasRuling ? rulingColor : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {additive.code}
                </Text>
                <Text
                  style={[
                    styles.listItemLabel,
                    { color: hasRuling ? rulingColor : colors.textPrimary, flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {additive.nameFr}
                </Text>
              </View>
              {/* Show explanation for conflicting, or health effect for others */}
              {hasRuling && conflict.explanation.length > 0 ? (
                <Text
                  style={[styles.listItemSub, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {conflict.explanation}
                </Text>
              ) : additive.healthEffectsFr ? (
                <Text
                  style={[styles.listItemSub, { color: toxColor ?? colors.textMuted }]}
                  numberOfLines={2}
                >
                  {additive.healthEffectsFr}
                </Text>
              ) : null}
            </View>
            {/* Right: ruling badge or category */}
            {hasRuling ? (
              <View style={[styles.additiveRulingBadge, { backgroundColor: `${rulingColor}18` }]}>
                <Text style={[styles.additiveRulingText, { color: rulingColor }]}>
                  {conflict.ruling}
                </Text>
              </View>
            ) : (
              <Text style={[styles.additiveCategoryText, { color: toxColor ?? colors.textMuted }]}>
                {CATEGORY_LABEL[additive.category] ?? additive.category}
              </Text>
            )}
          </Wrapper>
        );
      })}
    </>
  );
}

// ── Additive helper maps ──

const TOXICITY_COLOR: Record<string, string> = {
  safe: "#22c55e",
  low_concern: "#84cc16",
  moderate_concern: "#f59e0b",
  high_concern: "#ef4444",
};

const CATEGORY_LABEL: Record<string, string> = {
  colorant: "Colorant",
  preservative: "Conservateur",
  antioxidant: "Antioxydant",
  emulsifier: "Émulsifiant",
  stabilizer: "Stabilisant",
  thickener: "Épaississant",
  flavor_enhancer: "Exhausteur",
  sweetener: "Édulcorant",
  acid: "Acidifiant",
  anti_caking: "Anti-aggl.",
  glazing_agent: "Agent d'enr.",
  humectant: "Humectant",
  raising_agent: "Levant",
  sequestrant: "Séquestrant",
  other: "Autre",
};

// ── D. ScholarlySourcesRibbon ──

interface ScholarlySourcesRibbonProps {
  activeVerdict: MadhabVerdict;
  allVerdicts: MadhabVerdict[];
  onScholarlySourcePress: (data: ScholarlySourceData | ScholarlySourceData[]) => void;
  isDark: boolean;
}

function ScholarlySourcesRibbon({
  activeVerdict,
  allVerdicts,
  onScholarlySourcePress,
  isDark,
}: ScholarlySourcesRibbonProps) {
  const { t } = useTranslation();

  // Collect source data (explanation + ref) from all verdicts, deduplicated by sourceRef
  const sourceEntries = useMemo(() => {
    const byRef = new Map<string, ScholarlySourceData>();
    const verdictsToScan = [activeVerdict, ...allVerdicts.filter((v) => v.madhab !== activeVerdict.madhab)];
    for (const verdict of verdictsToScan) {
      for (const item of [
        ...(verdict.conflictingAdditives ?? []),
        ...(verdict.conflictingIngredients ?? []),
      ]) {
        if (item.scholarlyReference && !byRef.has(item.scholarlyReference)) {
          const label = "code" in item
            ? `${(item as any).code} · ${(item as any).name ?? ""}`.trim()
            : (item as any).pattern ?? "";
          byRef.set(item.scholarlyReference, {
            label,
            explanation: item.explanation,
            sourceRef: item.scholarlyReference,
          });
        }
      }
    }
    return [...byRef.values()];
  }, [activeVerdict, allVerdicts]);

  if (sourceEntries.length === 0) return null;

  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.ribbonContent}
      style={styles.ribbonScroll}
    >
      {sourceEntries.map((entry, index) => {
        const truncated = entry.sourceRef.length > 30 ? `${entry.sourceRef.slice(0, 30)}\u2026` : entry.sourceRef;
        return (
          <Pressable
            key={`${entry.sourceRef}-${index}`}
            onPress={() => onScholarlySourcePress(entry)}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={entry.sourceRef}
            accessibilityHint={t.common.openSourceHint}
            style={[
              styles.ribbonPill,
              { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
            ]}
          >
            <BookOpenIcon size={13} color={goldColor} />
            <Text style={[styles.ribbonPillText, { color: goldColor }]}>
              {truncated}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── E0b. SectionHeader — icon + title + optional annotation ──

function HalalSectionHeader({
  icon,
  title,
  annotation,
  onAnnotationPress,
}: {
  icon: React.ReactNode;
  title: string;
  annotation?: string;
  onAnnotationPress?: () => void;
}) {
  const { isDark } = useTheme();
  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <View style={styles.halalSectionHeader}>
      <View style={styles.halalSectionHeaderLeft}>
        {icon}
        <Text
          style={[
            styles.halalSectionTitle,
            { color: isDark ? "#fff" : "#0d1b13" },
          ]}
        >
          {title}
        </Text>
      </View>
      {annotation ? (
        <Pressable onPress={onAnnotationPress} hitSlop={8}>
          <Text style={[styles.halalSectionAnnotation, { color: goldColor }]}>
            {annotation}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── E0c. CertifierInfoRow — VerdictHero-style certifier card ──
// Section title + logo + name + score + progress bar + tier + Naqiy verdict phrase

// Verdict thresholds aligned with NaqiyScore™ scale:
// - ≥90: Très fiable — top-tier ritual compliance
// - ≥70: Fiable — solid practices, minor gaps
// - ≥51: Vigilance — mixed signals, verify
// - ≥35: Peu fiable — significant concerns
// - <35: Pas fiable du tout — no assurance
function getCertifierVerdict(
  score: number,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (score >= 90) return t.scanResult.certifierVerdictExcellent as string;
  if (score >= 70) return t.scanResult.certifierVerdictGood as string;
  if (score >= 51) return t.scanResult.certifierVerdictAverage as string;
  if (score >= 35) return t.scanResult.certifierVerdictWeak as string;
  return t.scanResult.certifierVerdictVeryWeak as string;
}

function CertifierInfoRow({
  certifierData,
  madhabTrustScore,
  halalTier,
  onPress,
}: {
  certifierData: CertifierInfo;
  madhabTrustScore: number | null;
  halalTier?: string | null;
  onPress?: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Use per-madhab trust score if available, otherwise global
  const displayScore = madhabTrustScore ?? certifierData.trustScore;

  // Score color by threshold
  const scoreColor = displayScore >= 70
    ? halalStatusTokens.halal.base
    : displayScore >= 40
      ? halalStatusTokens.doubtful.base
      : halalStatusTokens.haram.base;

  // Tier label
  const tierNumber = halalTier === "certified" ? "1"
    : halalTier === "analyzed_clean" ? "2"
    : halalTier === "doubtful" ? "3" : "4";
  const tierLabel = halalTier === "certified" ? t.scanResult.tierCertified
    : halalTier === "analyzed_clean" ? t.scanResult.tierAnalyzed
    : halalTier === "doubtful" ? t.scanResult.tierDoubtful
    : t.scanResult.tierUnknown;

  // Naqiy verdict phrase
  const verdictPhrase = getCertifierVerdict(displayScore, t);

  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <View style={styles.certifierSection}>
      {/* Section title — same style as Sources/Ingrédients */}
      <HalalSectionHeader
        icon={<SealCheckIcon size={16} color={goldColor} weight="bold" />}
        title={t.scanResult.certifierSectionTitle as string}
      />

      {/* Certifier card */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${certifierData.name}, score ${displayScore}/100`}
        style={styles.certifierCard}
      >
        <View style={styles.certifierCardInner}>
          <CertifierTrustRow
            variant="full"
            certifierId={certifierData.id ?? ""}
            certifierName={certifierData.name}
            trustScore={displayScore}
          />

          {/* Tier label */}
          {halalTier && (
            <Text style={[styles.certifierTierLabel, { color: colors.textMuted }]}>
              {t.scanResult.tier} {tierNumber} · {tierLabel}
            </Text>
          )}

          {/* Naqiy verdict phrase */}
          <Text style={[styles.certifierVerdictPhrase, { color: scoreColor }]}>
            {verdictPhrase}
          </Text>
        </View>

        <CaretRightIcon size={14} color={isDark ? "#8b929a" : "#6b7280"} />
      </Pressable>
    </View>
  );
}

// ── E0d. IngredientChips — flex-wrap chips colored by ruling status ──

function IngredientChips({
  ingredients,
  ingredientRulings,
  additiveCodeMap,
  onIngredientPress,
}: {
  ingredients: string[];
  ingredientRulings: HalalSchoolsCardProps["ingredientRulings"];
  additiveCodeMap?: Map<string, string>;
  onIngredientPress?: (ingredient: string) => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Strip diacritics so "lactoserum" matches "lactosérum"
  const strip = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Build ruling lookup (accent-insensitive)
  const rulingPatterns = useMemo(
    () =>
      ingredientRulings.map((r) => ({
        pattern: strip(r.pattern),
        ruling: r.ruling,
      })),
    [ingredientRulings],
  );

  const validIngredients = useMemo(
    () => ingredients.filter((i) => typeof i === "string" && i.trim().length > 0),
    [ingredients],
  );

  const displayItems = useMemo(() => {
    if (validIngredients.length > 0) return validIngredients;
    if (ingredientRulings.length > 0) return ingredientRulings.map((r) => r.pattern);
    return [];
  }, [validIngredients, ingredientRulings]);

  if (displayItems.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {t.scanResult.ingredientsNone as string}
      </Text>
    );
  }

  return (
    <View style={styles.ingredientChipsContainer}>
      {displayItems.map((ingredient, index) => {
        const stripped = strip(ingredient);
        const matched = rulingPatterns.find(
          (r) => stripped.includes(r.pattern) || r.pattern.includes(stripped),
        );
        const ruling = matched?.ruling;
        const isHaram = ruling === "haram";
        const isDoubtful = ruling === "doubtful";

        // Resolve E-code for known additives (e.g. "mono/diglycérides" → "E471")
        let eCode: string | undefined;
        if (additiveCodeMap && (isHaram || isDoubtful)) {
          for (const [name, code] of additiveCodeMap) {
            if (stripped.includes(name) || name.includes(stripped)) {
              eCode = code;
              break;
            }
          }
        }

        const chipBg = isHaram
          ? isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)"
          : isDoubtful
            ? isDark ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.08)"
            : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

        const chipColor = isHaram
          ? "#ef4444"
          : isDoubtful
            ? "#f97316"
            : isDark ? "#d1d5db" : "#4b5563";

        const chipWeight: "700" | "600" | "500" = isHaram ? "700" : isDoubtful ? "600" : "500";

        const chipLabel = eCode ? `${eCode} · ${ingredient}` : ingredient;

        return (
          <Pressable
            key={`${ingredient}-${index}`}
            onPress={onIngredientPress ? () => onIngredientPress(ingredient) : undefined}
            accessibilityRole="button"
            accessibilityLabel={chipLabel}
            style={[styles.ingredientChip, { backgroundColor: chipBg }]}
          >
            <Text
              style={[
                styles.ingredientChipText,
                { color: chipColor, fontWeight: chipWeight },
              ]}
              numberOfLines={1}
            >
              {chipLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── E. Main HalalSchoolsCard shell ──

export function HalalSchoolsCard({
  madhabVerdicts,
  userMadhab,
  certifierData,
  halalTier,
  ingredients,
  ingredientRulings,
  trustScore,
  detectedAdditives,
  certifierGrade,
  certifierScore,
  isPremium = false,
  onMadhabChange: _onMadhabChange,
  onMadhabPress,
  onScholarlySourcePress,
  onTrustScorePress,
  onIngredientPress,
  onAdditivePress,
  onNaqiyAdvicePress,
  onUpsellPress,
  staggerIndex = 3,
}: HalalSchoolsCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Free users: force consensus (general) madhab — no personalized school selection
  const effectiveUserMadhab = isPremium ? userMadhab : "general";
  const [activeMadhab, setActiveMadhab] = useState<MadhabId>(effectiveUserMadhab);

  // Sync active madhab when profile loads async
  useEffect(() => {
    setActiveMadhab(effectiveUserMadhab);
  }, [effectiveUserMadhab]);

  // All source data for "Voir tout" button (deduplicated by sourceRef)
  // Must be before early return to respect Rules of Hooks
  const allSourceData = useMemo(() => {
    const byRef = new Map<string, ScholarlySourceData>();
    for (const v of madhabVerdicts) {
      for (const item of [
        ...(v.conflictingAdditives ?? []),
        ...(v.conflictingIngredients ?? []),
      ]) {
        if (item.scholarlyReference && !byRef.has(item.scholarlyReference)) {
          const label = "code" in item
            ? `${(item as any).code} · ${(item as any).name ?? ""}`.trim()
            : (item as any).pattern ?? "";
          byRef.set(item.scholarlyReference, {
            label,
            explanation: item.explanation,
            sourceRef: item.scholarlyReference,
          });
        }
      }
    }
    return [...byRef.values()];
  }, [madhabVerdicts]);

  // Reverse lookup: normalized additive name → E-code (e.g. "mono/diglycerides d'acides gras" → "E471")
  const additiveCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    const strip = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    for (const v of madhabVerdicts) {
      for (const a of v.conflictingAdditives ?? []) {
        if (a.code && a.name) {
          map.set(strip(a.name), a.code);
        }
      }
    }
    return map;
  }, [madhabVerdicts]);

  const activeVerdict = madhabVerdicts.find((v) => v.madhab === activeMadhab)
    ?? madhabVerdicts[0];

  if (!activeVerdict) return null;

  // Per-madhab trust score for the tapped school
  const activeMadhabTrustKey = MADHAB_TRUST_KEY[activeMadhab as keyof typeof MADHAB_TRUST_KEY];
  const activeMadhabTrustScore = certifierData && activeMadhabTrustKey
    ? (certifierData as unknown as Record<string, unknown>)[activeMadhabTrustKey] as number | null ?? null
    : null;

  function handleMadhabSelect(madhab: MadhabId) {
    // Tap changes ONLY the displayed info (local state), NOT the user's profile preference
    setActiveMadhab(madhab);
  }

  const goldColor = isDark ? gold[400] : gold[700];
  const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };
  const ingredientCount = ingredients.length > 0 ? ingredients.length : ingredientRulings.length;

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
      style={styles.container}
    >
      {/* ═══ 1. Verdict summary — always first ═══ */}
      <HalalSectionHeader
        icon={<ClipboardTextIcon size={16} color={goldColor} weight="bold" />}
        title="Résumé"
      />
      <VerdictSection
        activeVerdict={activeVerdict}
        allVerdicts={madhabVerdicts}
        certifierName={certifierData?.name ?? null}
        certifierGrade={certifierGrade ?? null}
        certifierScore={certifierScore ?? null}
        isPremium={isPremium}
        onNaqiyAdvicePress={onNaqiyAdvicePress}
        onUpsellPress={!isPremium ? onUpsellPress : undefined}
      />

      {/* ═══ 2. Certifier card with per-madhab trust score ═══ */}
      {certifierData && (
        <CertifierInfoRow
          certifierData={certifierData}
          madhabTrustScore={activeMadhabTrustScore}
          halalTier={halalTier}
          onPress={onTrustScorePress}
        />
      )}

      {/* ═══ 3. Madhab rings — premium only, hidden when certified ═══ */}
      {isPremium && !certifierData && madhabVerdicts.length > 1 && (
        <>
          <HalalSectionHeader
            icon={<ListMagnifyingGlassIcon size={16} color={goldColor} weight="bold" />}
            title="Analyse des ingrédients"
          />
          <MadhabRingRow
            madhabVerdicts={madhabVerdicts}
            activeMadhab={activeMadhab}
            userMadhab={effectiveUserMadhab}
            certifierData={certifierData}
            onSelect={handleMadhabSelect}
            onMadhabPress={onMadhabPress}
          />
        </>
      )}

      {/* ═══ 4. Scholarly Sources ═══ */}
      <HalalSectionHeader
        icon={<BookOpenIcon size={16} color={goldColor} weight="bold" />}
        title="Sources"
        annotation={allSourceData.length > 0 ? "Voir tout" : undefined}
        onAnnotationPress={allSourceData.length > 0 ? () => onScholarlySourcePress(allSourceData) : undefined}
      />
      <ScholarlySourcesRibbon
        activeVerdict={activeVerdict}
        allVerdicts={madhabVerdicts}
        onScholarlySourcePress={onScholarlySourcePress}
        isDark={isDark}
      />

      {/* ═══ 5. Ingredients as flat chips ═══ */}
      <HalalSectionHeader
        icon={<LeafIcon size={16} color={goldColor} weight="bold" />}
        title="Ingrédients"
        annotation={ingredientCount > 0 ? `${ingredientCount}` : undefined}
      />
      <IngredientChips
        ingredients={ingredients}
        ingredientRulings={ingredientRulings}
        additiveCodeMap={additiveCodeMap}
        onIngredientPress={onIngredientPress}
      />

      {/* ═══ 6. Additifs — ALL detected, color-coded by madhab ruling ═══ */}
      <HalalSectionHeader
        icon={<FlaskIcon size={16} color={goldColor} weight="bold" />}
        title={t.scanResult.accordionAdditives as string}
        annotation={
          (detectedAdditives?.length ?? 0) > 0
            ? `${detectedAdditives?.length ?? 0}`
            : (activeVerdict.conflictingAdditives?.length ?? 0) > 0
              ? `${activeVerdict.conflictingAdditives?.length ?? 0}`
              : undefined
        }
      />
      <AdditivesContent
        detectedAdditives={detectedAdditives ?? []}
        conflictingAdditives={activeVerdict.conflictingAdditives ?? []}
        isDark={isDark}
        colors={colors}
        onAdditivePress={onAdditivePress}
      />
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  // ── Flat container (no card wrapper) ──
  container: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizeTokens.micro,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },

  // ── Horizon divider ──
  horizonDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Verdict Section ──
  verdictSection: {
    gap: spacing.md,
  },
  verdictCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  verdictRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  verdictFiqhText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    flex: 1,
  },
  verdictTheoreticalText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
    marginLeft: 22, // align with text after icon
  },
  verdictCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matrixLabelRow: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matrixLabelText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },
  matrixPhraseText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  verdictCertifierRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  verdictCertifierInnerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    flex: 1,
  },
  naqiyAdviceOuter: {
    alignSelf: "flex-start",
  },
  naqiyAdviceGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  naqiyAdviceLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  naqiyAdviceButtonText: {
    fontSize: fontSizeTokens.caption,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeightTokens.semiBold,
    letterSpacing: 0.2,
  },
  conflictList: {
    gap: spacing.sm,
  },
  conflictItem: {
    borderLeftWidth: 3,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conflictLabel: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.medium,
  },
  conflictRuling: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },

  // ── Madhab ring row ──
  madhabRingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    marginTop: spacing["2xl"],
    paddingBottom: spacing.md,
  },

  // ── Shared list item styles ──
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  listItemLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  listItemSub: {
    fontSize: fontSizeTokens.micro,
    marginTop: 2,
    lineHeight: 16,
  },
  listItemRuling: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  additiveRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  additiveCode: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    marginRight: spacing.xs,
  },
  additiveIndicator: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: "stretch",
    marginRight: spacing.xs,
  },
  additiveRulingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  additiveRulingText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    textTransform: "capitalize",
  },
  additiveCategoryText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSizeTokens.bodySmall,
    fontStyle: "italic",
    paddingVertical: spacing.xs,
  },

  // ── Halal section header (matching mockup: .sh) ──
  halalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 28,
  },
  halalSectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  halalSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  halalSectionAnnotation: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Certifier section ──
  certifierSection: {
    marginTop: spacing.lg,
  },
  certifierCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  certifierCardInner: {
    flex: 1,
    gap: 4,
  },
  certifierTierLabel: {
    fontSize: 9,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.3,
  },
  certifierVerdictPhrase: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    fontStyle: "italic",
    marginTop: 2,
  },

  // ── Ingredient chips (mockup: .ig/.ic) ──
  ingredientChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  ingredientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ingredientChipText: {
    fontSize: 13,
  },

  // ── Scholarly sources ribbon ──
  ribbonScroll: {
    marginHorizontal: -spacing.xs,
  },
  ribbonContent: {
    paddingHorizontal: spacing.xs,
    gap: 8,
  },
  ribbonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ribbonPillText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },

});
