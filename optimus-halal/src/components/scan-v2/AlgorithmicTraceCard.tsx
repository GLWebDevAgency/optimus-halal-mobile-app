/**
 * AlgorithmicTraceCard — Decision flow trace (monospace).
 *
 * Premium-only card showing the algorithmic decision flow
 * for transparency. Displayed in a monospace font with
 * module-by-module trace.
 *
 * @module components/scan-v2/AlgorithmicTraceCard
 */

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/hooks";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { TreeStructure, CaretDown, CaretUp } from "phosphor-react-native";
import type { AlgorithmicTraceStep } from "./scan-v2-types";
import { NaqiyPlusUpsell } from "./NaqiyPlusUpsell";

const MONO_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

interface AlgorithmicTraceCardProps {
  steps: AlgorithmicTraceStep[];
  engineVersion: string;
}

export const AlgorithmicTraceCard: React.FC<AlgorithmicTraceCardProps> = ({
  steps,
  engineVersion,
}) => {
  const { isDark, colors } = useTheme();
  const { isPremium } = usePremium();
  const [expanded, setExpanded] = useState(false);

  if (!isPremium) {
    return (
      <NaqiyPlusUpsell
        featureLabel="Trace algorithmique"
        description="Visualisez le parcours de decision de l'analyse halal."
      />
    );
  }

  const CaretIcon = expanded ? CaretUp : CaretDown;

  return (
    <Animated.View
      entering={FadeInUp.delay(360).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.card : colors.card },
        ]}
      >
        {/* Header */}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          accessibilityLabel={`Trace algorithmique. ${expanded ? "Replier" : "Developper"}`}
          accessibilityRole="button"
          style={styles.header}
        >
          <TreeStructure size={20} color={colors.primary} weight="fill" />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Trace algorithmique
          </Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            v{engineVersion}
          </Text>
          <CaretIcon size={16} color={colors.textMuted} />
        </Pressable>

        {/* Trace Steps */}
        {expanded && (
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View
                key={`${step.module}-${index}`}
                style={[
                  styles.step,
                  {
                    backgroundColor: isDark
                      ? colors.backgroundSecondary
                      : colors.background,
                  },
                ]}
              >
                <View style={styles.stepHeader}>
                  <Text style={[styles.moduleLabel, { color: colors.primary }]}>
                    {step.module}
                  </Text>
                  <Text style={[styles.duration, { color: colors.textMuted }]}>
                    {step.durationMs}ms
                  </Text>
                </View>
                <Text style={[styles.traceText, { color: colors.textSecondary }]}>
                  in: {step.input}
                </Text>
                <Text style={[styles.traceText, { color: colors.textSecondary }]}>
                  out: {step.output}
                </Text>
                <Text style={[styles.decisionText, { color: colors.textPrimary }]}>
                  {step.decision}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing["3xl"],
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  version: {
    fontFamily: MONO_FONT,
    fontSize: 10,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  step: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  moduleLabel: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: "700",
  },
  duration: {
    fontFamily: MONO_FONT,
    fontSize: 10,
  },
  traceText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    lineHeight: 16,
  },
  decisionText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});

export default AlgorithmicTraceCard;
