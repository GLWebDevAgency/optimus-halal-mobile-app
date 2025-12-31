/**
 * Cart Service - Enterprise-grade Mobile App
 * 
 * Shopping cart management service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// CART SERVICE
// ============================================

export const cartService = {
  /**
   * Get current cart
   */
  async getCart(): Promise<Types.Cart> {
    return apiClient.mobile.getCart.query();
  },

  /**
   * Add item to cart
   */
  async addToCart(input: Types.AddToCartInput): Promise<Types.CartItem> {
    return apiClient.mobile.addToCart.mutate(input);
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(input: Types.UpdateCartItemInput): Promise<Types.SuccessResponse> {
    return apiClient.mobile.updateCartItem.mutate(input);
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.removeFromCart.mutate({ itemId });
  },

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<Types.SuccessResponse> {
    return apiClient.mobile.clearCart.mutate();
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(code: string): Promise<{
    success: boolean;
    coupon: Types.CartCoupon;
  }> {
    return apiClient.mobile.applyCoupon.mutate({ code });
  },

  /**
   * Remove coupon
   */
  async removeCoupon(couponId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.removeCoupon.mutate({ couponId });
  },

  /**
   * Save item for later
   */
  async saveForLater(itemId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.saveForLater.mutate({ itemId });
  },

  /**
   * Get saved for later items
   */
  async getSavedForLater(): Promise<{ items: Types.SavedForLaterItem[] }> {
    return apiClient.mobile.getSavedForLater.query();
  },

  /**
   * Move saved item back to cart
   */
  async moveToCart(savedId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.moveToCart.mutate({ savedId });
  },
};

export default cartService;
