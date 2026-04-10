/**
 * CertifierTrustCard — Certifier info + practices + trust grade.
 *
 * Shown only for the "certified" track. Displays:
 * - Certifier identity (logo, name, madhab)
 * - Trust grade badge (N1-N5)
 * - Blocking points with scholarly explanation
 * - Positive practices in subdued style
 * - Links to certifier profile and dossiers
 *
 * Design: Stitch "certified-avoid" HalalCard pattern.
 *
 * @module components/scan-v2/CertifierTrustCard
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus } from "@/theme/colors";
import { ShieldCheck, CaretRight, Warning } from "phosphor-react-native";
import type {
  CertifierInfoV2,
  CertifierPractice,
  CertifierTrustScores,
  MadhabId,
} from "./scan-v2-types";
import { getTrustGrade, formatTrustGrade, getVerdictColor, verdictToLevel } from "./scan-v2-utils";
import { TrustGradeBadge } from "./TrustGradeBadge";
import { PracticeSignalRow } from "./PracticeSignalRow";

interface CertifierTrustCardProps {
  certifier: CertifierInfoV2;
  trustScores: CertifierTrustScores;
  practices: CertifierPractice[];
  madhab: MadhabId;
  onCertifierPress: () => void;
  onDossierPress?: (dossierId: string) => void;
}

export const CertifierTrustCard: React.FC<CertifierTrustCardProps> = ({
  certifier,
  trustScores,
  practices,
  madhab,
  onCertifierPress,
  onDossierPress,
}) => {
  const { isDark, colors } = useTheme();
  const grade = getTrustGrade(trustScores.trustScore);
  const gradeText = formatTrustGrade(grade);

  const blockers = practices.filter((p) => p.isBlocker);
  const positives = practices.filter((p) => !p.isBlocker);

  return (
    <Animated.View
      entering={FadeInUp.delay(120).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.card : colors.card,
            borderLeftColor: grade.color,
          },
        ]}
      >
        {/* Header: Verdict + Trust Grade */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              CERTIFICATION
            </Text>
            <Text style={[styles.gradeLabel, { color: grade.color }]}>
              Grade {gradeText}
            </Text>
            <Text style={[styles.trustScoreText, { color: colors.textMuted }]}>
              Trust {trustScores.trustScore}
            </Text>
          </View>
          <TrustGradeBadge score={trustScores.trustScore} showLabel />
        </View>

        {/* Certifier Info Row */}
        <Pressable
          onPress={onCertifierPress}
          accessibilityLabel={`Voir le profil de ${certifier.name}`}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.certifierRow,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.certifierLogo, { backgroundColor: isDark ? colors.card : colors.backgroundSecondary }]}>
            <Text style={[styles.certifierLogoText, { color: colors.primary }]}>
              {(certifier.shortName || certifier.name).slice(0, 4).toUpperCase()}
            </Text>
          </View>
          <View style={styles.certifierInfo}>
            <Text style={[styles.certifierName, { color: colors.primary }]}>
              {certifier.name}
            </Text>
            <Text style={[styles.certifierMeta, { color: colors.textSecondary }]}>
              Madhab: {madhab.charAt(0).toUpperCase() + madhab.slice(1)}
            </Text>
          </View>
          <ShieldCheck size={20} color={colors.textMuted} />
        </Pressable>

        {/* Blocking Points */}
        {blockers.length > 0 && (
          <View style={[styles.blockSection, { borderLeftColor: halalStatus.haram.base }]}>
            <View style={styles.blockHeader}>
              <Warning size={16} color={halalStatus.haram.base} weight="fill" />
              <Text style={[styles.blockTitle, { color: halalStatus.haram.base }]}>
                Point bloquant scholarly
              </Text>
            </View>
            {blockers.map((practice) => (
              <View key={practice.id}>
                <PracticeSignalRow practice={practice} />
                {practice.dossierId && onDossierPress && (
                  <Pressable
                    onPress={() => onDossierPress(practice.dossierId!)}
                    style={styles.dossierLink}
                    accessibilityRole="link"
                    accessibilityLabel={`Voir dossier ${practice.label}`}
                  >
                    <Text style={[styles.dossierLinkText, { color: colors.primary }]}>
                      [ Voir dossier {practice.dossierId} ]
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Positive Points */}
        {positives.length > 0 && (
          <View
            style={[
              styles.positivesSection,
              {
                backgroundColor: isDark
                  ? `${halalStatus.halal.base}08`
                  : `${halalStatus.halal.base}06`,
              },
            ]}
          >
            {positives.map((practice) => (
              <PracticeSignalRow key={practice.id} practice={practice} />
            ))}
          </View>
        )}

        {/* Footer: View Certifier Profile */}
        <Pressable
          onPress={onCertifierPress}
          style={styles.profileLink}
          accessibilityRole="link"
          accessibilityLabel="Voir le profil du certifieur"
        >
          <Text style={[styles.profileLinkText, { color: colors.primary }]}>
            [ Voir le profil du certifieur ]
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderLeftWidth: 3,
    padding: spacing["3xl"],
    gap: spacing["3xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...textStyles.micro,
  },
  gradeLabel: {
    fontFamily: headingFontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
  },
  trustScoreText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  certifierRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  certifierLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  certifierLogoText: {
    fontFamily: headingFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
  certifierInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  certifierName: {
    fontFamily: headingFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  certifierMeta: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
  },
  blockSection: {
    borderLeftWidth: 4,
    paddingLeft: spacing.xl,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  blockTitle: {
    fontFamily: headingFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  dossierLink: {
    paddingTop: spacing.md,
  },
  dossierLinkText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  positivesSection: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  profileLink: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  profileLinkText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default CertifierTrustCard;
