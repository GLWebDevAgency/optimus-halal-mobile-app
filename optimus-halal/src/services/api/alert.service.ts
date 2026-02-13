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
    const result = await apiClient.alert.list.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
      ...filters,
    });

    return {
      alerts: (result.alerts ?? []) as Types.AlertWithStatus[],
      unreadCount: result.unreadCount ?? 0,
      criticalCount: result.criticalCount ?? 0,
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.alerts?.length ?? 0,
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
      alert: result as Types.Alert | null,
      userStatus: null,
      relatedAlerts: [],
    };
  },

  async markAlertRead(alertId: string): Promise<Types.SuccessResponse> {
    await apiClient.alert.markAsRead.mutate({ id: alertId });
    return { success: true };
  },

  async markAllAlertsRead(): Promise<{ success: boolean; count: number }> {
    // Not a dedicated BFF endpoint — stub
    return { success: true, count: 0 };
  },

  async dismissAlert(alertId: string): Promise<Types.SuccessResponse> {
    await apiClient.alert.dismiss.mutate({ id: alertId });
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
      totalUnread: (result as any).count ?? 0,
      criticalUnread: 0,
      highUnread: 0,
      latestAlert: null,
      hasCritical: false,
    };
  },
};

export default alertService;
