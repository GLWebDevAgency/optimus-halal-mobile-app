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
    const result = await apiClient.report.createReport.mutate(input);
    return {
      id: (result as any).id ?? '',
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
    const result = await apiClient.report.getMyReports.query({
      limit: pagination?.limit ?? 20,
      cursor: undefined,
    });

    return {
      reports: (result.reports ?? []) as Types.Report[],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.reports?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async createReview(
    input: Types.CreateReviewInput
  ): Promise<{ id: string; message: string }> {
    const result = await apiClient.report.createReview.mutate(input);
    return {
      id: (result as any).id ?? '',
      message: 'Review submitted successfully',
    };
  },

  async getReviews(
    targetType: Types.TargetType,
    targetId: string,
    pagination?: Types.PaginationInput
  ): Promise<Types.ReviewsResponse> {
    // BFF splits reviews by target type
    const query =
      targetType === 'product'
        ? apiClient.report.getProductReviews
        : apiClient.report.getStoreReviews;

    const result = await query.query({
      id: targetId,
      limit: pagination?.limit ?? 20,
      cursor: undefined,
    });

    return {
      reviews: (result.reviews ?? []) as Types.Review[],
      averageRating: (result as any).averageRating ?? 0,
      totalReviews: (result as any).totalReviews ?? result.reviews?.length ?? 0,
      ratingDistribution: (result as any).ratingDistribution ?? {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 20,
        totalItems: result.reviews?.length ?? 0,
        totalPages: 1,
        hasNext: !!result.nextCursor,
      },
    };
  },

  async markReviewHelpful(reviewId: string): Promise<Types.SuccessResponse> {
    await apiClient.report.markHelpful.mutate({ reviewId });
    return { success: true };
  },
};

export default reportService;
