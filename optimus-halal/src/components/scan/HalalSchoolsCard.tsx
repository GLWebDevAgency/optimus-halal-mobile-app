/**
 * HalalSchoolsCard — Interactive 4-School Madhab Deep-Dive
 *
 * Allows the user to explore each school's verdict in detail:
 * - HeroCard: full breakdown of the active madhab (conflicts, sources, explanations)
 * - SegmentedBar: switch between the 3 other madhabs with one tap
 *
 * Extended in Task 10b (accordions: ingredients, additives, certification)
 * and Task 10c (scholarly source bottom sheet).
 *
 * @module components/scan/HalalSchoolsCard
 */

import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  useReducedMotion,
} from "react-native-reanimated";
import {
  MosqueIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  BookOpenIcon,
  ArrowSquareOutIcon,
  LeafIcon,
  FlaskIcon,
  SealCheckIcon,
  CaretDownIcon,
} from "phosphor-react-native";

import { SectionCard } from "./SectionCard";
import { CertifierBadge } from "./CertifierBadge";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  STATUS_CONFIG,
  MADHAB_LABEL_KEY,
} from "./scan-constants";
import type { MadhabId, MadhabVerdict, CertifierInfo } from "./scan-types";

// ── Types ──

export interface HalalSchoolsCardProps {
  madhabVerdicts: MadhabVerdict[];
  userMadhab: MadhabId;
  certifierData: CertifierInfo | null;
  ingredientRulings: Array<{
    pattern: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
  onMadhabChange: (madhab: MadhabId) => void;
  onScholarlySourcePress: (sourceRef: string) => void;
  staggerIndex?: number;
}

// ── Helper: get status color ──

function getStatusColor(status: string): string {
  return halalStatusTokens[status as keyof typeof halalStatusTokens]?.base
    ?? halalStatusTokens.unknown.base;
}

// ── Helper: get status bg color ──

function getStatusBg(status: string, isDark: boolean): string {
  const token = halalStatusTokens[status as keyof typeof halalStatusTokens];
  if (!token) return isDark ? halalStatusTokens.unknown.bgDark : halalStatusTokens.unknown.bg;
  return isDark ? token.bgDark : token.bg;
}

// ── Helper: resolve madhab label ──

function getMadhabLabel(
  madhab: MadhabId,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const key = MADHAB_LABEL_KEY[madhab];
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

// ── A. HeroCard subcomponent ──

interface HeroCardProps {
  activeVerdict: MadhabVerdict;
  onScholarlySourcePress: (sourceRef: string) => void;
}

function HeroCard({ activeVerdict, onScholarlySourcePress }: HeroCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const status = activeVerdict.status;
  const statusColor = getStatusColor(status);
  const statusBg = getStatusBg(status, isDark);
  const statusLabel = getStatusLabel(status, t);
  const madhabLabel = getMadhabLabel(activeVerdict.madhab, t);

  // Title interpolation
  const heroTitle = (t.scanResult.schoolHeroTitle as string)
    .replace("{{status}}", statusLabel)
    .replace("{{school}}", madhabLabel);

  // Conflict items (non-halal ruling)
  const conflictingAdditives = activeVerdict.conflictingAdditives ?? [];
  const conflictingIngredients = activeVerdict.conflictingIngredients ?? [];

  const allConflicts = [
    ...conflictingAdditives.map((a) => ({
      id: a.code,
      label: `${a.name} (${a.code})`,
      ruling: a.ruling,
      explanation: a.explanation,
      scholarlyReference: a.scholarlyReference,
    })),
    ...conflictingIngredients.map((i) => ({
      id: i.pattern,
      label: i.pattern,
      ruling: i.ruling,
      explanation: i.explanation,
      scholarlyReference: i.scholarlyReference,
    })),
  ];

  const conflictCount = allConflicts.filter((c) => c.ruling !== "halal").length;
  const doubtCount = allConflicts.filter((c) => c.ruling === "doubtful").length;

  // Unique scholarly references
  const allRefs = allConflicts
    .map((c) => c.scholarlyReference)
    .filter((ref): ref is string => ref !== null);
  const uniqueRefs = new Set(allRefs);
  const sourceCount = uniqueRefs.size;

  // Explanation: first 2–3 conflict explanation texts concatenated
  const explanationItems = allConflicts
    .filter((c) => c.ruling !== "halal" && c.explanation)
    .slice(0, 3);

  const explanationText = explanationItems
    .map((c) => c.explanation)
    .join(" ");

  const zeroCases = conflictCount === 0 && doubtCount === 0;

  return (
    <Animated.View
      layout={Layout.springify().damping(14).stiffness(170)}
      style={[
        styles.heroCard,
        {
          backgroundColor: statusBg,
          borderColor: statusColor + "33",
        },
      ]}
    >
      {/* Status pill */}
      <View style={[styles.heroPill, { borderColor: statusColor + "66" }]}>
        <View style={[styles.heroStatusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.heroPillText, { color: statusColor }]}>
          {heroTitle}
        </Text>
      </View>

      {/* Explanation text */}
      {explanationText.length > 0 && (
        <Text
          style={[styles.heroExplanation, { color: colors.textSecondary }]}
          numberOfLines={4}
        >
          {explanationText}
        </Text>
      )}

      {/* Counters row */}
      <View style={styles.heroCountersRow}>
        <CounterBadge
          count={conflictCount}
          label={(t.scanResult.schoolConflicts as string).replace("{{count}}", String(conflictCount))}
          color={conflictCount > 0 ? halalStatusTokens.haram.base : colors.textMuted}
          isDark={isDark}
        />
        <CounterBadge
          count={doubtCount}
          label={(t.scanResult.schoolDoubts as string).replace("{{count}}", String(doubtCount))}
          color={doubtCount > 0 ? halalStatusTokens.doubtful.base : colors.textMuted}
          isDark={isDark}
        />
        <CounterBadge
          count={sourceCount}
          label={(t.scanResult.schoolSources as string).replace("{{count}}", String(sourceCount))}
          color={sourceCount > 0 ? (isDark ? gold[400] : gold[700]) : colors.textMuted}
          isDark={isDark}
        />
      </View>

      {/* Zero conflicts edge case */}
      {zeroCases && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.noConflictsRow, { borderColor: halalStatusTokens.halal.base + "44" }]}
        >
          <CheckCircleIcon size={16} color={halalStatusTokens.halal.base} weight="fill" />
          <Text style={[styles.noConflictsText, { color: halalStatusTokens.halal.base }]}>
            {t.scanResult.schoolNoConflicts as string}
          </Text>
        </Animated.View>
      )}

      {/* Conflict list */}
      {!zeroCases && allConflicts.filter((c) => c.ruling !== "halal").length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={styles.conflictList}
        >
          {allConflicts
            .filter((c) => c.ruling !== "halal")
            .map((conflict, index) => (
              <ConflictItem
                key={`${conflict.id}-${index}`}
                conflict={conflict}
                isDark={isDark}
                colors={colors}
                onScholarlySourcePress={onScholarlySourcePress}
              />
            ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── CounterBadge helper ──

function CounterBadge({
  count,
  label,
  color,
  isDark,
}: {
  count: number;
  label: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.counterBadge,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
      ]}
    >
      <Text style={[styles.counterValue, { color }]}>{count}</Text>
      <Text style={[styles.counterLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ── ConflictItem helper ──

function ConflictItem({
  conflict,
  isDark,
  colors,
  onScholarlySourcePress,
}: {
  conflict: {
    id: string;
    label: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  };
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onScholarlySourcePress: (ref: string) => void;
}) {
  const rulingColor = getStatusColor(conflict.ruling);

  return (
    <View
      style={[
        styles.conflictItem,
        {
          borderLeftColor: rulingColor,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
        },
      ]}
    >
      {/* Name + ruling */}
      <View style={styles.conflictHeader}>
        <Text style={[styles.conflictLabel, { color: colors.textPrimary }]} numberOfLines={1}>
          {conflict.label}
        </Text>
        <View style={[styles.conflictRulingBadge, { backgroundColor: rulingColor + "22" }]}>
          <Text style={[styles.conflictRulingText, { color: rulingColor }]}>
            {conflict.ruling}
          </Text>
        </View>
      </View>

      {/* Scholarly reference (pressable) */}
      {conflict.scholarlyReference && (
        <Pressable
          onPress={() => onScholarlySourcePress(conflict.scholarlyReference!)}
          style={styles.conflictSourceRow}
          accessibilityRole="button"
          accessibilityLabel={conflict.scholarlyReference}
        >
          <BookOpenIcon size={12} color={isDark ? gold[400] : gold[700]} />
          <Text
            style={[styles.conflictSourceText, { color: isDark ? gold[400] : gold[700] }]}
            numberOfLines={1}
          >
            {conflict.scholarlyReference}
          </Text>
          <ArrowSquareOutIcon size={12} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      )}
    </View>
  );
}

// ── B. SegmentedBar subcomponent ──

interface SegmentedBarProps {
  madhabVerdicts: MadhabVerdict[];
  activeMadhab: MadhabId;
  onSelect: (madhab: MadhabId) => void;
}

function SegmentedBar({ madhabVerdicts, activeMadhab, onSelect }: SegmentedBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  const otherVerdicts = madhabVerdicts.filter((v) => v.madhab !== activeMadhab);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.segmentedBarContent}
      style={styles.segmentedBar}
    >
      {otherVerdicts.map((verdict) => {
        const statusColor = getStatusColor(verdict.status);
        const madhabLabel = getMadhabLabel(verdict.madhab, t);
        const statusLabel = getStatusLabel(verdict.status, t);

        return (
          <Pressable
            key={verdict.madhab}
            onPress={() => {
              impact();
              onSelect(verdict.madhab);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${madhabLabel}: ${statusLabel}`}
            style={({ pressed }) => [
              styles.segmentPill,
              {
                backgroundColor: isDark
                  ? pressed
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(255,255,255,0.06)"
                  : pressed
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(0,0,0,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            {/* Colored status dot */}
            <View style={[styles.segmentDot, { backgroundColor: statusColor }]} />

            {/* Madhab label */}
            <Text
              style={[styles.segmentMadhabLabel, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {madhabLabel}
            </Text>

            {/* Status label */}
            <Text
              style={[styles.segmentStatusLabel, { color: statusColor }]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── C. AccordionSection generic subcomponent ──

type SectionKey = "ingredients" | "additives" | "certification";

interface AccordionSectionProps {
  sectionKey: SectionKey;
  expandedSection: SectionKey | null;
  onToggle: (key: SectionKey | null) => void;
  icon: React.ReactNode;
  title: string;
  badgeCount?: number;
  children: React.ReactNode;
}

function AccordionSection({
  sectionKey,
  expandedSection,
  onToggle,
  icon,
  title,
  badgeCount,
  children,
}: AccordionSectionProps) {
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const reducedMotion = useReducedMotion();

  const isExpanded = expandedSection === sectionKey;
  const contentHeight = useSharedValue(0);

  const animProgress = useSharedValue(0);

  // Sync animProgress when isExpanded changes
  React.useEffect(() => {
    animProgress.value = reducedMotion
      ? isExpanded ? 1 : 0
      : withTiming(isExpanded ? 1 : 0, { duration: 250 });
  }, [isExpanded, animProgress, reducedMotion]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: contentHeight.value > 0
      ? interpolate(animProgress.value, [0, 1], [0, contentHeight.value])
      : animProgress.value === 0 ? 0 : undefined,
    opacity: animProgress.value,
    overflow: "hidden" as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animProgress.value * 180}deg` }],
  }));

  function handlePress() {
    impact();
    onToggle(isExpanded ? null : sectionKey);
  }

  return (
    <View
      style={[
        styles.accordionContainer,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      {/* Header */}
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isExpanded }}
        style={({ pressed }) => [
          styles.accordionHeader,
          pressed && { opacity: 0.75 },
        ]}
      >
        {/* Icon + title */}
        <View style={styles.accordionHeaderLeft}>
          {icon}
          <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {badgeCount !== undefined && badgeCount > 0 && (
            <View
              style={[
                styles.accordionBadge,
                { backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)" },
              ]}
            >
              <Text style={[styles.accordionBadgeText, { color: colors.textMuted }]}>
                {badgeCount}
              </Text>
            </View>
          )}
        </View>

        {/* Caret */}
        <Animated.View style={chevronStyle}>
          <CaretDownIcon size={16} color={colors.textMuted} weight="bold" />
        </Animated.View>
      </Pressable>

      {/* Animated body */}
      <Animated.View style={animatedContentStyle}>
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && contentHeight.value !== h) {
              contentHeight.value = h;
            }
          }}
          style={styles.accordionBody}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

// ── C1. IngredientsContent ──

function IngredientsContent({
  ingredientRulings,
  isDark,
  colors,
}: {
  ingredientRulings: HalalSchoolsCardProps["ingredientRulings"];
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { t } = useTranslation();

  if (ingredientRulings.length === 0) {
    return (
      <Text style={[styles.accordionEmptyText, { color: colors.textMuted }]}>
        {t.scanResult.ingredientsNone as string}
      </Text>
    );
  }

  return (
    <>
      {ingredientRulings.map((item, index) => {
        const color = getStatusColor(item.ruling);
        const RulingIcon =
          item.ruling === "halal"
            ? CheckCircleIcon
            : item.ruling === "haram"
              ? XCircleIcon
              : WarningIcon;

        return (
          <View
            key={`${item.pattern}-${index}`}
            style={[
              styles.accordionListItem,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <RulingIcon size={14} color={color} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.accordionItemLabel, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.pattern}
              </Text>
              {item.explanation.length > 0 && (
                <Text
                  style={[styles.accordionItemSub, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.explanation}
                </Text>
              )}
            </View>
            <View style={[styles.accordionRulingBadge, { backgroundColor: color + "22" }]}>
              <Text style={[styles.accordionRulingText, { color }]}>
                {item.ruling}
              </Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── C2. AdditivesContent ──

function AdditivesContent({
  conflictingAdditives,
  isDark,
  colors,
}: {
  conflictingAdditives: MadhabVerdict["conflictingAdditives"];
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { t } = useTranslation();

  if (conflictingAdditives.length === 0) {
    return (
      <Text style={[styles.accordionEmptyText, { color: colors.textMuted }]}>
        {t.scanResult.additivesNone as string}
      </Text>
    );
  }

  return (
    <>
      {conflictingAdditives.map((item, index) => {
        const config = STATUS_CONFIG[item.ruling] ?? STATUS_CONFIG.unknown;
        const color = config.color;

        return (
          <View
            key={`${item.code}-${index}`}
            style={[
              styles.accordionListItem,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.accordionAdditiveRow}>
                <Text
                  style={[styles.accordionItemCode, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.code}
                </Text>
                <Text
                  style={[styles.accordionItemLabel, { color: colors.textPrimary, flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              {item.explanation.length > 0 && (
                <Text
                  style={[styles.accordionItemSub, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.explanation}
                </Text>
              )}
            </View>
            <View style={[styles.accordionRulingBadge, { backgroundColor: color + "22" }]}>
              <Text style={[styles.accordionRulingText, { color }]}>
                {item.ruling}
              </Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── C3. CertificationContent ──

function CertificationContent({
  certifierData,
  isDark: _isDark,
  colors,
  t,
}: {
  certifierData: CertifierInfo | null;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (!certifierData) {
    return (
      <Text style={[styles.accordionEmptyText, { color: colors.textMuted }]}>
        {t.scanResult.certificationNone as string}
      </Text>
    );
  }

  const trustLabel = t.scanResult.certifierTrustScore as string;

  return (
    <View style={styles.certificationContent}>
      <CertifierBadge certifier={certifierData} size="extended" />
      <Text style={[styles.certificationTrustDesc, { color: colors.textSecondary }]}>
        {`${trustLabel}: ${certifierData.trustScore}/100`}
      </Text>
    </View>
  );
}

// ── D. ScholarlySourcesRibbon subcomponent ──

interface ScholarlySourcesRibbonProps {
  activeVerdict: MadhabVerdict;
  onScholarlySourcePress: (sourceRef: string) => void;
  isDark: boolean;
}

function ScholarlySourcesRibbon({
  activeVerdict,
  onScholarlySourcePress,
  isDark,
}: ScholarlySourcesRibbonProps) {
  const sources = useMemo(() => {
    const refs = new Set<string>();
    for (const item of [
      ...(activeVerdict.conflictingAdditives ?? []),
      ...(activeVerdict.conflictingIngredients ?? []),
    ]) {
      if (item.scholarlyReference) refs.add(item.scholarlyReference);
    }
    return [...refs];
  }, [activeVerdict]);

  if (sources.length === 0) return null;

  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.ribbonContent}
      style={styles.ribbonScroll}
    >
      {sources.map((ref, index) => {
        const truncated = ref.length > 30 ? `${ref.slice(0, 30)}…` : ref;
        return (
          <Pressable
            key={`${ref}-${index}`}
            onPress={() => onScholarlySourcePress(ref)}
            accessibilityRole="button"
            accessibilityLabel={ref}
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

// ── E. Main HalalSchoolsCard shell ──

export function HalalSchoolsCard({
  madhabVerdicts,
  userMadhab,
  certifierData,
  ingredientRulings,
  onMadhabChange,
  onScholarlySourcePress,
  staggerIndex = 3,
}: HalalSchoolsCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Local state
  const [activeMadhab, setActiveMadhab] = useState<MadhabId>(userMadhab);
  const [expandedSection, setExpandedSection] = useState<
    null | "ingredients" | "additives" | "certification"
  >(null);

  // Find active verdict
  const activeVerdict = madhabVerdicts.find((v) => v.madhab === activeMadhab)
    ?? madhabVerdicts[0];

  if (!activeVerdict) return null;

  function handleMadhabSelect(madhab: MadhabId) {
    setActiveMadhab(madhab);
    onMadhabChange(madhab);
  }

  return (
    <SectionCard
      icon={<MosqueIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.madhabOpinions as string}
      staggerIndex={staggerIndex}
    >
      {/* A. Hero card for active madhab */}
      <HeroCard
        activeVerdict={activeVerdict}
        onScholarlySourcePress={onScholarlySourcePress}
      />

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* B. Segmented bar for other 3 madhabs */}
      {madhabVerdicts.length > 1 && (
        <SegmentedBar
          madhabVerdicts={madhabVerdicts}
          activeMadhab={activeMadhab}
          onSelect={handleMadhabSelect}
        />
      )}

      {/* Divider */}
      <View style={[styles.accordionDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />

      {/* C1. Ingredients accordion */}
      <AccordionSection
        sectionKey="ingredients"
        expandedSection={expandedSection}
        onToggle={setExpandedSection}
        icon={<LeafIcon size={15} color={isDark ? gold[400] : gold[700]} weight="bold" />}
        title={t.scanResult.accordionIngredients as string}
        badgeCount={ingredientRulings.length}
      >
        <IngredientsContent ingredientRulings={ingredientRulings} isDark={isDark} colors={colors} />
      </AccordionSection>

      {/* C2. Additives accordion */}
      <AccordionSection
        sectionKey="additives"
        expandedSection={expandedSection}
        onToggle={setExpandedSection}
        icon={<FlaskIcon size={15} color={isDark ? gold[400] : gold[700]} weight="bold" />}
        title={t.scanResult.accordionAdditives as string}
        badgeCount={activeVerdict.conflictingAdditives?.length ?? 0}
      >
        <AdditivesContent
          conflictingAdditives={activeVerdict.conflictingAdditives ?? []}
          isDark={isDark}
          colors={colors}
        />
      </AccordionSection>

      {/* C3. Certification accordion */}
      <AccordionSection
        sectionKey="certification"
        expandedSection={expandedSection}
        onToggle={setExpandedSection}
        icon={<SealCheckIcon size={15} color={isDark ? gold[400] : gold[700]} weight="bold" />}
        title={t.scanResult.accordionCertification as string}
      >
        <CertificationContent certifierData={certifierData} isDark={isDark} colors={colors} t={t} />
      </AccordionSection>

      {/* D. Scholarly sources ribbon */}
      <ScholarlySourcesRibbon
        activeVerdict={activeVerdict}
        onScholarlySourcePress={onScholarlySourcePress}
        isDark={isDark}
      />
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  // HeroCard
  heroCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroPillText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  heroExplanation: {
    fontSize: fontSizeTokens.bodySmall,
    lineHeight: 20,
  },
  heroCountersRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  counterBadge: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  counterValue: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
  },
  counterLabel: {
    fontSize: fontSizeTokens.micro,
    textAlign: "center",
  },
  noConflictsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noConflictsText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.medium,
  },
  conflictList: {
    gap: spacing.sm,
  },
  conflictItem: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  conflictHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  conflictLabel: {
    flex: 1,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  conflictRulingBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  conflictRulingText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  conflictSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  conflictSourceText: {
    flex: 1,
    fontSize: fontSizeTokens.micro,
  },

  // Spacer between HeroCard and SegmentedBar
  spacer: {
    height: spacing.sm,
  },

  // SegmentedBar
  segmentedBar: {
    marginHorizontal: -spacing.xs,
  },
  segmentedBarContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  segmentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentMadhabLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  segmentStatusLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },

  // Accordion divider
  accordionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  // AccordionSection
  accordionContainer: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  accordionTitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  accordionBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  accordionBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  accordionBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 0,
  },
  accordionEmptyText: {
    fontSize: fontSizeTokens.bodySmall,
    fontStyle: "italic",
    paddingVertical: spacing.xs,
  },
  accordionListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  accordionItemLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  accordionItemSub: {
    fontSize: fontSizeTokens.micro,
    marginTop: 2,
    lineHeight: 16,
  },
  accordionItemCode: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    marginRight: spacing.xs,
  },
  accordionAdditiveRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accordionRulingBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  accordionRulingText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },

  // ScholarlySourcesRibbon
  ribbonScroll: {
    marginTop: spacing.md,
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

  // Certification content
  certificationContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  certificationTrustDesc: {
    fontSize: fontSizeTokens.bodySmall,
  },
});
