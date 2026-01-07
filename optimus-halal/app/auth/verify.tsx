/**
 * Magic Link Verification Screen
 * 
 * Handles deep link verification automatically
 */

import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function MagicLinkVerifyScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const token = params.token as string;
    if (token) {
      // Redirect to magic-link screen with token
      router.replace({
        pathname: "/(auth)/magic-link",
        params: { token },
      });
    } else {
      // No token, go back to login
      router.replace("/(auth)/magic-link");
    }
  }, [params.token]);

  return (
    <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center">
      <ActivityIndicator size="large" color="#13ec6a" />
    </View>
  );
}
