/**
 * HalalAnalysisSection — All Tab 0 (Halal) content extracted from scan-result.tsx.
 *
 * Contains: Boycott alert, analysis source, special product banner,
 * key characteristics (halal mode), why-this-status, community vote,
 * community actions, additives, scholarly references, ingredients,
 * and new-product banner.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Platform, Linking } from "react-native";
import { ArrowSquareOutIcon, BookOpenIcon, CaretDownIcon, GavelIcon, InfoIcon, MegaphoneIcon, ProhibitIcon, QuestionIcon, ShieldCheckIcon, SkullIcon, SparkleIcon, ThumbsDownIcon, ThumbsUpIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { PressableScale } from "@/components/ui/PressableScale";
import { GlowCard } from "@/components/ui/GlowCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { halalStatus as halalStatusTokens, brand as brandTokens, glass, lightTheme, semantic, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { durations, easings, entryAnimations } from "@/theme/animations";
import { CriteriaCard } from "@/components/scan/CriteriaCard";
import { HealthEffectBadge } from "@/components/scan/HealthEffectBadge";
import { HalalActionCard } from "@/components/scan/HalalActionCard";
import { KeyCharacteristicsGrid } from "@/components/scan/KeyCharacteristicsGrid";
import type { HealthEffectType } from "@/services/api/types";

// ── Types ─────────────────────────────────────────────────────

export interface HalalAnalysisSectionProps {
  // Boycott
  boycott: {
    isBoycotted: boolean;
    targets: Array<{
      id?: string;
      companyName: string;
      boycottLevel?: string;
      reasonSummary?: string;
      sourceUrl?: string;
      sourceName?: string;
    }>;
  } | null;

  // Analysis
  halalAnalysis: {
    analysisSource?: string;
    reasons: Array<{
      name: string;
      explanation: string;
      status: string;
      type?: string;
      scholarlyReference?: string | null;
      fatwaSourceName?: string | null;
      fatwaSourceUrl?: string | null;
    }>;
  } | null;

  // Special product
  specialProduct: {
    type: string;
    typeLabelKey: string;
    bypassNutriScore?: boolean;
    criteria: Array<{
      labelKey: string;
      pass: boolean;
      descriptionKey: string;
      icon: string;
    }>;
  } | null;

  // Dietary & OFF data
  dietaryAnalysis: any;
  offExtras: {
    labelsTags?: string[] | null;
    ingredientsAnalysisTags?: string[] | null;
    origins?: string | null;
    manufacturingPlaces?: string | null;
  } | null;

  // Ingredient rulings
  ingredientRulings: Array<{
    pattern: string;
    ruling: string;
    explanationFr: string;
    scholarlyReference?: string | null;
    fatwaSourceName?: string | null;
    fatwaSourceUrl?: string | null;
  }>;

  // Ingredients
  ingredients: string[];

  // Additive health effects
  additiveHealthEffects: Record<string, { type: string; confirmed: boolean }>;

  // Community vote
  product: { id: string; name: string; barcode: string } | null;
  halalStatus: string;

  // New product
  isNewProduct: boolean;

  // Callbacks
  onVote: (vote: "up" | "down" | null) => void;
  userVote: "up" | "down" | null;
}

// ── CollapsibleSection (local copy) ───────────────────────────

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
        : withTiming(next ? 1 : 0, { duration: durations.normal, easing: easings.easeOut });
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
        localStyles.collapsibleContainer,
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
        <View style={localStyles.collapsibleHeader}>
          <View style={localStyles.collapsibleHeaderLeft}>
            <Text
              style={[localStyles.collapsibleTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge && (
              <Text
                style={[
                  localStyles.collapsibleBadgeText,
                  { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {badge}
              </Text>
            )}
          </View>
          <Animated.View style={[localStyles.collapsibleChevron, chevronStyle]}>
            <CaretDownIcon size={20}
              color={colors.textMuted} />
          </Animated.View>
        </View>
      </PressableScale>
      <Animated.View style={contentStyle}>
        <View
          style={localStyles.collapsibleContent}
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

// ── IngredientRow (local copy) ────────────────────────────────

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

  const toggleExpand = useCallback(() => {
    if (!isProblematic || !explanation) return;
    const next = !expanded;
    setExpanded(next);
    expandHeight.value = withTiming(next ? 1 : 0, {
      duration: durations.normal,
      easing: easings.easeOut,
    });
  }, [expanded, isProblematic, explanation, expandHeight]);

  const hasFatwa = !!(fatwaSourceName || fatwaSourceUrl);
  const [detailHeight, setDetailHeight] = useState(0);
  const onDetailLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== detailHeight) setDetailHeight(h);
  }, [detailHeight]);
  const detailStyle = useAnimatedStyle(() => ({
    height: detailHeight > 0 ? expandHeight.value * detailHeight : undefined,
    opacity: expandHeight.value,
    overflow: "hidden" as const,
  }));

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
      accessibilityHint={isProblematic && explanation ? t.scanResult.tapForDetail : undefined}
      style={[
        localStyles.ingredientRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <View style={ingredientStyles.nameRow}>
        <View
          style={[
            localStyles.ingredientDot,
            {
              backgroundColor: isProblematic
                ? problemColor ?? halalStatusTokens.doubtful.base
                : isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
            },
          ]}
        />
        <Text
          style={[
            localStyles.ingredientName,
            {
              color: isProblematic
                ? problemColor ?? halalStatusTokens.doubtful.base
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
            style={{ marginStart: "auto", transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          />
        )}
      </View>

      {/* Expandable detail */}
      {isProblematic && explanation && (
        <Animated.View style={[ingredientStyles.detailWrap, detailStyle]}>
          <View onLayout={onDetailLayout}>
            <View style={ingredientStyles.statusRow}>
              <View
                style={[ingredientStyles.statusBadge, { backgroundColor: (problemColor ?? halalStatusTokens.doubtful.base) + "20" }]}
              >
                <Text
                  style={[ingredientStyles.statusText, { color: problemColor ?? halalStatusTokens.doubtful.base }]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
            <Text
              style={[ingredientStyles.explanation, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {explanation}
            </Text>
            {scholarlyReference && (
              <View style={ingredientStyles.refRow}>
                <BookOpenIcon size={11} color={colors.textMuted} />
                <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
                  {scholarlyReference}
                </Text>
              </View>
            )}
            {hasFatwa && (
              <PressableScale
                onPress={() => fatwaSourceUrl && Linking.openURL(fatwaSourceUrl)}
                disabled={!fatwaSourceUrl}
                style={ingredientStyles.refRow}
              >
                <GavelIcon size={11} color={colors.primary} />
                <Text
                  style={[
                    ingredientStyles.refText,
                    { color: fatwaSourceUrl ? colors.primary : colors.textMuted },
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

const ingredientStyles = StyleSheet.create({
  nameRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.md },
  detailWrap: { marginTop: spacing.xs, paddingLeft: spacing["2xl"] },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statusText: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.bold, textTransform: "uppercase" },
  explanation: { fontSize: fontSizeTokens.caption, lineHeight: 18 },
  refRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  refText: { fontSize: fontSizeTokens.micro, fontStyle: "italic", flex: 1 },
});

// ── Main Component ────────────────────────────────────────────

export function HalalAnalysisSection({
  boycott,
  halalAnalysis,
  specialProduct,
  dietaryAnalysis,
  offExtras,
  ingredientRulings,
  ingredients,
  additiveHealthEffects,
  product,
  halalStatus,
  isNewProduct,
  onVote,
  userVote,
}: HalalAnalysisSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  // ── Derived reason lists ──
  const haramReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.status === "haram") ?? [],
    [halalAnalysis?.reasons]
  );
  const doubtfulReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.status === "doubtful") ?? [],
    [halalAnalysis?.reasons]
  );
  const additiveReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.type === "additive") ?? [],
    [halalAnalysis?.reasons]
  );

  // ── Problematic ingredients map ──
  const problematicIngredients = useMemo(() => {
    const names = new Map<string, {
      color: string;
      explanation: string;
      status: string;
      scholarlyReference?: string | null;
      fatwaSourceName?: string | null;
      fatwaSourceUrl?: string | null;
    }>();
    // Build from ingredient rulings first (has fatwaSourceUrl)
    for (const ir of ingredientRulings) {
      if (ir.ruling !== "halal") {
        names.set(ir.pattern.toLowerCase(), {
          color: ir.ruling === "haram" ? halalStatusTokens.haram.base : halalStatusTokens.doubtful.base,
          explanation: ir.explanationFr,
          status: ir.ruling,
          scholarlyReference: ir.scholarlyReference,
          fatwaSourceName: ir.fatwaSourceName,
          fatwaSourceUrl: ir.fatwaSourceUrl,
        });
      }
    }
    // Overlay with haram/doubtful reasons (may have more details)
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

  return (
    <>
      {/* 1. Boycott Alert */}
      {boycott?.isBoycotted && (
        <Animated.View entering={entryAnimations.slideInUp(2)}>
          <GlowCard
            glowColor={halalStatusTokens.haram.base}
            glowIntensity="medium"
            style={localStyles.boycottCard}
          >
            <View style={localStyles.boycottHeader}>
              <View
                style={[
                  localStyles.boycottIconCircle,
                  {
                    backgroundColor: isDark
                      ? halalStatusTokens.haram.bgDark
                      : halalStatusTokens.haram.bg,
                  },
                ]}
              >
                <ProhibitIcon size={20} color={halalStatusTokens.haram.base} />
              </View>
              <Text
                style={[
                  localStyles.boycottTitle,
                  { color: isDark ? "#fca5a5" : lightTheme.statusMauvais },
                ]}
              >
                {t.scanResult.boycottActive}
              </Text>
            </View>
            {boycott.targets.map((target, idx) => (
              <View
                key={target.id ?? idx}
                style={[
                  localStyles.boycottTarget,
                  idx > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? halalStatusTokens.haram.bgDark
                      : halalStatusTokens.haram.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    localStyles.boycottCompany,
                    { color: isDark ? "#fca5a5" : lightTheme.statusMauvais },
                  ]}
                >
                  {target.companyName}
                  {target.boycottLevel === "official_bds"
                    ? ` ${t.scanResult.bdsOfficial}`
                    : ""}
                </Text>
                <Text
                  style={[
                    localStyles.boycottReason,
                    { color: isDark ? "#fca5a5cc" : `${lightTheme.statusMauvais}cc` },
                  ]}
                >
                  {target.reasonSummary ?? target.companyName}
                </Text>
                {target.sourceUrl && (
                  <Text
                    style={[
                      localStyles.boycottSource,
                      { color: `${halalStatusTokens.haram.base}aa` },
                    ]}
                  >
                    {t.scanResult.source}: {target.sourceName ?? "BDS"}
                  </Text>
                )}
              </View>
            ))}
          </GlowCard>
        </Animated.View>
      )}

      {/* 2. Analysis Source */}
      {halalAnalysis?.analysisSource && (
        <Animated.View
          entering={entryAnimations.slideInUp(3)}
          style={localStyles.analysisSourceRow}
        >
          <InfoIcon size={13} color={colors.textMuted} />
          <Text style={[localStyles.analysisSourceText, { color: colors.textMuted }]}>
            {t.scanResult.source}: {halalAnalysis.analysisSource}
          </Text>
        </Animated.View>
      )}

      {/* 3. Special Product Banner */}
      {specialProduct && (
        <Animated.View entering={entryAnimations.slideInUp(3)}>
          <View
            style={[
              localStyles.specialProductBanner,
              {
                backgroundColor: isDark ? `${gold[500]}0A` : `${gold[500]}08`,
                borderColor: isDark ? `${gold[500]}25` : `${gold[500]}18`,
              },
            ]}
          >
            <View style={localStyles.specialProductHeader}>
              <SparkleIcon size={18} color={gold[500]} />
              <Text style={[localStyles.specialProductTitle, { color: isDark ? gold[300] : gold[700] }]}>
                {t.scanResult[specialProduct.typeLabelKey as keyof typeof t.scanResult] ?? specialProduct.type}
              </Text>
            </View>
            {specialProduct.criteria.map((criterion, idx) => (
              <CriteriaCard
                key={criterion.labelKey}
                title={t.scanResult[criterion.labelKey as keyof typeof t.scanResult] ?? criterion.labelKey}
                description={t.scanResult[criterion.descriptionKey as keyof typeof t.scanResult] ?? criterion.descriptionKey}
                pass={criterion.pass}
                icon={criterion.icon}
                index={idx}
              />
            ))}
            {specialProduct.bypassNutriScore && (
              <View style={localStyles.specialProductNote}>
                <InfoIcon size={13} color={colors.textMuted} />
                <Text style={[localStyles.specialProductNoteText, { color: colors.textMuted }]}>
                  {t.scanResult.nutriScoreNotRelevant ?? "Le NutriScore n'est pas adapt\u00e9 \u00e0 ce type de produit"}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* 4. Key Characteristics Grid (halal mode) */}
      <KeyCharacteristicsGrid
        dietaryAnalysis={dietaryAnalysis}
        labelsTags={offExtras?.labelsTags ?? null}
        ingredientsAnalysisTags={offExtras?.ingredientsAnalysisTags ?? null}
        nutriscoreGrade={null}
        origins={offExtras?.origins ?? null}
        manufacturingPlaces={offExtras?.manufacturingPlaces ?? null}
        additivesTags={null}
        mode="halal"
      />

      {/* 5. Why This Status */}
      {halalAnalysis &&
        (haramReasons.length > 0 || doubtfulReasons.length > 0) && (
          <Animated.View entering={entryAnimations.slideInUp(4)}>
            <CollapsibleSection
              title={t.scanResult.whyThisStatus}
              defaultOpen={true}
            >
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
                  <SkullIcon size={18}
                    color={halalStatusTokens.haram.base}
                    style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        localStyles.reasonName,
                        { color: isDark ? "#fca5a5" : halalStatusTokens.haram.base },
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
                      <View style={ingredientStyles.refRow}>
                        <BookOpenIcon size={11} color={colors.textMuted} />
                        <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
                          {reason.scholarlyReference}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
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
                  <QuestionIcon size={18}
                    color={halalStatusTokens.doubtful.base}
                    style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        localStyles.reasonName,
                        { color: isDark ? "#fdba74" : halalStatusTokens.doubtful.base },
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
                      <View style={ingredientStyles.refRow}>
                        <BookOpenIcon size={11} color={colors.textMuted} />
                        <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
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

      {/* 6. Community Vote */}
      {product && (
        <Animated.View entering={entryAnimations.slideInUp(5)}>
          <GlowCard
            glowColor={brandTokens.gold}
            glowIntensity="subtle"
            style={localStyles.voteCard}
          >
            <View
              style={[localStyles.voteShieldIcon, { backgroundColor: isDark ? glass.dark.border : glass.dark.highlight }]}
            >
              <ShieldCheckIcon size={18} color={brandTokens.gold} />
            </View>
            <Text style={[localStyles.voteTitle, { color: colors.textPrimary }]}>
              {t.scanResult.yourOpinionMatters}
            </Text>
            <Text style={[localStyles.voteSubtitle, { color: colors.textSecondary }]}>
              {t.scanResult.isThisResultAccurate}
            </Text>
            <View style={localStyles.voteButtonRow}>
              <PressableScale
                onPress={() => {
                  impact();
                  const newVote = userVote === "up" ? null : "up";
                  onVote(newVote);
                }}
                style={[
                  localStyles.voteButton,
                  {
                    backgroundColor: userVote === "up"
                      ? (isDark ? halalStatusTokens.halal.bgDark : halalStatusTokens.halal.bg)
                      : (isDark ? glass.dark.bg : glass.light.border),
                    borderWidth: userVote === "up" ? 2 : 1,
                    borderColor: userVote === "up" ? colors.primary : isDark ? glass.dark.borderStrong : glass.light.borderStrong,
                    ...(userVote === "up" ? {
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 4,
                    } : {}),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.accurateResult}
              >
                <ThumbsUpIcon size={24} color={userVote === "up" ? colors.primary : colors.textSecondary} />
              </PressableScale>
              <PressableScale
                onPress={() => {
                  impact();
                  const newVote = userVote === "down" ? null : "down";
                  onVote(newVote);
                }}
                style={[
                  localStyles.voteButton,
                  {
                    backgroundColor: userVote === "down"
                      ? (isDark ? halalStatusTokens.haram.bgDark : halalStatusTokens.haram.bg)
                      : (isDark ? glass.dark.bg : glass.light.border),
                    borderWidth: userVote === "down" ? 2 : 1,
                    borderColor: userVote === "down" ? halalStatusTokens.haram.base : isDark ? glass.dark.borderStrong : glass.light.borderStrong,
                    ...(userVote === "down" ? {
                      shadowColor: halalStatusTokens.haram.base,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 4,
                    } : {}),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.inaccurateResult}
              >
                <ThumbsDownIcon size={24} color={userVote === "down" ? halalStatusTokens.haram.base : colors.textSecondary} />
              </PressableScale>
            </View>
            {userVote && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text style={localStyles.voteThanks}>
                  {t.scanResult.thankYouForFeedback}
                </Text>
              </Animated.View>
            )}
          </GlowCard>
        </Animated.View>
      )}

      {/* 7. Community Actions */}
      {product && (
        <Animated.View entering={entryAnimations.slideInUp(6)}>
          {halalStatus === "doubtful" && (
            <HalalActionCard
              type="report"
              productName={product.name}
              productBarcode={product.barcode}
              reportLabel={t.scanResult.reportProduct}
              reportDesc={t.scanResult.reportProductDesc}
            />
          )}
          {halalStatus === "halal" && (
            <HalalActionCard
              type="share"
              productName={product.name}
              productBarcode={product.barcode}
              shareLabel={t.scanResult.shareAnalysis}
              shareDesc={t.scanResult.shareAnalysisDesc}
              shareTagline={t.scanResult.shareTagline}
            />
          )}
          {halalStatus === "unknown" && (
            <HalalActionCard
              type="request_certification"
              productName={product.name}
              productBarcode={product.barcode}
              certifyLabel={t.scanResult.unknownStatusReport}
              certifyDesc={t.scanResult.unknownStatusReportDesc}
            />
          )}
        </Animated.View>
      )}

      {/* 8. Additives */}
      {additiveReasons.length > 0 && (
        <Animated.View entering={entryAnimations.slideInUp(5)}>
          <CollapsibleSection
            title={t.scanResult.additivesDetected}
            badge={`${additiveReasons.length} ${t.scanResult.additive}${additiveReasons.length > 1 ? "s" : ""}`}
            defaultOpen={false}
          >
            {additiveReasons.map((additive, idx) => (
              <View
                key={`add-${idx}`}
                style={[
                  localStyles.additiveRow,
                  idx > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <View
                  style={[
                    localStyles.additiveDot,
                    {
                      backgroundColor:
                        halalStatusTokens[additive.status as keyof typeof halalStatusTokens]?.base ?? halalStatusTokens.halal.base,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      localStyles.additiveName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {additive.name}
                  </Text>
                  <Text
                    style={[
                      localStyles.additiveExplanation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {additive.explanation}
                  </Text>
                  {/* Health effect badge */}
                  {(() => {
                    const code = additive.name.split(" ")[0];
                    const effect = additiveHealthEffects[code];
                    if (!effect) return null;
                    return (
                      <View style={{ marginTop: spacing.xs }}>
                        <HealthEffectBadge
                          type={effect.type as HealthEffectType}
                          confirmed={effect.confirmed}
                          compact
                        />
                      </View>
                    );
                  })()}
                </View>
                <Text
                  style={[
                    localStyles.additiveStatus,
                    {
                      color:
                        halalStatusTokens[additive.status as keyof typeof halalStatusTokens]?.base ?? halalStatusTokens.halal.base,
                    },
                  ]}
                >
                  {additive.status === "haram"
                    ? t.scanResult.haram
                    : additive.status === "doubtful"
                      ? t.scanResult.doubtful
                      : t.scanResult.halal}
                </Text>
              </View>
            ))}
          </CollapsibleSection>
        </Animated.View>
      )}

      {/* 9. Scholarly References */}
      {ingredientRulings.length > 0 &&
        ingredientRulings.some((r) => r.fatwaSourceName) && (
          <Animated.View entering={entryAnimations.slideInUp(6)}>
            <CollapsibleSection
              title={t.scanResult.scholarlyReferences}
              badge={`${new Set(ingredientRulings.filter((r) => r.fatwaSourceName).map((r) => r.fatwaSourceName)).size} ${t.scanResult.sourceLabel}`}
              defaultOpen={false}
            >
              {[...new Map(
                ingredientRulings
                  .filter((r) => r.fatwaSourceName)
                  .map((r) => [r.fatwaSourceName, r] as const)
              ).values()].map((ruling, idx) => (
                <View
                  key={`ref-${idx}`}
                  style={[
                    localStyles.reasonRow,
                    idx > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <BookOpenIcon size={16} color={brandTokens.gold} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[localStyles.reasonName, { color: colors.textPrimary }]}>
                      {ruling.fatwaSourceName}
                    </Text>
                    {ruling.scholarlyReference && (
                      <Text style={[localStyles.reasonExplanation, { color: colors.textSecondary }]} numberOfLines={3}>
                        {ruling.scholarlyReference}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </CollapsibleSection>
          </Animated.View>
        )}

      {/* 10. Ingredients */}
      {ingredients.length > 0 && (
        <Animated.View entering={entryAnimations.slideInUp(7)}>
          <CollapsibleSection
            title={t.scanResult.composition}
            badge={`${ingredients.length} ${t.scanResult.ingredients}`}
            defaultOpen={false}
          >
            {ingredients.map((ingredient, index) => {
              const lower = ingredient.toLowerCase();
              // Direct match on ingredient name
              let problemInfo = problematicIngredients.get(lower);
              // Fallback: check if any ruling pattern matches inside this ingredient
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

      {/* 11. New Product Banner */}
      {isNewProduct && (
        <Animated.View entering={entryAnimations.slideInUp(9)}>
          <View
            style={[
              localStyles.newProductBanner,
              {
                backgroundColor: isDark
                  ? glass.dark.highlight
                  : glass.light.bg,
                borderColor: isDark
                  ? glass.dark.border
                  : `${brandTokens.gold}26`,
              },
            ]}
          >
            <MegaphoneIcon size={20}
              color={brandTokens.gold}
              style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text
                style={[localStyles.newProductTitle, { color: isDark ? brandTokens.gold : colors.textSecondary }]}
              >
                {t.scanResult.newProductAdded}
              </Text>
              <Text
                style={[localStyles.newProductDesc, { color: isDark ? colors.textSecondary : colors.textMuted }]}
              >
                {t.scanResult.newProductAddedDesc}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  // Boycott card (wrapped in GlowCard)
  boycottCard: {
    borderLeftWidth: 4,
    borderLeftColor: halalStatusTokens.haram.base,
    marginBottom: spacing["3xl"],
  },
  boycottHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  boycottIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  boycottTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.black,
  },
  boycottTarget: {
    paddingVertical: spacing.md,
  },
  boycottCompany: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  boycottReason: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 17,
  },
  boycottSource: {
    fontSize: fontSizeTokens.micro,
    marginTop: spacing.xs,
  },

  // Analysis source (compact line)
  analysisSourceRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
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
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  specialProductTitle: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
  },
  specialProductNote: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
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

  // Collapsible
  collapsibleContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing["3xl"],
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    minHeight: 52,
    gap: spacing.md,
  },
  collapsibleHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  collapsibleTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
  collapsibleBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.2,
  },
  collapsibleChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsibleContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["2xl"],
  },

  // Reason rows
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

  // Additive rows
  additiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  additiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  additiveName: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  additiveExplanation: {
    fontSize: fontSizeTokens.micro,
    marginTop: 1,
  },
  additiveStatus: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.black,
    textTransform: "uppercase",
  },

  // Ingredient row
  ingredientRow: {
    paddingVertical: spacing.lg,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientName: {
    fontSize: fontSizeTokens.caption,
    flex: 1,
  },

  // Vote card (wrapped in GlowCard)
  voteCard: {
    marginBottom: spacing["3xl"],
    alignItems: "center" as const,
    gap: spacing.lg,
  },
  voteShieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: spacing["2xs"],
  },
  voteTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.black,
    letterSpacing: 0.3,
  },
  voteSubtitle: {
    fontSize: fontSizeTokens.caption,
    textAlign: "center" as const,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  voteButtonRow: {
    flexDirection: "row" as const,
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  voteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  voteThanks: {
    fontSize: fontSizeTokens.caption,
    color: brandTokens.gold,
    fontWeight: fontWeightTokens.bold,
    marginTop: spacing["2xs"],
  },

  // New product banner
  newProductBanner: {
    flexDirection: "row",
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  newProductTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
  newProductDesc: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 18,
  },
});
