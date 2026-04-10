/**
 * CertifierDetailSheet — Bottom sheet for certifier full profile.
 *
 * Shows certifier profile, trust scores per madhab, complete
 * practice list, and "Signaler un manquement" button.
 *
 * @module components/scan-v2/CertifierDetailSheet
 */

import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus, gold } from "@/theme/colors";
import {
  X,
  Globe,
  Calendar,
  ShieldCheck,
  Flag,
} from "phosphor-react-native";
import type {
  CertifierInfoV2,
  CertifierTrustScores,
  CertifierPractice,
  MadhabId,
} from "./scan-v2-types";
import { getTrustGrade, formatTrustGrade, getVerdictColor, verdictToLevel } from "./scan-v2-utils";
import { TrustGradeBadge } from "./TrustGradeBadge";
import { PracticeSignalRow } from "./PracticeSignalRow";

interface CertifierDetailSheetProps {
  certifier: CertifierInfoV2 | null;
  trustScores: CertifierTrustScores | null;
  practices: CertifierPractice[];
  isOpen: boolean;
  onClose: () => void;
  onReportPress?: () => void;
}

const MADHAB_KEYS: { key: keyof CertifierTrustScores; label: string }[] = [
  { key: "trustScoreHanafi", label: "Hanafi" },
  { key: "trustScoreShafii", label: "Shafi'i" },
  { key: "trustScoreMaliki", label: "Maliki" },
  { key: "trustScoreHanbali", label: "Hanbali" },
];

export const CertifierDetailSheet: React.FC<CertifierDetailSheetProps> = ({
  certifier,
  trustScores,
  practices,
  isOpen,
  onClose,
  onReportPress,
}) => {
  const { isDark, colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["75%", "95%"], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  if (!certifier || !trustScores) return null;

  const overallGrade = getTrustGrade(trustScores.trustScore);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: isDark ? colors.card : colors.card,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.textMuted,
        width: 40,
      }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: isDark ? colors.backgroundSecondary : colors.background }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>
              {(certifier.shortName || certifier.name).slice(0, 4).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.certifierName, { color: colors.textPrimary }]}>
              {certifier.name}
            </Text>
            <View style={styles.headerMeta}>
              {certifier.creationYear && (
                <View style={styles.metaItem}>
                  <Calendar size={12} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    Depuis {certifier.creationYear}
                  </Text>
                </View>
              )}
              {certifier.website && (
                <Pressable
                  onPress={() => Linking.openURL(certifier.website!)}
                  style={styles.metaItem}
                  accessibilityLabel="Visiter le site web"
                  accessibilityRole="link"
                >
                  <Globe size={12} color={colors.primary} />
                  <Text style={[styles.metaLink, { color: colors.primary }]}>
                    Site web
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Overall Trust Grade */}
        <View style={styles.overallSection}>
          <View style={styles.overallRow}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              NOTE GLOBALE
            </Text>
            <TrustGradeBadge score={trustScores.trustScore} showLabel />
          </View>
          <Text style={[styles.overallScore, { color: overallGrade.color }]}>
            Trust Score: {trustScores.trustScore}/100
          </Text>
        </View>

        {/* Trust Scores per Madhab — Horizontal Bars */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            SCORES PAR MADHAB
          </Text>
          <View style={styles.barsContainer}>
            {MADHAB_KEYS.map(({ key, label }) => {
              const score = trustScores[key];
              if (score === undefined) return null;
              const barColor = getTrustGrade(score as number).color;

              return (
                <View key={key} style={styles.barRow}>
                  <Text
                    style={[styles.barLabel, { color: colors.textSecondary }]}
                  >
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.barTrack,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: barColor,
                          width: `${Math.min(score as number, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.barScore, { color: colors.textSecondary }]}
                  >
                    {score as number}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Practices */}
        {practices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              PRATIQUES
            </Text>
            <View style={styles.practicesList}>
              {practices.map((practice) => (
                <PracticeSignalRow key={practice.id} practice={practice} />
              ))}
            </View>
          </View>
        )}

        {/* Report Button */}
        {onReportPress && (
          <Pressable
            onPress={onReportPress}
            accessibilityLabel="Signaler un manquement"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.reportButton,
              {
                backgroundColor: isDark
                  ? `${halalStatus.haram.base}15`
                  : `${halalStatus.haram.base}08`,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Flag size={18} color={halalStatus.haram.base} weight="fill" />
            <Text
              style={[styles.reportText, { color: halalStatus.haram.base }]}
            >
              Signaler un manquement
            </Text>
          </Pressable>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["7xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: headingFontFamily.bold,
    fontSize: 13,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  certifierName: {
    fontFamily: headingFontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
  },
  metaLink: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
  overallSection: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallScore: {
    fontFamily: headingFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  sectionLabel: {
    ...textStyles.micro,
  },
  barsContainer: {
    gap: spacing.lg,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  barLabel: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 12,
    fontWeight: "500",
    width: 60,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barScore: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
  practicesList: {
    gap: spacing.sm,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
  },
  reportText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default CertifierDetailSheet;
