/**
 * Alert Service - gRPC-Web Client
 * 
 * Handles ethical alerts feed: list, subscriptions, categories
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient } from './client';
import { SERVICES } from './types';
import type {
  GetAlertsRequest,
  AlertsListResponse,
  GetAlertRequest,
  Alert,
  GetAlertCategoriesRequest,
  AlertCategoriesResponse,
  SubscribeToCategoryRequest,
  UnsubscribeFromCategoryRequest,
  GetSubscribedCategoriesRequest,
  SubscribedCategoriesResponse,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Alert Service client for React Native
 */
class AlertService {
  private readonly service = SERVICES.ALERTS;

  /**
   * Get alerts feed with optional filters
   */
  async getAlerts(request: GetAlertsRequest): Promise<AlertsListResponse> {
    return grpcClient.unary<GetAlertsRequest, AlertsListResponse>(
      this.service,
      'GetAlerts',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get single alert by ID
   */
  async getAlert(request: GetAlertRequest): Promise<Alert> {
    return grpcClient.unary<GetAlertRequest, Alert>(
      this.service,
      'GetAlert',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get alert categories
   */
  async getCategories(request: GetAlertCategoriesRequest): Promise<AlertCategoriesResponse> {
    return grpcClient.unary<GetAlertCategoriesRequest, AlertCategoriesResponse>(
      this.service,
      'GetCategories',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Subscribe to alert category
   */
  async subscribeToCategory(request: SubscribeToCategoryRequest): Promise<void> {
    await grpcClient.unary<SubscribeToCategoryRequest, Record<string, never>>(
      this.service,
      'SubscribeToCategory',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Unsubscribe from alert category
   */
  async unsubscribeFromCategory(request: UnsubscribeFromCategoryRequest): Promise<void> {
    await grpcClient.unary<UnsubscribeFromCategoryRequest, Record<string, never>>(
      this.service,
      'UnsubscribeFromCategory',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get subscribed categories
   */
  async getSubscribedCategories(request: GetSubscribedCategoriesRequest): Promise<SubscribedCategoriesResponse> {
    return grpcClient.unary<GetSubscribedCategoriesRequest, SubscribedCategoriesResponse>(
      this.service,
      'GetSubscribedCategories',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const alertService = new AlertService();
export default alertService;
