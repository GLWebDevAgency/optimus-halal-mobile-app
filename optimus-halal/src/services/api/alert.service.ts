/**
 * Alert Service — Mobile BFF adapter
 *
 * BFF routes: alert.list, alert.getById, alert.getCategories,
 *             alert.markAsRead, alert.dismiss, alert.getUnreadCount
 */

import { apiClient } from './client';
import type * as Types from './types';

export const alertService = {
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
    // Backend returns { items, nextCursor }, not { alerts, unreadCount, criticalCount }
    const result = await apiClient.alert.list.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
      severity: filters?.severity,
      category: filters?.categoryId,
    });

    return {
      alerts: (result.items ?? []) as unknown as Types.AlertWithStatus[],
      unreadCount: 0,
      criticalCount: 0,
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.items?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async getAlert(alertId: string): Promise<{
    alert: Types.Alert | null;
    userStatus: { isRead: boolean; isDismissed: boolean } | null;
    relatedAlerts: Types.Alert[];
  }> {
    const result = await apiClient.alert.getById.query({ id: alertId });
    return {
      alert: result as unknown as Types.Alert | null,
      userStatus: null,
      relatedAlerts: [],
    };
  },

  async markAlertRead(alertId: string): Promise<Types.SuccessResponse> {
    // Backend expects { alertId }, not { id }
    await apiClient.alert.markAsRead.mutate({ alertId });
    return { success: true };
  },

  async markAllAlertsRead(): Promise<{ success: boolean; count: number }> {
    // Not a dedicated BFF endpoint — stub
    return { success: true, count: 0 };
  },

  async dismissAlert(alertId: string): Promise<Types.SuccessResponse> {
    // Backend expects { alertId }, not { id }
    await apiClient.alert.dismiss.mutate({ alertId });
    return { success: true };
  },

  async getAlertCategories(): Promise<{
    categories: Types.AlertCategory[];
  }> {
    const categories = await apiClient.alert.getCategories.query();
    return { categories: categories as Types.AlertCategory[] };
  },

  async getAlertSummary(): Promise<Types.AlertSummary> {
    // Compute from unreadCount endpoint
    const result = await apiClient.alert.getUnreadCount.query();
    return {
      totalUnread: result.count ?? 0,
      criticalUnread: 0,
      highUnread: 0,
      latestAlert: null,
      hasCritical: false,
    };
  },
};

export default alertService;
