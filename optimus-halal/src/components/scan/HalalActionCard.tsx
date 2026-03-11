/**
 * HalalActionCard — Contextual community action card.
 *
 * Shown on scan results when a user can take a meaningful action:
 *   - Report a product with doubtful halal status
 *   - Request certification for popular uncertified products
 *   - Share product analysis to social
 */

import React from "react";
import { View, Text, StyleSheet, Share } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { CaretRightIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "@/components/ui/PressableScale";
import { semantic, gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { AppIcon, type IconName } from "@/lib/icons";

type ActionType = "report" | "request_certification" | "share";

interface HalalActionCardProps {
  type: ActionType;
  productName: string | null;
  productBarcode: string | null;
  /** Report count for social proof */
  reportCount?: number;
  /** Labels */
  reportLabel?: string;
  reportDesc?: string;
  certifyLabel?: string;
  certifyDesc?: string;
  shareLabel?: string;
  shareDesc?: string;
  shareTagline?: string;
  onReport?: () => void;
  onRequestCertification?: () => void;
}

const ACTION_CONFIG: Record<ActionType, {
  icon: IconName;
  color: string;
}> = {
  report: { icon: "flag", color: semantic.warning.base },
  request_certification: { icon: "verified", color: gold[500] },
  share: { icon: "share", color: semantic.info.base },
};

export const HalalActionCard = React.memo(function HalalActionCard({
  type,
  productName,
  productBarcode,
  reportCount,
  reportLabel = "Signaler ce produit",
  reportDesc = "Aidez la communauté en signalant un statut halal incorrect",
  certifyLabel = "Demander une certification",
  certifyDesc = "Ce produit populaire n'est pas encore certifié halal",
  shareLabel = "Partager l'analyse",
  shareDesc = "Partagez cette analyse avec votre entourage",
  shareTagline = "Vérifié avec Naqiy",
  onReport,
  onRequestCertification,
}: HalalActionCardProps) {
  const { isDark, colors } = useTheme();
  const config = ACTION_CONFIG[type];

  const labels: Record<ActionType, { title: string; desc: string }> = {
    report: { title: reportLabel, desc: reportDesc },
    request_certification: { title: certifyLabel, desc: certifyDesc },
    share: { title: shareLabel, desc: shareDesc },
  };

  const { title, desc } = labels[type];

  const handlePress = async () => {
    if (type === "report" && onReport) {
      onReport();
    } else if (type === "request_certification" && onRequestCertification) {
      onRequestCertification();
    } else if (type === "share") {
      try {
        await Share.share({
          message: `${productName ?? "Produit"} — ${shareTagline}\nhttps://naqiy.app`,
        });
      } catch {
        // User dismissed share sheet — no action needed
      }
    }
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(300)}>
      <PressableScale onPress={handlePress}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? `${config.color}10` : `${config.color}08`,
              borderColor: isDark ? `${config.color}25` : `${config.color}18`,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
            <AppIcon name={config.icon} size={18} color={config.color} />
          </View>

          <View style={styles.textColumn}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
              {desc}
            </Text>
            {type === "report" && reportCount != null && reportCount > 0 && (
              <Text style={[styles.socialProof, { color: colors.textMuted }]}>
                {reportCount} signalement{reportCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>

          <CaretRightIcon size={20} color={colors.textMuted} />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  desc: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  socialProof: {
    fontSize: fontSize.micro,
    marginTop: 4,
  },
});

export default HalalActionCard;
