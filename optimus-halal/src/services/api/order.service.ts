/**
 * Order Service - Enterprise-grade Mobile App
 * 
 * Order management and tracking service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// ORDER SERVICE
// ============================================

export const orderService = {
  /**
   * Create a new order from cart
   */
  async createOrder(input: Types.CreateOrderInput): Promise<{
    id: string;
    orderNumber: string;
    status: Types.OrderStatus;
    total: number;
    message: string;
  }> {
    return apiClient.mobile.createOrder.mutate(input);
  },

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<Types.OrderWithDetails> {
    return apiClient.mobile.getOrder.query({ orderId });
  },

  /**
   * Get orders with pagination and filters
   */
  async getOrders(
    pagination?: Types.PaginationInput,
    filters?: {
      status?: Types.OrderStatus;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    orders: Types.Order[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getOrders.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.cancelOrder.mutate({ orderId, reason });
  },

  /**
   * Reorder (add previous order items to cart)
   */
  async reorder(orderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.mobile.reorder.mutate({ orderId });
  },

  /**
   * Get order tracking details
   */
  async getOrderTracking(orderId: string): Promise<Types.OrderTracking> {
    return apiClient.mobile.getOrderTracking.query({ orderId });
  },
};

export default orderService;
