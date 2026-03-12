/**
 * AdditivesCard — Additive Analysis with 4-Level Danger Badges
 *
 * Yuka's 4-level danger system enriched with Naqiy's madhab rulings
 * and scholarly references inline.
 *
 * HIGH/MEDIUM: expanded by default. LIMITED/NONE: collapsed.
 * Each additive shows: code + name, category + risk, madhab rulings,
 * health effects, scholarly refs.
 *
 * @module components/scan/AdditivesCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlaskIcon, CaretRightIcon, CaretDownIcon } from "phosphor-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { HealthEffectBadge } from "./HealthEffectBadge";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { ADDITIVE_RISK_LEVELS, type HalalStatusKey } from "./scan-constants";
import type { AdditiveItem } from "./scan-types";

// ── Types ──

export interface AdditivesCardProps {
  additives: AdditiveItem[];
  onPressCard: () => void;
  staggerIndex?: number;
}

// ── Sub-component: AdditiveSubCard ──

function AdditiveSubCard({ additive, index }: { additive: AdditiveItem; index: number }) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Expand high/medium by default
  const [expanded, setExpanded] = useState(additive.dangerLevel <= 2);

  const riskConfig = ADDITIVE_RISK_LEVELS[additive.dangerLevel];
  const riskLabel = (t.scanResult as Record<string, string>)[riskConfig.labelKey] ?? "";
  const dotColor = riskConfig.color;

  const hasMadhabRulings = additive.madhabRulings && Object.keys(additive.madhabRulings).length > 0;
  const hasHealthEffects = additive.healthEffects && additive.healthEffects.length > 0;
  const hasScholarlyRefs = additive.scholarlyRefs && additive.scholarlyRefs.length > 0;
  const hasDetails = hasMadhabRulings || hasHealthEffects || hasScholarlyRefs;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(250)}
    >
      <Pressable
        onPress={() => hasDetails && setExpanded(!expanded)}
        style={[styles.subCard, {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }]}
      >
        {/* Header row */}
        <View style={styles.additiveHeader}>
          <View style={[styles.dangerDot, { backgroundColor: dotColor }]} />
          <View style={styles.additiveInfo}>
            <Text style={[styles.additiveName, { color: colors.textPrimary }]} numberOfLines={1}>
              {additive.code} · {additive.name}
            </Text>
            <Text style={[styles.additiveCategory, { color: colors.textSecondary }]}>
              {additive.category} · <Text style={{ color: dotColor }}>{riskLabel}</Text>
            </Text>
          </View>
          {hasDetails && (
            expanded
              ? <CaretDownIcon size={16} color={colors.textMuted} />
              : <CaretRightIcon size={16} color={colors.textMuted} />
          )}
        </View>

        {/* Expanded details */}
        {expanded && hasDetails && (
          <View style={styles.additiveDetails}>
            {/* Madhab rulings — colored inline text */}
            {hasMadhabRulings && (
              <Text style={[styles.madhabRulings, { color: colors.textMuted }]}>
                {Object.entries(additive.madhabRulings!).map(([madhab, status], idx, arr) => (
                  <Text key={madhab}>
                    <Text style={{ color: colors.textMuted }}>{madhab}: </Text>
                    <Text style={{ color: halalStatusTokens[status as HalalStatusKey]?.base ?? colors.textMuted }}>
                      {(t.scanResult as Record<string, string>)[status] ?? status}
                    </Text>
                    {idx < arr.length - 1 ? " | " : ""}
                  </Text>
                ))}
              </Text>
            )}

            {/* Health effects */}
            {hasHealthEffects && (
              <View style={styles.healthEffects}>
                {additive.healthEffects!.map((effect, idx) => (
                  <HealthEffectBadge
                    key={`${effect.type}-${idx}`}
                    type={effect.type}
                    confirmed={!effect.potential}
                    compact
                  />
                ))}
              </View>
            )}

            {/* Scholarly refs */}
            {hasScholarlyRefs && (
              <View style={styles.scholarlyRefs}>
                {additive.scholarlyRefs!.map((ref, idx) => (
                  <Text
                    key={idx}
                    style={[styles.scholarlyText, { color: isDark ? gold[300] : gold[700] }]}
                  >
                    {ref.source}{ref.detail ? ` — ${ref.detail}` : ""}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Main Component ──

export function AdditivesCard({ additives, onPressCard, staggerIndex = 5 }: AdditivesCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  if (additives.length === 0) return null;

  // Sort by danger level (most dangerous first)
  const sorted = [...additives].sort((a, b) => a.dangerLevel - b.dangerLevel);

  return (
    <SectionCard
      icon={<FlaskIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.additifsDetectes}
      rightElement={
        <Text style={[styles.countBadge, { color: isDark ? gold[400] : gold[700] }]}>
          {additives.length}
        </Text>
      }
      staggerIndex={staggerIndex}
    >
      <View style={styles.additiveList}>
        {sorted.map((additive, idx) => (
          <AdditiveSubCard key={additive.code} additive={additive} index={idx} />
        ))}
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  countBadge: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  additiveList: {
    gap: spacing.md,
  },
  subCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  additiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dangerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  additiveInfo: {
    flex: 1,
    gap: 2,
  },
  additiveName: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  additiveCategory: {
    fontSize: fontSizeTokens.caption,
  },
  additiveDetails: {
    marginTop: spacing.md,
    paddingLeft: 24, // align with content after dot
    gap: spacing.sm,
  },
  madhabRulings: {
    fontSize: fontSizeTokens.micro,
    lineHeight: 16,
  },
  healthEffects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  scholarlyRefs: {
    gap: 4,
  },
  scholarlyText: {
    fontSize: fontSizeTokens.micro,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
