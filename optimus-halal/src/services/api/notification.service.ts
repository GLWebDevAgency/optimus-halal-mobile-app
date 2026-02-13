/**
 * Notification Service — Mobile BFF adapter
 *
 * BFF routes: notification.list, notification.getUnreadCount,
 *             notification.markAsRead, notification.markAllAsRead,
 *             notification.registerPushToken, notification.unregisterPushToken,
 *             notification.getSettings, notification.updateSettings
 */

import { apiClient, getDeviceId } from './client';
import type * as Types from './types';

export const notificationService = {
  async registerPushToken(
    token: string,
    platform: Types.Platform,
    options?: {
      deviceName?: string;
      appVersion?: string;
      osVersion?: string;
    }
  ): Promise<Types.SuccessResponse> {
    const deviceId = await getDeviceId();
    // Backend only accepts "ios" | "android", not "web"
    await apiClient.notification.registerPushToken.mutate({
      token,
      platform: platform as 'ios' | 'android',
      deviceId,
    });
    return { success: true };
  },

  async deactivatePushToken(token: string): Promise<Types.SuccessResponse> {
    await apiClient.notification.unregisterPushToken.mutate({ token });
    return { success: true };
  },

  async getNotifications(
    pagination?: Types.PaginationInput,
    filters?: { type?: string; isRead?: boolean }
  ): Promise<{
    notifications: Types.Notification[];
    unreadCount: number;
    pagination: Types.PaginationOutput;
  }> {
    // Backend uses offset (not cursor) and returns array directly (no .notifications wrapper)
    const result = await apiClient.notification.list.query({
      limit: pagination?.limit ?? 20,
      offset: 0,
    });

    return {
      notifications: (result ?? []) as unknown as Types.Notification[],
      unreadCount: 0,
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result?.length ?? 0,
        totalPages: 1,
        hasNext: (result?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async markNotificationsRead(
    notificationIds: string[]
  ): Promise<{ success: boolean; count: number }> {
    // BFF markAsRead takes a single id — loop
    let count = 0;
    for (const id of notificationIds) {
      await apiClient.notification.markAsRead.mutate({ id });
      count++;
    }
    return { success: true, count };
  },

  async markAllNotificationsRead(): Promise<{
    success: boolean;
    count: number;
  }> {
    const result = await apiClient.notification.markAllAsRead.mutate();
    return { success: true, count: (result as any).count ?? 0 };
  },

  async getNotificationSettings(): Promise<Types.NotificationSettings> {
    // Backend returns different shape — map to frontend type
    const settings = await apiClient.notification.getSettings.query();
    return {
      pushEnabled: settings.alertsEnabled ?? true,
      emailEnabled: false,
      alertsPush: settings.alertsEnabled ?? true,
      alertsEmail: false,
      ordersPush: false,
      ordersEmail: false,
      promotionsPush: settings.promotionsEnabled ?? true,
      loyaltyPush: settings.rewardsEnabled ?? true,
      quietHoursEnabled: !!(settings.quietHoursStart && settings.quietHoursEnd),
      quietHoursStart: settings.quietHoursStart ?? undefined,
      quietHoursEnd: settings.quietHoursEnd ?? undefined,
    };
  },

  async updateNotificationSettings(
    input: Types.UpdateNotificationSettingsInput
  ): Promise<Types.SuccessResponse> {
    await apiClient.notification.updateSettings.mutate({
      alertsEnabled: input.alertsPush,
      promotionsEnabled: input.promotionsPush,
      rewardsEnabled: input.loyaltyPush,
      quietHoursStart: input.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd,
    });
    return { success: true };
  },

  async getUnreadCount(): Promise<Types.CountResponse> {
    const result = await apiClient.notification.getUnreadCount.query();
    return { count: result.count ?? 0 };
  },
};

export default notificationService;
