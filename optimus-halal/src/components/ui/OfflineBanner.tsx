/**
 * OfflineBanner — event-based connectivity indicator
 *
 * Uses @react-native-community/netinfo instead of polling.
 * Shows a red banner when offline, auto-hides when connectivity returns.
 */

import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "@/hooks";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
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
