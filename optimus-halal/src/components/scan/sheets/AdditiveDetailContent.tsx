/**
 * AdditiveDetailContent — Displays additive details with danger level.
 *
 * Shows code badge, danger level, health effects list, and origin.
 * Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BabyIcon, BabyCarriageIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight, fontFamily } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface HealthEffect {
  type: string;
  label: string;
  potential: boolean;
}

interface Props {
  code: string;
  name: string;
  dangerLevel?: number;
  healthEffects?: HealthEffect[];
  origin?: string;
  /** Rich additive data from detectedAdditives */
  toxicityLevel?: string;
  category?: string;
  healthEffectsFr?: string | null;
  halalRuling?: string | null;
  riskPregnant?: boolean;
  riskChildren?: boolean;
}

// ── Danger config ────────────────────────────────────

const DANGER_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: "#ef4444", label: "Élevé" },
  2: { color: "#f97316", label: "Modéré" },
  3: { color: "#eab308", label: "Limité" },
  4: { color: "#22c55e", label: "Aucun" },
};

const TOXICITY_TO_DANGER: Record<string, number> = {
  high_concern: 1,
  moderate_concern: 2,
  low_concern: 3,
  safe: 4,
};

const HALAL_COLOR: Record<string, string> = {
  haram: "#ef4444",
  doubtful: "#f59e0b",
  halal: "#22c55e",
};

const ORIGIN_LABELS: Record<string, string> = {
  plant: "Végétale",
  animal: "Animale",
  synthetic: "Synthétique",
  mineral: "Minérale",
  insect: "Insecte",
  mixed: "Mixte",
};

const CATEGORY_LABELS: Record<string, string> = {
  colorant: "Colorant",
  preservative: "Conservateur",
  antioxidant: "Antioxydant",
  emulsifier: "Émulsifiant",
  stabilizer: "Stabilisant",
  thickener: "Épaississant",
  flavor_enhancer: "Exhausteur de goût",
  sweetener: "Édulcorant",
  acid: "Acidifiant",
  anti_caking: "Anti-agglomérant",
  glazing_agent: "Agent d'enrobage",
  humectant: "Humectant",
  raising_agent: "Agent levant",
  sequestrant: "Séquestrant",
  other: "Autre",
};

// ── Component ────────────────────────────────────────

export const AdditiveDetailContent = React.memo(function AdditiveDetailContent({
  code,
  name,
  dangerLevel,
  healthEffects,
  origin,
  toxicityLevel,
  category,
  healthEffectsFr,
  halalRuling,
  riskPregnant,
  riskChildren,
}: Props) {
  const { isDark, colors } = useTheme();

  // Resolve danger level: explicit prop > toxicityLevel mapping > default safe
  const resolvedLevel = dangerLevel ?? (toxicityLevel ? TOXICITY_TO_DANGER[toxicityLevel] : undefined) ?? 4;
  const danger = DANGER_CONFIG[resolvedLevel] ?? DANGER_CONFIG[4];
  const halalColor = halalRuling ? (HALAL_COLOR[halalRuling] ?? colors.textMuted) : null;

  return (
    <View style={styles.container}>
      {/* Code badge + name */}
      <View style={styles.headerRow}>
        <View style={[styles.codeBadge, { backgroundColor: `${danger.color}18` }]}>
          <Text style={[styles.codeText, { color: danger.color }]}>{code}</Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>
      </View>

      {/* Category + Origin row */}
      {(category || origin) && (
        <View style={styles.metaRow}>
          {category && (
            <View style={[styles.metaBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {CATEGORY_LABELS[category] ?? category}
              </Text>
            </View>
          )}
          {origin && (
            <View style={[styles.metaBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Origine : {ORIGIN_LABELS[origin] ?? origin}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Halal ruling (if applicable) */}
      {halalColor && halalRuling && (
        <View style={[styles.halalRow, { backgroundColor: `${halalColor}12` }]}>
          <View style={[styles.dangerDot, { backgroundColor: halalColor }]} />
          <Text style={[styles.dangerLabel, { color: halalColor }]}>
            Statut halal : {halalRuling === "haram" ? "Haram" : halalRuling === "doubtful" ? "Douteux" : "Halal"}
          </Text>
        </View>
      )}

      {/* Danger level */}
      <View style={styles.dangerRow}>
        <View style={[styles.dangerDot, { backgroundColor: danger.color }]} />
        <Text style={[styles.dangerLabel, { color: danger.color }]}>
          Risque santé : {danger.label}
        </Text>
      </View>

      {/* Pregnancy / Children warnings */}
      {(riskPregnant || riskChildren) && (
        <View style={styles.warningsSection}>
          {riskPregnant && (
            <View style={[styles.warningBadge, { backgroundColor: "#ef444418" }]}>
              <BabyIcon size={16} color="#ef4444" weight="bold" />
              <Text style={[styles.warningText, { color: "#ef4444" }]}>
                Déconseillé aux femmes enceintes
              </Text>
            </View>
          )}
          {riskChildren && (
            <View style={[styles.warningBadge, { backgroundColor: "#f9731618" }]}>
              <BabyCarriageIcon size={16} color="#f97316" weight="bold" />
              <Text style={[styles.warningText, { color: "#f97316" }]}>
                Attention pour les enfants
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Health effects — rich list or single text */}
      {healthEffects && healthEffects.length > 0 ? (
        <View style={styles.effectsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Effets sur la santé
          </Text>
          {healthEffects.map((effect, i) => (
            <View key={i} style={styles.effectRow}>
              <Text style={[styles.effectDot, { color: colors.textMuted }]}>
                {"\u2022"}
              </Text>
              <Text style={[styles.effectText, { color: colors.textSecondary }]}>
                {effect.label}
                {effect.potential ? " (potentiel)" : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : healthEffectsFr ? (
        <View style={[styles.effectsBox, {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Effets sur la santé
          </Text>
          <Text style={[styles.effectText, { color: colors.textSecondary }]}>
            {healthEffectsFr}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  codeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  codeText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
  name: {
    flex: 1,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semiBold,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dangerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dangerLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  effectsSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  effectRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingLeft: spacing.xs,
  },
  effectDot: {
    fontSize: fontSize.body,
    lineHeight: 21,
  },
  effectText: {
    flex: 1,
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  originBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  originLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  originValue: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  metaText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  halalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  warningsSection: {
    gap: spacing.sm,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  warningText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
    flex: 1,
  },
  effectsBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
});
