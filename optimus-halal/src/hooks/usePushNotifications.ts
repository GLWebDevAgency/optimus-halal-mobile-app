/**
 * usePushNotifications — Expo push token registration
 *
 * Requests permission, fetches the Expo push token, and registers it
 * with the backend:
 *   - Guest:      analytics.registerGuestPushToken (saves to devices table)
 *   - Registered: notification.registerPushToken   (saves to push_tokens table)
 *
 * Also handles notification tap → deep-links to paywall when relevant.
 *
 * Called once from AppInitializer after auth state resolves.
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { apiClient, getDeviceId } from "@/services/api/client";
import { logger } from "@/lib/logger";

const EAS_PROJECT_ID = "74c0f55e-ea1c-4786-93a7-de4b27280104";

// Set notification handler — show alerts while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UsePushNotificationsOptions {
  isGuest: boolean;
  isAuthLoading: boolean;
}

export function usePushNotifications({ isGuest, isAuthLoading }: UsePushNotificationsOptions) {
  const registered = useRef(false);

  // Register push token once auth state is resolved
  useEffect(() => {
    if (isAuthLoading) return;
    if (registered.current) return;
    registered.current = true;

    registerAndSaveToken(isGuest).catch(() => {});
  }, [isAuthLoading, isGuest]);

  // Deep-link: paywall tap from push notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      if (data?.screen === "paywall") {
        const trigger = (data?.trigger as string) ?? "push_nudge";
        // Small delay to let navigation stack settle
        setTimeout(() => {
          router.push({ pathname: "/paywall", params: { trigger } } as any);
        }, 300);
      }
    });

    return () => subscription.remove();
  }, []);
}

async function registerAndSaveToken(isGuest: boolean) {
  // Push notifications require a physical device
  if (Platform.OS === "web") return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    logger.info("Push", "Permission refusée");
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  const token = tokenData.data;
  const platform = Platform.OS as "ios" | "android";

  if (isGuest) {
    // Guest: save to devices table via analytics router
    await apiClient.analytics.registerGuestPushToken.mutate({ token, platform });
    logger.info("Push", "Token invité enregistré");
  } else {
    // Registered: save to push_tokens table via notification router
    const deviceId = await getDeviceId();
    await apiClient.notification.registerPushToken.mutate({
      token,
      platform,
      deviceId,
    });
    logger.info("Push", "Token utilisateur enregistré");
  }
}
