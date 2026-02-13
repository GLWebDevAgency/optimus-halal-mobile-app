/**
 * Entry Point - Router Redirect
 * 
 * Redirige vers l'écran approprié selon l'état de l'application
 */

import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useOnboardingStore, useLocalAuthStore } from "@/store";

export default function Index() {
  const { hasCompletedOnboarding } = useOnboardingStore();
  const { isAuthenticated, isLoading } = useLocalAuthStore();

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#1de560" />
      </View>
    );
  }

  // Redirect logic
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
