/**
 * Order Service — Stub (no BFF order router yet)
 *
 * Order/e-commerce features are planned for a future release.
 * All methods return graceful fallbacks so the app doesn't crash.
 */

import type * as Types from './types';

const NOT_IMPLEMENTED = 'Order feature coming soon';

export const orderService = {
  async createOrder(
    _input: Types.CreateOrderInput
  ): Promise<{
    id: string;
    orderNumber: string;
    status: Types.OrderStatus;
    total: number;
    message: string;
  }> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async getOrder(_orderId: string): Promise<Types.OrderWithDetails> {
    return {
      order: null,
      items: [],
      events: [],
      canCancel: false,
      canTrack: false,
    };
  },

  async getOrders(
    pagination?: Types.PaginationInput,
    _filters?: {
      status?: Types.OrderStatus;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    orders: Types.Order[];
    pagination: Types.PaginationOutput;
  }> {
    return {
      orders: [],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: 0,
        totalPages: 0,
      },
    };
  },

  async cancelOrder(
    _orderId: string,
    _reason?: string
  ): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async reorder(
    _orderId: string
  ): Promise<{ success: boolean; message: string }> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async getOrderTracking(_orderId: string): Promise<Types.OrderTracking> {
    throw new Error(NOT_IMPLEMENTED);
  },
};

export default orderService;
