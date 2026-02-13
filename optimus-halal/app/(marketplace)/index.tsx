/**
 * Marketplace Index
 * 
 * Point d'entrée du marketplace - redirige vers coming-soon ou catalog selon feature flag
 */

import React from "react";
import { Redirect } from "expo-router";
import { useFeatureFlagsStore } from "@/store";

export default function MarketplaceIndex() {
  const { flags } = useFeatureFlagsStore();

  // Si le marketplace n'est pas activé, afficher la page coming soon
  if (!flags.marketplaceEnabled) {
    return <Redirect href="/(marketplace)/coming-soon" />;
  }

  // Sinon, aller au catalogue
  return <Redirect href="/(marketplace)/catalog" />;
}
