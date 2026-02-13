/**
 * Cart Service — Stub (no BFF cart router yet)
 *
 * Cart/e-commerce features are planned for a future release.
 * All methods return graceful fallbacks so the app doesn't crash.
 */

import type * as Types from './types';

const NOT_IMPLEMENTED = 'Cart feature coming soon';

export const cartService = {
  async getCart(): Promise<Types.Cart> {
    return {
      id: '',
      items: [],
      coupons: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
    };
  },

  async addToCart(_input: Types.AddToCartInput): Promise<Types.CartItem> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async updateCartItem(
    _input: Types.UpdateCartItemInput
  ): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async removeFromCart(_itemId: string): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async clearCart(): Promise<Types.SuccessResponse> {
    return { success: true };
  },

  async applyCoupon(
    _code: string
  ): Promise<{ success: boolean; coupon: Types.CartCoupon }> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async removeCoupon(_couponId: string): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async saveForLater(_itemId: string): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },

  async getSavedForLater(): Promise<{ items: Types.SavedForLaterItem[] }> {
    return { items: [] };
  },

  async moveToCart(_savedId: string): Promise<Types.SuccessResponse> {
    throw new Error(NOT_IMPLEMENTED);
  },
};

export default cartService;
