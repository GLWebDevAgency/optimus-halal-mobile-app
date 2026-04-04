/**
 * OfflineBanner — subtle connectivity indicator
 *
 * Polls a lightweight endpoint every 30s. Shows a red banner
 * when offline, auto-hides when connectivity returns.
 * Uses AppState to pause polling when backgrounded.
 */

import React, { useEffect, useState } from "react";
import { AppState, Text } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useTranslation } from "@/hooks";
import { API_CONFIG } from "@/services/api/config";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        // Check OUR backend health — not a third-party (blocked in some regions)
        const resp = await fetch(`${API_CONFIG.baseUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (mounted) setIsOffline(!resp.ok);
      } catch {
        if (mounted) setIsOffline(true);
      }
    };

    check();
    const interval = setInterval(() => {
      if (AppState.currentState === "active") check();
    }, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="bg-red-500 px-4 py-2 items-center"
    >
      <Text className="text-white text-sm font-medium">
        {t.common.noInternet}
      </Text>
    </Animated.View>
  );
}
