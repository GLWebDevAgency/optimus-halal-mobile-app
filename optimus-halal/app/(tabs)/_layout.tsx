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
 */

import React from "react";
import { Tabs } from "expo-router";

import { PremiumTabBar } from "@/components/navigation/PremiumTabBar";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export default function TabsLayout() {
  return (
    <QueryErrorBoundary>
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <PremiumTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Carte",
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Market",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
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
