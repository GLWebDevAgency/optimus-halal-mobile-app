/**
 * Tabs Layout - Premium Navigation
 *
 * Navigation ultra premium avec 5 onglets :
 * - Home (Dashboard)
 * - Map (Points de vente)
 * - Scanner (Bouton central flottant)
 * - Marketplace (Produits halal certifiés)
 * - Profile (Profil utilisateur)
 *
 * Features:
 * - Bouton Scanner flottant surélevé avec glow
 * - Animations de sélection fluides
 * - Icônes qui changent (fill/outline)
 * - Backdrop blur effect
 * - Haptic feedback premium
 * - Smooth cross-fade transition between tab screens
 */

import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";

import { PremiumTabBar } from "@/components/navigation/PremiumTabBar";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <QueryErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",
          ...(Platform.OS === "android" ? { animationDuration: 200 } : {}),
          sceneStyle: { backgroundColor: colors.background },
        }}
        tabBar={(props) => <PremiumTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.nav.home,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: t.nav.map,
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: t.nav.scanner,
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: t.nav.marketplace,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.nav.profile,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </QueryErrorBoundary>
  );
}
