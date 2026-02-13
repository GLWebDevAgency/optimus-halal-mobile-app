/**
 * Report Service — Mobile BFF adapter
 *
 * BFF routes: report.createReport, report.getMyReports,
 *             report.createReview, report.getProductReviews,
 *             report.getStoreReviews, report.markHelpful
 */

import { apiClient } from './client';
import type * as Types from './types';

export const reportService = {
  async createReport(
    input: Types.CreateReportInput
  ): Promise<{ id: string; status: string; message: string }> {
    // Backend expects `type` + `photoUrls`, frontend type uses `reportType` + `evidenceUrls`
    const result = await apiClient.report.createReport.mutate({
      type: input.reportType as "incorrect_halal_status" | "wrong_ingredients" | "missing_product" | "store_issue" | "other",
      title: input.title,
      description: input.description,
      productId: input.productId,
      storeId: input.storeId,
      photoUrls: input.evidenceUrls,
    });
    return {
      id: result.id ?? '',
      status: 'pending',
      message: 'Report submitted successfully',
    };
  },

  async getMyReports(
    pagination?: Types.PaginationInput,
    status?: Types.ReportStatus
  ): Promise<{
    reports: Types.Report[];
    pagination: Types.PaginationOutput;
  }> {
    // Backend uses offset, not cursor; returns array directly
    const result = await apiClient.report.getMyReports.query({
      limit: pagination?.limit ?? 20,
      offset: 0,
    });

    return {
      reports: (result ?? []) as unknown as Types.Report[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result?.length ?? 0,
        totalPages: 1,
        hasNext: (result?.length ?? 0) >= (pagination?.limit ?? 20),
      },
    };
  },

  async createReview(
    input: Types.CreateReviewInput
  ): Promise<{ id: string; message: string }> {
    const result = await apiClient.report.createReview.mutate({
      productId: input.targetType === 'product' ? input.targetId : undefined,
      storeId: input.targetType === 'store' ? input.targetId : undefined,
      rating: input.rating,
      comment: input.content,
      photoUrls: input.photoUrls,
    });
    return {
      id: result.id ?? '',
      message: 'Review submitted successfully',
    };
  },

  async getReviews(
    targetType: Types.TargetType,
    targetId: string,
    pagination?: Types.PaginationInput
  ): Promise<Types.ReviewsResponse> {
    // Backend uses productId/storeId (not `id`), offset (not cursor), returns array
    const result = targetType === 'product'
      ? await apiClient.report.getProductReviews.query({
          productId: targetId,
          limit: pagination?.limit ?? 20,
          offset: 0,
        })
      : await apiClient.report.getStoreReviews.query({
          storeId: targetId,
          limit: pagination?.limit ?? 20,
          offset: 0,
        });

    const items = result ?? [];

    return {
      reviews: items as unknown as Types.Review[],
      averageRating: 0,
      totalReviews: items.length,
      ratingDistribution: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: items.length,
        totalPages: 1,
        hasNext: items.length >= (pagination?.limit ?? 20),
      },
    };
  },

  async markReviewHelpful(reviewId: string): Promise<Types.SuccessResponse> {
    await apiClient.report.markHelpful.mutate({ reviewId });
    return { success: true };
  },
};

export default reportService;
