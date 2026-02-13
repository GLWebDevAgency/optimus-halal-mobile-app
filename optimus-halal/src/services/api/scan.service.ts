/**
 * Scan Service — Mobile BFF adapter
 *
 * BFF routes: scan.scanBarcode, scan.getHistory,
 *             scan.getStats, scan.requestAnalysis
 */

import { apiClient } from './client';
import type * as Types from './types';

export const scanService = {
  async scanBarcode(input: Types.ScanBarcodeInput): Promise<Types.ScanResult> {
    const result = await apiClient.scan.scanBarcode.mutate(input);

    // Adapt BFF response { scan, product, isNewProduct } → ScanResult
    const product = result.product as Types.Product | null;
    return {
      product,
      halalStatus: product?.halalStatus ?? 'unknown',
      confidenceScore: product?.confidenceScore ?? 0,
      warnings: [],
      alternatives: [],
      certifierInfo: product?.certifierId
        ? {
            id: product.certifierId,
            name: product.certifierName ?? '',
            logo: product.certifierLogo ?? null,
            isVerified: true,
          }
        : null,
    };
  },

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
    const result = await apiClient.scan.getHistory.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
    });

    return {
      scans: (result.scans ?? []) as Types.ScanHistoryItem[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.scans?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async getRecentScans(
    limit: number = 10
  ): Promise<{ scans: Types.ScanHistoryItem[] }> {
    const result = await apiClient.scan.getHistory.query({ limit });
    return { scans: (result.scans ?? []) as Types.ScanHistoryItem[] };
  },

  async getScanStats(): Promise<Types.ScanStats> {
    return apiClient.scan.getStats.query() as Promise<Types.ScanStats>;
  },

  async submitAnalysisRequest(
    input: Types.AnalysisRequestInput
  ): Promise<{ id: string; status: string; message: string }> {
    const result = await apiClient.scan.requestAnalysis.mutate({
      barcode: input.barcode,
      productName: input.productName,
      brandName: input.brandName,
      photoUrls: input.photoUrls,
      notes: input.notes,
    });
    return {
      id: (result as any).id ?? '',
      status: 'pending',
      message: 'Analysis request submitted',
    };
  },

  async clearScanHistory(): Promise<Types.DeleteResponse> {
    // Not available in BFF — stub
    return { success: true, deletedCount: 0 };
  },
};

export default scanService;
