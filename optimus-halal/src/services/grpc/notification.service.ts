/**
 * Notification Service - gRPC-Web Client
 * 
 * Handles push notifications: registration, preferences, history
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient } from './client';
import { SERVICES } from './types';
import type {
  RegisterPushTokenRequest,
  UnregisterPushTokenRequest,
  GetNotificationSettingsRequest,
  UpdateNotificationSettingsRequest,
  NotificationSettings,
  GetNotificationsRequest,
  NotificationListResponse,
  MarkNotificationReadRequest,
  MarkAllNotificationsReadRequest,
  GetUnreadCountRequest,
  UnreadCountResponse,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Notification Service client for React Native
 */
class NotificationService {
  private readonly service = SERVICES.NOTIFICATION;

  /**
   * Register push notification token
   */
  async registerPushToken(request: RegisterPushTokenRequest): Promise<void> {
    await grpcClient.unary<RegisterPushTokenRequest, Record<string, never>>(
      this.service,
      'RegisterPushToken',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(request: UnregisterPushTokenRequest): Promise<void> {
    await grpcClient.unary<UnregisterPushTokenRequest, Record<string, never>>(
      this.service,
      'UnregisterPushToken',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get notification settings
   */
  async getSettings(request: GetNotificationSettingsRequest): Promise<NotificationSettings> {
    return grpcClient.unary<GetNotificationSettingsRequest, NotificationSettings>(
      this.service,
      'GetSettings',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Update notification settings
   */
  async updateSettings(request: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    return grpcClient.unary<UpdateNotificationSettingsRequest, NotificationSettings>(
      this.service,
      'UpdateSettings',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get notifications list
   */
  async getNotifications(request: GetNotificationsRequest): Promise<NotificationListResponse> {
    return grpcClient.unary<GetNotificationsRequest, NotificationListResponse>(
      this.service,
      'GetNotifications',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(request: MarkNotificationReadRequest): Promise<void> {
    await grpcClient.unary<MarkNotificationReadRequest, Record<string, never>>(
      this.service,
      'MarkAsRead',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(request: MarkAllNotificationsReadRequest): Promise<void> {
    await grpcClient.unary<MarkAllNotificationsReadRequest, Record<string, never>>(
      this.service,
      'MarkAllAsRead',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(request: GetUnreadCountRequest): Promise<UnreadCountResponse> {
    return grpcClient.unary<GetUnreadCountRequest, UnreadCountResponse>(
      this.service,
      'GetUnreadCount',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
