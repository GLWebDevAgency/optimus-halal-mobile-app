/**
 * Alert Service - Enterprise-grade Mobile App
 * 
 * Ethical alerts feed and management service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// ALERT SERVICE
// ============================================

export const alertService = {
  /**
   * Get alerts with pagination and filters
   */
  async getAlerts(
    pagination?: Types.PaginationInput,
    filters?: {
      categoryId?: string;
      severity?: Types.AlertSeverity;
      priority?: Types.AlertPriority;
    }
  ): Promise<{
    alerts: Types.AlertWithStatus[];
    unreadCount: number;
    criticalCount: number;
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getAlerts.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Get alert details
   */
  async getAlert(alertId: string): Promise<{
    alert: Types.Alert | null;
    userStatus: {
      isRead: boolean;
      isDismissed: boolean;
    } | null;
    relatedAlerts: Types.Alert[];
  }> {
    return apiClient.mobile.getAlert.query({ alertId });
  },

  /**
   * Mark alert as read
   */
  async markAlertRead(alertId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.markAlertRead.mutate({ alertId });
  },

  /**
   * Mark all alerts as read
   */
  async markAllAlertsRead(): Promise<{
    success: boolean;
    count: number;
  }> {
    return apiClient.mobile.markAllAlertsRead.mutate();
  },

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.dismissAlert.mutate({ alertId });
  },

  /**
   * Get alert categories
   */
  async getAlertCategories(): Promise<{ categories: Types.AlertCategory[] }> {
    return apiClient.mobile.getAlertCategories.query();
  },

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary(): Promise<Types.AlertSummary> {
    return apiClient.mobile.getAlertSummary.query();
  },
};

export default alertService;
