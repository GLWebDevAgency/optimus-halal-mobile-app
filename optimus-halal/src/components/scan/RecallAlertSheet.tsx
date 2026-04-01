/**
 * RecallAlertSheet — Scan-time product recall notification.
 *
 * Elegant modal (Apple-style) that informs the user when a scanned
 * product is subject to a government recall. Tone: informative and
 * reassuring, not alarmist. Provides recall reason, health risks,
 * consumer actions, and a link to the official recall page.
 *
 * @module components/scan/RecallAlertSheet
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  useReducedMotion,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationFeedbackType } from "expo-haptics";
import {
  XIcon,
  WarningIcon,
  ArrowSquareOutIcon,
  ShieldCheckIcon,
  FirstAidIcon,
  InfoIcon,
  MapPinIcon,
  StorefrontIcon,
} from "phosphor-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { darkTheme, lightTheme } from "@/theme/colors";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface RecallData {
  id: string;
  productName: string | null;
  brandName: string | null;
  recallReason: string;
  healthRisks: string | null;
  consumerActions: string | null;
  healthPrecautions: string | null;
  distributors: string | null;
  geoScope: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  publishedAt: string | Date;
}

interface RecallAlertSheetProps {
  visible: boolean;
  onClose: () => void;
  recall: RecallData | null;
}

// ── Info Row Component ──────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  isDark: boolean;
  colors: { textPrimary: string; textSecondary: string };
  delay: number;
}

const InfoRow = React.memo(function InfoRow({
  icon,
  title,
  content,
  isDark,
  colors,
  delay,
}: InfoRowProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.infoCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        },
      ]}
    >
      <View style={styles.infoHeader}>
        {icon}
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.infoContent, { color: colors.textSecondary }]}>
        {content}
      </Text>
    </Animated.View>
  );
});

// ── Main Component ──────────────────────────────────────

export const RecallAlertSheet = React.memo(function RecallAlertSheet({
  visible,
  onClose,
  recall,
}: RecallAlertSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { impact, notification } = useHaptics();

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && recall) {
      setIsMounted(true);
      notification(NotificationFeedbackType.Warning);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 28, stiffness: 120 });
    } else if (isMounted) {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 250, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setIsMounted)(false);
        },
      );
    }
  }, [visible, recall, reducedMotion, translateY, backdropOpacity, isMounted, notification]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleOpenSource = useCallback(() => {
    if (recall?.sourceUrl) {
      impact();
      Linking.openURL(recall.sourceUrl);
    }
  }, [recall?.sourceUrl, impact]);

  if (!isMounted || !recall) return null;

  const publishedDate = new Date(recall.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const warningColor = "#f59e0b";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: isDark
              ? darkTheme.background
              : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
          />
        </View>

        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <XIcon size={20} color={colors.textSecondary} />
        </Pressable>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header: icon + title ── */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.headerSection}
          >
            <View
              style={[
                styles.warningIconContainer,
                { backgroundColor: `${warningColor}15` },
              ]}
            >
              <WarningIcon size={28} color={warningColor} weight="fill" />
            </View>

            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {t.recalls?.title ?? "Rappel produit"}
            </Text>

            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              {t.recalls?.subtitle ?? "Le produit que vous venez de scanner fait l'objet d'un rappel officiel."}
            </Text>
          </Animated.View>

          {/* ── Product info ── */}
          {(recall.productName || recall.brandName) && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={[
                styles.productCard,
                {
                  backgroundColor: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
                  borderColor: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.10)",
                },
              ]}
            >
              {recall.imageUrl && (
                <Image
                  source={{ uri: recall.imageUrl }}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.productInfo}>
                {recall.brandName && (
                  <Text style={[styles.productBrand, { color: warningColor }]}>
                    {recall.brandName.toUpperCase()}
                  </Text>
                )}
                {recall.productName && (
                  <Text
                    style={[styles.productName, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {recall.productName}
                  </Text>
                )}
                <Text style={[styles.productDate, { color: colors.textMuted }]}>
                  {t.recalls?.publishedOn ?? "Publié le"} {publishedDate}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Recall reason ── */}
          <InfoRow
            icon={<WarningIcon size={16} color={warningColor} weight="bold" />}
            title={t.recalls?.reasonTitle ?? "Motif du rappel"}
            content={recall.recallReason}
            isDark={isDark}
            colors={colors}
            delay={300}
          />

          {/* ── Health risks ── */}
          {recall.healthRisks && (
            <InfoRow
              icon={<FirstAidIcon size={16} color="#ef4444" weight="bold" />}
              title={t.recalls?.risksTitle ?? "Risques pour la sante"}
              content={recall.healthRisks}
              isDark={isDark}
              colors={colors}
              delay={350}
            />
          )}

          {/* ── What to do ── */}
          {recall.consumerActions && (
            <InfoRow
              icon={<ShieldCheckIcon size={16} color="#22c55e" weight="bold" />}
              title={t.recalls?.actionsTitle ?? "Que faire ?"}
              content={recall.consumerActions}
              isDark={isDark}
              colors={colors}
              delay={400}
            />
          )}

          {/* ── Health precautions ── */}
          {recall.healthPrecautions && (
            <InfoRow
              icon={<InfoIcon size={16} color="#3b82f6" weight="bold" />}
              title={t.recalls?.precautionsTitle ?? "Precautions sanitaires"}
              content={recall.healthPrecautions}
              isDark={isDark}
              colors={colors}
              delay={450}
            />
          )}

          {/* ── Distributors ── */}
          {recall.distributors && (
            <InfoRow
              icon={<StorefrontIcon size={16} color={colors.textSecondary} weight="bold" />}
              title={t.recalls?.distributorsTitle ?? "Points de vente concernes"}
              content={recall.distributors}
              isDark={isDark}
              colors={colors}
              delay={500}
            />
          )}

          {/* ── Geographic scope ── */}
          {recall.geoScope && (
            <InfoRow
              icon={<MapPinIcon size={16} color={colors.textSecondary} weight="bold" />}
              title={t.recalls?.geoTitle ?? "Zone geographique"}
              content={recall.geoScope}
              isDark={isDark}
              colors={colors}
              delay={550}
            />
          )}

          {/* ── Official source CTA ── */}
          {recall.sourceUrl && (
            <Animated.View entering={FadeInDown.delay(600).duration(400)}>
              <PressableScale
                onPress={handleOpenSource}
                style={[
                  styles.sourceCta,
                  { backgroundColor: isDark ? colors.primary : "#0f172a" },
                ]}
                accessibilityRole="link"
                accessibilityLabel={t.recalls?.viewOfficial ?? "Voir la fiche officielle"}
              >
                <ArrowSquareOutIcon size={18} color={isDark ? "#0f172a" : "#ffffff"} />
                <Text
                  style={[
                    styles.sourceCtaText,
                    { color: isDark ? "#0f172a" : "#ffffff" },
                  ]}
                >
                  {t.recalls?.viewOfficial ?? "Voir la fiche officielle"}
                </Text>
              </PressableScale>
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },

  // ── Header ──
  headerSection: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  warningIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: fontSize.h3,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: fontSize.bodySmall,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },

  // ── Product card ──
  productCard: {
    flexDirection: "row",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
  },
  productInfo: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  productBrand: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: fontSize.body,
    fontWeight: "600",
    lineHeight: 20,
  },
  productDate: {
    fontSize: 11,
    marginTop: 2,
  },

  // ── Info cards ──
  infoCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: "700",
  },
  infoContent: {
    fontSize: fontSize.bodySmall,
    lineHeight: 20,
  },

  // ── Source CTA ──
  sourceCta: {
    flexDirection: "row",
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceCtaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});

export default RecallAlertSheet;
