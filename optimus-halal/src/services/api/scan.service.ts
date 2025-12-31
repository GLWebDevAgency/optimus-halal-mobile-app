/**
 * Scan Service - Enterprise-grade Mobile App
 * 
 * Product scanning, history, and analysis service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// SCAN SERVICE
// ============================================

export const scanService = {
  /**
   * Scan a product barcode
   */
  async scanBarcode(input: Types.ScanBarcodeInput): Promise<Types.ScanResult> {
    return apiClient.mobile.scanBarcode.mutate(input);
  },

  /**
   * Get scan history with pagination and filters
   */
  async getScanHistory(
    pagination?: Types.PaginationInput,
    filters?: {
      halalStatus?: Types.HalalStatus;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    scans: Types.ScanHistoryItem[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getScanHistory.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      ...filters,
    });
  },

  /**
   * Get recent scans
   */
  async getRecentScans(limit: number = 10): Promise<{ scans: Types.ScanHistoryItem[] }> {
    return apiClient.mobile.getRecentScans.query({ limit });
  },

  /**
   * Get scan statistics
   */
  async getScanStats(): Promise<Types.ScanStats> {
    return apiClient.mobile.getScanStats.query();
  },

  /**
   * Submit analysis request for unknown product
   */
  async submitAnalysisRequest(input: Types.AnalysisRequestInput): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    return apiClient.mobile.submitAnalysisRequest.mutate(input);
  },

  /**
   * Clear scan history
   */
  async clearScanHistory(): Promise<Types.DeleteResponse> {
    return apiClient.mobile.clearScanHistory.mutate();
  },
};

export default scanService;
