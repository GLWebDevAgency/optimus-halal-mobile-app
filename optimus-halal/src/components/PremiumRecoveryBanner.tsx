/**
 * Premium Recovery Banner
 *
 * Detects the "orphaned premium" state: user paid via RevenueCat
 * but quit the app before creating their Naqiy+ account.
 *
 * Shows a gold-accented banner on the home screen inviting them
 * to finalize their account or restore their purchase.
 *
 * Psychology: Reassurance → Action (not urgency, not guilt)
 * Al-Taqwa: Informative, not alarmist. "Votre abonnement vous attend."
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StarIcon, ArrowRightIcon } from "phosphor-react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { getCustomerInfo, isPremiumCustomer } from "@/services/purchases";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { gold } from "@/theme/colors";
import { trackEvent } from "@/lib/analytics";

export function PremiumRecoveryBanner() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const [isOrphaned, setIsOrphaned] = useState(false);

  useEffect(() => {
    // Only check if user is a guest (no stored tokens)
    if (hasStoredTokens()) return;

    getCustomerInfo()
      .then((info) => {
        if (info && isPremiumCustomer(info)) {
          setIsOrphaned(true);
          trackEvent("premium_recovery_banner_shown");
        }
      })
      .catch(() => {});
  }, []);

  if (!isOrphaned) return null;

  const handlePress = () => {
    impact();
    trackEvent("premium_recovery_banner_tapped");
    router.push("/(auth)/signup");
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(500)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
    >
      <PressableScale
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={t.home.premiumRecovery.cta}
      >
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark
                ? "rgba(212, 175, 55, 0.08)"
                : "rgba(212, 175, 55, 0.06)",
              borderColor: isDark
                ? "rgba(212, 175, 55, 0.2)"
                : "rgba(212, 175, 55, 0.15)",
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(212, 175, 55, 0.15)"
                  : "rgba(212, 175, 55, 0.12)",
              },
            ]}
          >
            <StarIcon size={20} color={gold[500]} weight="fill" />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {t.home.premiumRecovery.title}
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {t.home.premiumRecovery.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.ctaPill,
              { backgroundColor: gold[500] },
            ]}
          >
            <Text style={styles.ctaText}>
              {t.home.premiumRecovery.cta}
            </Text>
            <ArrowRightIcon size={14} color="#102217" />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102217",
  },
});
