/**
 * HalalDetailCard — Halal Analysis Detail Card
 *
 * SectionCard-wrapped component containing all deep halal analysis features:
 * analysis source, why-this-status (collapsible), ingredient composition
 * (collapsible, with problematic highlighting), scholarly references
 * (collapsible), special product banner, and key characteristics grid.
 *
 * Extracted from HalalAnalysisSection so it can be used as a standalone
 * card in the scan-result orchestrator without the community vote /
 * action cards / boycott alert / additives (those live elsewhere).
 *
 * @module components/scan/HalalDetailCard
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import {
  ArrowSquareOutIcon,
  BookOpenIcon,
  CaretDownIcon,
  GavelIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  QuestionIcon,
  SkullIcon,
  SparkleIcon,
} from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import {
  gold,
  glass,
  halalStatus as halalStatusTokens,
  brand as brandTokens,
} from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { durations, easings, entryAnimations } from "@/theme/animations";
import { SectionCard } from "./SectionCard";
import { CriteriaCard } from "./CriteriaCard";

// ── Types ─────────────────────────────────────────────────────

export interface HalalDetailCardProps {
  halalAnalysis: {
    analysisSource?: string;
    reasons: {
      name: string;
      explanation: string;
      status: string;
      type?: string;
      scholarlyReference?: string | null;
      fatwaSourceName?: string | null;
      fatwaSourceUrl?: string | null;
    }[];
  } | null;

  ingredients: string[];

  ingredientRulings: {
    pattern: string;
    ruling: string;
    explanationFr: string;
    scholarlyReference?: string | null;
    fatwaSourceName?: string | null;
    fatwaSourceUrl?: string | null;
  }[];

  specialProduct: {
    type: string;
    typeLabelKey: string;
    bypassNutriScore?: boolean;
    criteria: {
      labelKey: string;
      pass: boolean;
      descriptionKey: string;
      icon: string;
    }[];
  } | null;

  halalStatus: string;
  additiveHealthEffects: Record<string, { type: string; confirmed: boolean }>;
  staggerIndex?: number;
}

// ── CollapsibleSection ────────────────────────────────────────

const CollapsibleSection = React.memo(function CollapsibleSection({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const reducedMotion = useReducedMotion();
  const [contentHeight, setContentHeight] = useState(0);
  const animProgress = useSharedValue(defaultOpen ? 1 : 0);

  const toggle = useCallback(() => {
    impact();
    setIsOpen((prev) => {
      const next = !prev;
      animProgress.value = reducedMotion
        ? next ? 1 : 0
        : withTiming(next ? 1 : 0, {
            duration: durations.normal,
            easing: easings.easeOut,
          });
      return next;
    });
  }, [impact, animProgress, reducedMotion]);

  const contentStyle = useAnimatedStyle(() => ({
    height: contentHeight > 0 ? animProgress.value * contentHeight : undefined,
    opacity: animProgress.value,
    overflow: "hidden" as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animProgress.value * 180}deg` }],
  }));

  return (
    <View
      style={[
        collapsibleStyles.container,
        {
          backgroundColor: isDark ? glass.dark.bg : colors.card,
          borderColor: isDark ? glass.dark.border : glass.light.border,
        },
      ]}
    >
      <PressableScale
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={collapsibleStyles.header}>
          <View style={collapsibleStyles.headerLeft}>
            <Text
              style={[collapsibleStyles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge != null && (
              <Text
                style={[
                  collapsibleStyles.badgeText,
                  { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {badge}
              </Text>
            )}
          </View>
          <Animated.View style={[collapsibleStyles.chevron, chevronStyle]}>
            <CaretDownIcon size={20} color={colors.textMuted} />
          </Animated.View>
        </View>
      </PressableScale>

      <Animated.View style={contentStyle}>
        <View
          style={collapsibleStyles.content}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) setContentHeight(h);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
});

const collapsibleStyles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing["3xl"],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    minHeight: 52,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
  badgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.2,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["2xl"],
  },
});

// ── IngredientRow ─────────────────────────────────────────────

const IngredientRow = React.memo(function IngredientRow({
  name,
  isLast,
  isProblematic,
  problemColor,
  explanation,
  problemStatus,
  scholarlyReference,
  fatwaSourceName,
  fatwaSourceUrl,
}: {
  name: string;
  isLast: boolean;
  isProblematic?: boolean;
  problemColor?: string;
  explanation?: string;
  problemStatus?: string;
  scholarlyReference?: string | null;
  fatwaSourceName?: string | null;
  fatwaSourceUrl?: string | null;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const expandHeight = useSharedValue(0);
  const [detailHeight, setDetailHeight] = useState(0);

  const toggleExpand = useCallback(() => {
    if (!isProblematic || !explanation) return;
    const next = !expanded;
    setExpanded(next);
    expandHeight.value = withTiming(next ? 1 : 0, {
      duration: durations.normal,
      easing: easings.easeOut,
    });
  }, [expanded, isProblematic, explanation, expandHeight]);

  const onDetailLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0 && h !== detailHeight) setDetailHeight(h);
    },
    [detailHeight],
  );

  const detailStyle = useAnimatedStyle(() => ({
    height: detailHeight > 0 ? expandHeight.value * detailHeight : undefined,
    opacity: expandHeight.value,
    overflow: "hidden" as const,
  }));

  const hasFatwa = !!(fatwaSourceName || fatwaSourceUrl);

  const statusLabel =
    problemStatus === "haram"
      ? t.scanResult.ingredientHaram
      : t.scanResult.ingredientDoubtful;

  return (
    <PressableScale
      onPress={toggleExpand}
      disabled={!isProblematic || !explanation}
      accessibilityRole={isProblematic && explanation ? "button" : "text"}
      accessibilityLabel={name}
      accessibilityHint={
        isProblematic && explanation ? t.scanResult.tapForDetail : undefined
      }
      style={[
        ingredientRowStyles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <View style={ingredientRowStyles.nameRow}>
        <View
          style={[
            ingredientRowStyles.dot,
            {
              backgroundColor: isProblematic
                ? (problemColor ?? halalStatusTokens.doubtful.base)
                : isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
            },
          ]}
        />
        <Text
          style={[
            ingredientRowStyles.name,
            {
              color: isProblematic
                ? (problemColor ?? halalStatusTokens.doubtful.base)
                : colors.textPrimary,
              fontWeight: isProblematic ? "600" : "400",
            },
          ]}
        >
          {name}
        </Text>
        {isProblematic && explanation && (
          <CaretDownIcon
            size={18}
            color={problemColor ?? halalStatusTokens.doubtful.base}
            weight="bold"
            style={{
              marginStart: "auto",
              transform: [{ rotate: expanded ? "180deg" : "0deg" }],
            }}
          />
        )}
      </View>

      {isProblematic && explanation && (
        <Animated.View style={[ingredientRowStyles.detailWrap, detailStyle]}>
          <View onLayout={onDetailLayout}>
            <View style={ingredientRowStyles.statusRow}>
              <View
                style={[
                  ingredientRowStyles.statusBadge,
                  {
                    backgroundColor:
                      (problemColor ?? halalStatusTokens.doubtful.base) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    ingredientRowStyles.statusText,
                    {
                      color:
                        problemColor ?? halalStatusTokens.doubtful.base,
                    },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
            <Text
              style={[
                ingredientRowStyles.explanation,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {explanation}
            </Text>
            {scholarlyReference && (
              <View style={ingredientRowStyles.refRow}>
                <BookOpenIcon size={11} color={colors.textMuted} />
                <Text
                  style={[
                    ingredientRowStyles.refText,
                    { color: colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {scholarlyReference}
                </Text>
              </View>
            )}
            {hasFatwa && (
              <PressableScale
                onPress={() => fatwaSourceUrl && Linking.openURL(fatwaSourceUrl)}
                disabled={!fatwaSourceUrl}
                style={ingredientRowStyles.refRow}
                accessibilityRole="link"
                accessibilityLabel={fatwaSourceName ?? t.scanResult.fatwaSource}
              >
                <GavelIcon size={11} color={colors.primary} />
                <Text
                  style={[
                    ingredientRowStyles.refText,
                    {
                      color: fatwaSourceUrl
                        ? colors.primary
                        : colors.textMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {fatwaSourceName ?? t.scanResult.fatwaSource}
                </Text>
                {fatwaSourceUrl && (
                  <ArrowSquareOutIcon size={10} color={colors.primary} />
                )}
              </PressableScale>
            )}
          </View>
        </Animated.View>
      )}
    </PressableScale>
  );
});

const ingredientRowStyles = StyleSheet.create({
  row: {
    paddingVertical: spacing.lg,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: fontSizeTokens.caption,
    flex: 1,
  },
  detailWrap: {
    marginTop: spacing.xs,
    paddingLeft: spacing["2xl"],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
  },
  explanation: {
    fontSize: fontSizeTokens.caption,
    lineHeight: 18,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  refText: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
    flex: 1,
  },
});

// ── Main Component ────────────────────────────────────────────

export function HalalDetailCard({
  halalAnalysis,
  ingredients,
  ingredientRulings,
  specialProduct,
  halalStatus,
  additiveHealthEffects,
  staggerIndex = 0,
}: HalalDetailCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // ── Derived reason lists (haram before doubtful) ──
  const haramReasons = useMemo(
    () =>
      halalAnalysis?.reasons.filter(
        (r) => r.status === "haram" && r.type !== "additive",
      ) ?? [],
    [halalAnalysis?.reasons],
  );
  const doubtfulReasons = useMemo(
    () =>
      halalAnalysis?.reasons.filter(
        (r) => r.status === "doubtful" && r.type !== "additive",
      ) ?? [],
    [halalAnalysis?.reasons],
  );

  // ── Problematic ingredients map ──
  // Build from ingredientRulings (has fatwaSourceUrl) then overlay with reasons
  const problematicIngredients = useMemo(() => {
    const names = new Map<
      string,
      {
        color: string;
        explanation: string;
        status: string;
        scholarlyReference?: string | null;
        fatwaSourceName?: string | null;
        fatwaSourceUrl?: string | null;
      }
    >();

    // Step 1: ingredient rulings (most detail)
    for (const ir of ingredientRulings) {
      if (ir.ruling !== "halal") {
        names.set(ir.pattern.toLowerCase(), {
          color:
            ir.ruling === "haram"
              ? halalStatusTokens.haram.base
              : halalStatusTokens.doubtful.base,
          explanation: ir.explanationFr,
          status: ir.ruling,
          scholarlyReference: ir.scholarlyReference,
          fatwaSourceName: ir.fatwaSourceName,
          fatwaSourceUrl: ir.fatwaSourceUrl,
        });
      }
    }

    // Step 2: overlay haram reasons
    for (const r of haramReasons) {
      const existing = names.get(r.name.toLowerCase());
      names.set(r.name.toLowerCase(), {
        color: halalStatusTokens.haram.base,
        explanation: r.explanation,
        status: r.status,
        scholarlyReference: r.scholarlyReference ?? existing?.scholarlyReference,
        fatwaSourceName: r.fatwaSourceName ?? existing?.fatwaSourceName,
        fatwaSourceUrl: existing?.fatwaSourceUrl,
      });
    }

    // Step 3: overlay doubtful reasons (only if not already present)
    for (const r of doubtfulReasons) {
      if (!names.has(r.name.toLowerCase())) {
        names.set(r.name.toLowerCase(), {
          color: halalStatusTokens.doubtful.base,
          explanation: r.explanation,
          status: r.status,
          scholarlyReference: r.scholarlyReference,
          fatwaSourceName: r.fatwaSourceName,
        });
      }
    }

    return names;
  }, [haramReasons, doubtfulReasons, ingredientRulings]);

  // ── Deduplicated scholarly sources ──
  const scholarlySourcesDeduped = useMemo(() => {
    return [
      ...new Map(
        ingredientRulings
          .filter((r) => r.fatwaSourceName)
          .map((r) => [r.fatwaSourceName, r] as const),
      ).values(),
    ];
  }, [ingredientRulings]);

  const hasWhySection =
    haramReasons.length > 0 || doubtfulReasons.length > 0;

  const hasScholarlySection = scholarlySourcesDeduped.length > 0;

  return (
    <SectionCard
      icon={
        <MagnifyingGlassIcon
          size={16}
          color={isDark ? gold[400] : gold[700]}
          weight="bold"
        />
      }
      title={t.scanResult.halalAnalysisTitle ?? "ANALYSE HALAL DÉTAILLÉE"}
      staggerIndex={staggerIndex}
    >
      {/* 1. Analysis Source */}
      {halalAnalysis?.analysisSource && (
        <Animated.View
          entering={entryAnimations.slideInUp(1)}
          style={localStyles.analysisSourceRow}
        >
          <InfoIcon size={13} color={colors.textMuted} />
          <Text
            style={[localStyles.analysisSourceText, { color: colors.textMuted }]}
          >
            {t.scanResult.analysisSource}: {halalAnalysis.analysisSource}
          </Text>
        </Animated.View>
      )}

      {/* 2. Special Product Banner */}
      {specialProduct && (
        <Animated.View entering={entryAnimations.slideInUp(2)}>
          <View
            style={[
              localStyles.specialProductBanner,
              {
                backgroundColor: isDark
                  ? `${gold[500]}0A`
                  : `${gold[500]}08`,
                borderColor: isDark
                  ? `${gold[500]}25`
                  : `${gold[500]}18`,
              },
            ]}
          >
            <View style={localStyles.specialProductHeader}>
              <SparkleIcon size={18} color={gold[500]} />
              <Text
                style={[
                  localStyles.specialProductTitle,
                  { color: isDark ? gold[300] : gold[700] },
                ]}
              >
                {(t.scanResult[
                  specialProduct.typeLabelKey as keyof typeof t.scanResult
                ] as string) ?? specialProduct.type}
              </Text>
            </View>
            {specialProduct.criteria.map((criterion, idx) => (
              <CriteriaCard
                key={criterion.labelKey}
                title={
                  (t.scanResult[
                    criterion.labelKey as keyof typeof t.scanResult
                  ] as string) ?? criterion.labelKey
                }
                description={
                  (t.scanResult[
                    criterion.descriptionKey as keyof typeof t.scanResult
                  ] as string) ?? criterion.descriptionKey
                }
                pass={criterion.pass}
                icon={criterion.icon}
                index={idx}
              />
            ))}
            {specialProduct.bypassNutriScore && (
              <View style={localStyles.specialProductNote}>
                <InfoIcon size={13} color={colors.textMuted} />
                <Text
                  style={[
                    localStyles.specialProductNoteText,
                    { color: colors.textMuted },
                  ]}
                >
                  {t.scanResult.nutriScoreNotRelevant ??
                    "Le NutriScore n'est pas adapté à ce type de produit"}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* 3. Why This Status (collapsible, defaultOpen) */}
      {halalAnalysis && hasWhySection && (
        <Animated.View entering={entryAnimations.slideInUp(3)}>
          <CollapsibleSection
            title={t.scanResult.whyThisStatus}
            defaultOpen={true}
          >
            {/* Haram reasons first */}
            {haramReasons.map((reason, idx) => (
              <View
                key={`haram-${idx}`}
                style={[
                  localStyles.reasonRow,
                  idx > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? glass.dark.bg
                      : glass.light.border,
                  },
                ]}
              >
                <SkullIcon
                  size={18}
                  color={halalStatusTokens.haram.base}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      localStyles.reasonName,
                      {
                        color: isDark
                          ? "#fca5a5"
                          : halalStatusTokens.haram.base,
                      },
                    ]}
                  >
                    {reason.name}
                  </Text>
                  <Text
                    style={[
                      localStyles.reasonExplanation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {reason.explanation}
                  </Text>
                  {reason.scholarlyReference && (
                    <View style={localStyles.refRow}>
                      <BookOpenIcon size={11} color={colors.textMuted} />
                      <Text
                        style={[
                          localStyles.refText,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {reason.scholarlyReference}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Doubtful reasons after */}
            {doubtfulReasons.map((reason, idx) => (
              <View
                key={`doubtful-${idx}`}
                style={[
                  localStyles.reasonRow,
                  (haramReasons.length > 0 || idx > 0) && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? glass.dark.bg
                      : glass.light.border,
                  },
                ]}
              >
                <QuestionIcon
                  size={18}
                  color={halalStatusTokens.doubtful.base}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      localStyles.reasonName,
                      {
                        color: isDark
                          ? "#fdba74"
                          : halalStatusTokens.doubtful.base,
                      },
                    ]}
                  >
                    {reason.name}
                  </Text>
                  <Text
                    style={[
                      localStyles.reasonExplanation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {reason.explanation}
                  </Text>
                  {reason.scholarlyReference && (
                    <View style={localStyles.refRow}>
                      <BookOpenIcon size={11} color={colors.textMuted} />
                      <Text
                        style={[
                          localStyles.refText,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {reason.scholarlyReference}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </CollapsibleSection>
        </Animated.View>
      )}

      {/* 4. Scholarly References (collapsible) */}
      {hasScholarlySection && (
        <Animated.View entering={entryAnimations.slideInUp(4)}>
          <CollapsibleSection
            title={t.scanResult.scholarlyReferences}
            badge={`${scholarlySourcesDeduped.length} ${t.scanResult.sourceLabel}`}
            defaultOpen={false}
          >
            {scholarlySourcesDeduped.map((ruling, idx) => (
              <View
                key={`ref-${idx}`}
                style={[
                  localStyles.reasonRow,
                  idx > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <BookOpenIcon
                  size={16}
                  color={brandTokens.gold}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      localStyles.reasonName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {ruling.fatwaSourceName}
                  </Text>
                  {ruling.scholarlyReference && (
                    <Text
                      style={[
                        localStyles.reasonExplanation,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={3}
                    >
                      {ruling.scholarlyReference}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </CollapsibleSection>
        </Animated.View>
      )}

      {/* 5. Ingredient Composition (collapsible) */}
      {ingredients.length > 0 && (
        <Animated.View entering={entryAnimations.slideInUp(5)}>
          <CollapsibleSection
            title={t.scanResult.composition}
            badge={`${ingredients.length} ${t.scanResult.ingredients}`}
            defaultOpen={false}
          >
            {ingredients.map((ingredient, index) => {
              const lower = ingredient.toLowerCase();

              // Exact match first
              let problemInfo = problematicIngredients.get(lower);

              // Substring fallback: check if any ruling pattern appears inside ingredient string
              if (!problemInfo) {
                for (const [pattern, info] of problematicIngredients.entries()) {
                  if (lower.includes(pattern)) {
                    problemInfo = info;
                    break;
                  }
                }
              }

              return (
                <IngredientRow
                  key={index}
                  name={ingredient}
                  isLast={index === ingredients.length - 1}
                  isProblematic={!!problemInfo}
                  problemColor={problemInfo?.color}
                  explanation={problemInfo?.explanation}
                  problemStatus={problemInfo?.status}
                  scholarlyReference={problemInfo?.scholarlyReference}
                  fatwaSourceName={problemInfo?.fatwaSourceName}
                  fatwaSourceUrl={problemInfo?.fatwaSourceUrl}
                />
              );
            })}
          </CollapsibleSection>
        </Animated.View>
      )}
    </SectionCard>
  );
}

// ── Styles ────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  // Analysis source line
  analysisSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing["2xl"],
  },
  analysisSourceText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },

  // Special Product Banner
  specialProductBanner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  specialProductHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  specialProductTitle: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
  },
  specialProductNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  specialProductNoteText: {
    fontSize: fontSizeTokens.caption,
    flex: 1,
  },

  // Reason rows (Why This Status + Scholarly References)
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  reasonName: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  reasonExplanation: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 17,
  },

  // Shared ref row (used in reason rows)
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  refText: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
    flex: 1,
  },
});

export default HalalDetailCard;
