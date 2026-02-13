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
    await apiClient.notification.registerPushToken.mutate({
      token,
      platform,
      deviceId,
      deviceName: options?.deviceName,
      appVersion: options?.appVersion,
      osVersion: options?.osVersion,
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
    const result = await apiClient.notification.list.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
    });

    return {
      notifications: (result.notifications ?? []) as Types.Notification[],
      unreadCount: result.unreadCount ?? 0,
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.notifications?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
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
    return apiClient.notification.getSettings.query() as Promise<Types.NotificationSettings>;
  },

  async updateNotificationSettings(
    input: Types.UpdateNotificationSettingsInput
  ): Promise<Types.SuccessResponse> {
    await apiClient.notification.updateSettings.mutate(input);
    return { success: true };
  },

  async getUnreadCount(): Promise<Types.CountResponse> {
    const result = await apiClient.notification.getUnreadCount.query();
    return { count: (result as any).count ?? 0 };
  },
};

export default notificationService;
