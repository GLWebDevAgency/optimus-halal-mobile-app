/**
 * useHaptics Hook
 *
 * Wrapper around expo-haptics that respects the user's haptic toggle
 * in settings. All haptic feedback in the app should go through this
 * hook instead of calling Haptics directly.
 */

import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { usePreferencesStore } from "@/store";

export function useHaptics() {
  const enabled = usePreferencesStore((s) => s.hapticsEnabled);

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (enabled) {
        Haptics.impactAsync(style);
      }
    },
    [enabled],
  );

  const notification = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (enabled) {
        Haptics.notificationAsync(type);
      }
    },
    [enabled],
  );

  const selection = useCallback(() => {
    if (enabled) {
      Haptics.selectionAsync();
    }
  }, [enabled]);

  return { impact, notification, selection, enabled };
}
