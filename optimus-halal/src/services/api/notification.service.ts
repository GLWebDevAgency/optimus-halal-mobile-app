/**
 * Notification Service - Enterprise-grade Mobile App
 * 
 * Push notifications and settings management
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient, getDeviceId } from './client';
import type * as Types from './types';

// ============================================
// NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  /**
   * Register push notification token
   */
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
    return apiClient.mobile.registerPushToken.mutate({
      token,
      platform,
      deviceId,
      deviceName: options?.deviceName,
      appVersion: options?.appVersion,
      osVersion: options?.osVersion,
    });
  },

  /**
   * Deactivate push token
   */
  async deactivatePushToken(token: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.deactivatePushToken.mutate({ token });
  },

  /**
   * Get notifications with pagination
   */
  async getNotifications(
    pagination?: Types.PaginationInput,
    filters?: {
      type?: string;
      isRead?: boolean;
    }
  ): Promise<{
    notifications: Types.Notification[];
    unreadCount: number;
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getNotifications.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(notificationIds: string[]): Promise<{
    success: boolean;
    count: number;
  }> {
    return apiClient.mobile.markNotificationsRead.mutate({ notificationIds });
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<{
    success: boolean;
    count: number;
  }> {
    return apiClient.mobile.markAllNotificationsRead.mutate();
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<Types.NotificationSettings> {
    return apiClient.mobile.getNotificationSettings.query();
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    input: Types.UpdateNotificationSettingsInput
  ): Promise<Types.SuccessResponse> {
    return apiClient.mobile.updateNotificationSettings.mutate(input);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<Types.CountResponse> {
    return apiClient.mobile.getUnreadNotificationCount.query();
  },
};

export default notificationService;
