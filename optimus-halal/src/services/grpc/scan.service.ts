/**
 * Scan Service - gRPC-Web Client
 * 
 * Handles product barcode scanning and halal verification
 * Core feature of the Optimus Halal app
 */

import { grpcClient } from './client';
import { SERVICES, TIMEOUTS } from './config';
import type {
  ScanProductRequest,
  ScanResult,
  ProductDetails,
  ProductSummary,
  Pagination,
  PaginatedResponse,
} from './types';

// Additional scan-specific types
export interface ScanHistoryRequest {
  userId: string;
  pagination?: Pagination;
}

export interface ScanHistoryResponse {
  scans: ScanHistoryItem[];
  pagination: PaginatedResponse;
}

export interface ScanHistoryItem {
  id: string;
  productId: string;
  product: ProductSummary;
  scannedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
}

export interface SearchProductsRequest {
  query: string;
  category?: string;
  halalOnly?: boolean;
  pagination?: Pagination;
}

export interface SearchProductsResponse {
  products: ProductSummary[];
  pagination: PaginatedResponse;
}

export interface GetProductRequest {
  productId: string;
}

export interface ReportMissingProductRequest {
  barcode: string;
  userId: string;
  suggestedName?: string;
  suggestedBrand?: string;
  imageUrl?: string;
}

/**
 * Scan Service client for React Native
 * 
 * Usage:
 * ```typescript
 * import { scanService } from '@/services/grpc';
 * 
 * // Scan a product barcode
 * const result = await scanService.scanProduct({
 *   barcode: '3017620422003',
 *   userId: currentUser.id,
 * });
 * 
 * if (result.product) {
 *   console.log('Product:', result.product.name);
 *   console.log('Halal Status:', result.halalStatus);
 *   console.log('Confidence:', result.confidence);
 * }
 * ```
 */
class ScanService {
  private readonly service = SERVICES.SCAN;

  /**
   * Scan a product barcode
   * 
   * This is the main scanning feature of the app.
   * Returns product details, halal status, certifications, and alternatives.
   * 
   * @param request - Barcode and optional location data
   * @returns Scan result with product info and halal verification
   */
  async scanProduct(request: ScanProductRequest): Promise<ScanResult> {
    return grpcClient.unary<ScanProductRequest, ScanResult>(
      this.service,
      'ScanProduct',
      request,
      { 
        timeout: TIMEOUTS.scan,
        retryEnabled: true, // Important: retry for scan operations
      }
    );
  }

  /**
   * Get product details by ID
   */
  async getProduct(request: GetProductRequest): Promise<ProductDetails> {
    return grpcClient.unary<GetProductRequest, ProductDetails>(
      this.service,
      'GetProduct',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Search products by name, brand, or category
   */
  async searchProducts(request: SearchProductsRequest): Promise<SearchProductsResponse> {
    return grpcClient.unary<SearchProductsRequest, SearchProductsResponse>(
      this.service,
      'SearchProducts',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get user's scan history
   */
  async getScanHistory(request: ScanHistoryRequest): Promise<ScanHistoryResponse> {
    return grpcClient.unary<ScanHistoryRequest, ScanHistoryResponse>(
      this.service,
      'GetScanHistory',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Report a missing product (not found in database)
   */
  async reportMissingProduct(request: ReportMissingProductRequest): Promise<void> {
    await grpcClient.unary<ReportMissingProductRequest, Record<string, never>>(
      this.service,
      'ReportMissingProduct',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Quick check if a barcode exists in the database
   * Faster than full scan when you just need to check
   */
  async checkBarcode(barcode: string): Promise<boolean> {
    try {
      const result = await grpcClient.unary<{ barcode: string }, { exists: boolean }>(
        this.service,
        'CheckBarcode',
        { barcode },
        { timeout: 5000, retryEnabled: false }
      );
      return result.exists;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const scanService = new ScanService();
