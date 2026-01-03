/**
 * Report Service - gRPC-Web Client
 * 
 * Handles user reports and feedback
 * Direct communication with Mobile-Service via gRPC-Web
 */

import { grpcClient } from './client';
import { SERVICES } from './types';
import type {
  CreateReportRequest,
  Report,
  GetReportsRequest,
  ReportsListResponse,
  GetReportRequest,
} from './types';
import { TIMEOUTS } from './config';

/**
 * Report Service client for React Native
 */
class ReportService {
  private readonly service = SERVICES.REPORT;

  /**
   * Create a new report (product issue, fake certification, etc.)
   */
  async createReport(request: CreateReportRequest): Promise<Report> {
    return grpcClient.unary<CreateReportRequest, Report>(
      this.service,
      'CreateReport',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get user's reports
   */
  async getReports(request: GetReportsRequest): Promise<ReportsListResponse> {
    return grpcClient.unary<GetReportsRequest, ReportsListResponse>(
      this.service,
      'GetReports',
      request,
      { timeout: TIMEOUTS.default }
    );
  }

  /**
   * Get single report details
   */
  async getReport(request: GetReportRequest): Promise<Report> {
    return grpcClient.unary<GetReportRequest, Report>(
      this.service,
      'GetReport',
      request,
      { timeout: TIMEOUTS.default }
    );
  }
}

export const reportService = new ReportService();
export default reportService;
