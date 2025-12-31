/**
 * Report Service - Enterprise-grade Mobile App
 * 
 * Reports and reviews management service
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { apiClient } from './client';
import type * as Types from './types';

// ============================================
// REPORT SERVICE
// ============================================

export const reportService = {
  /**
   * Create a report
   */
  async createReport(input: Types.CreateReportInput): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    return apiClient.mobile.createReport.mutate(input);
  },

  /**
   * Get my reports
   */
  async getMyReports(
    pagination?: Types.PaginationInput,
    status?: Types.ReportStatus
  ): Promise<{
    reports: Types.Report[];
    pagination: Types.PaginationOutput;
  }> {
    return apiClient.mobile.getMyReports.query({
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      status,
    });
  },

  /**
   * Create a review
   */
  async createReview(input: Types.CreateReviewInput): Promise<{
    id: string;
    message: string;
  }> {
    return apiClient.mobile.createReview.mutate(input);
  },

  /**
   * Get reviews for a target (product or store)
   */
  async getReviews(
    targetType: Types.TargetType,
    targetId: string,
    pagination?: Types.PaginationInput
  ): Promise<Types.ReviewsResponse> {
    return apiClient.mobile.getReviews.query({
      targetType,
      targetId,
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
    });
  },

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<Types.SuccessResponse> {
    return apiClient.mobile.markReviewHelpful.mutate({ reviewId });
  },
};

export default reportService;
