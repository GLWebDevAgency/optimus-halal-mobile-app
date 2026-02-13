/**
 * gRPC-Web Client for React Native
 * 
 * Enterprise-grade gRPC-Web client with:
 * - Automatic token refresh
 * - Retry with exponential backoff
 * - Request/response interceptors
 * - Timeout handling
 * - Error normalization
 * 
 * Architecture: React Native → gRPC-Web → Mobile-Service (Rust BFF)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGrpcConfig,
  STORAGE_KEYS,
  TIMEOUTS,
  RETRY_CONFIG,
  GrpcStatus,
  STATUS_MESSAGES,
} from './config';

export { GrpcStatus };

// ============================================
// TYPES
// ============================================

export interface GrpcError {
  code: GrpcStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface GrpcMetadata {
  authorization?: string;
  'x-request-id'?: string;
  'x-device-id'?: string;
  [key: string]: string | undefined;
}

export interface CallOptions {
  timeout?: number;
  metadata?: GrpcMetadata;
  retryEnabled?: boolean;
}

// ============================================
// ERROR HANDLING
// ============================================

export class GrpcApiError extends Error {
  code: GrpcStatus;
  details?: Record<string, unknown>;

  constructor(code: GrpcStatus, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'GrpcApiError';
    this.code = code;
    this.details = details;
  }

  static fromCode(code: GrpcStatus, details?: Record<string, unknown>): GrpcApiError {
    return new GrpcApiError(code, STATUS_MESSAGES[code] || 'Unknown error', details);
  }

  static unauthenticated(): GrpcApiError {
    return new GrpcApiError(GrpcStatus.UNAUTHENTICATED, 'Please log in to continue');
  }

  static timeout(): GrpcApiError {
    return new GrpcApiError(GrpcStatus.DEADLINE_EXCEEDED, 'Request timed out');
  }

  static network(): GrpcApiError {
    return new GrpcApiError(GrpcStatus.UNAVAILABLE, 'Network error. Please check your connection.');
  }

  get isRetryable(): boolean {
    return [
      GrpcStatus.UNAVAILABLE,
      GrpcStatus.RESOURCE_EXHAUSTED,
      GrpcStatus.ABORTED,
      GrpcStatus.DEADLINE_EXCEEDED,
    ].includes(this.code);
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshCallback: (() => Promise<{ accessToken: string; refreshToken: string } | null>) | null = null;

  async initialize(): Promise<void> {
    try {
      const [access, refresh] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      this.accessToken = access;
      this.refreshToken = refresh;
    } catch (error) {
      console.error('[TokenManager] Failed to initialize:', error);
    }
  }

  async setTokens(access: string, refresh: string): Promise<void> {
    this.accessToken = access;
    this.refreshToken = refresh;
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
    ]);
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshCallback(callback: () => Promise<{ accessToken: string; refreshToken: string } | null>): void {
    this.refreshCallback = callback;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || !this.refreshCallback) {
      return false;
    }

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const result = await this.refreshCallback!();
      if (result) {
        await this.setTokens(result.accessToken, result.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[TokenManager] Refresh failed:', error);
      await this.clearTokens();
      return false;
    }
  }
}

export const tokenManager = new TokenManager();

// ============================================
// GRPC-WEB CLIENT
// ============================================

/**
 * Base gRPC-Web client for React Native
 * 
 * Uses fetch-based transport compatible with React Native
 * Supports gRPC-Web protocol (application/grpc-web+proto)
 */
export class GrpcWebClient {
  private baseUrl: string;

  constructor() {
    const config = getGrpcConfig();
    this.baseUrl = config.host;
  }

  /**
   * Make a unary RPC call
   */
  async unary<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    options: CallOptions = {}
  ): Promise<TResponse> {
    const timeout = options.timeout || TIMEOUTS.default;
    const metadata = await this.buildMetadata(options.metadata);

    let lastError: GrpcApiError | null = null;
    const maxRetries = options.retryEnabled !== false ? RETRY_CONFIG.maxRetries : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.backoff(attempt);
        }

        const response = await this.doCall<TRequest, TResponse>(
          service,
          method,
          request,
          metadata,
          timeout
        );

        return response;
      } catch (error) {
        lastError = error instanceof GrpcApiError ? error : GrpcApiError.network();

        // Handle unauthenticated - try token refresh
        if (lastError.code === GrpcStatus.UNAUTHENTICATED && attempt === 0) {
          const refreshed = await tokenManager.refreshAccessToken();
          if (refreshed) {
            // Update metadata with new token
            const newMetadata = await this.buildMetadata(options.metadata);
            Object.assign(metadata, newMetadata);
            continue;
          }
        }

        // Don't retry if not retryable
        if (!lastError.isRetryable) {
          throw lastError;
        }
      }
    }

    throw lastError || GrpcApiError.network();
  }

  /**
   * Build request metadata with auth token
   */
  private async buildMetadata(custom?: GrpcMetadata): Promise<GrpcMetadata> {
    const metadata: GrpcMetadata = {
      'x-request-id': this.generateRequestId(),
      ...custom,
    };

    const token = tokenManager.getAccessToken();
    if (token) {
      metadata.authorization = `Bearer ${token}`;
    }

    return metadata;
  }

  /**
   * Execute the actual gRPC-Web call
   */
  private async doCall<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    metadata: GrpcMetadata,
    timeout: number
  ): Promise<TResponse> {
    const url = `${this.baseUrl}/${service}/${method}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // For gRPC-Web, we need to encode the protobuf message
      // In production, use protobuf.js or @bufbuild/protobuf
      // For now, we'll use JSON transport (requires server support)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+json',
          'Accept': 'application/grpc-web+json',
          'X-Grpc-Web': '1',
          ...Object.entries(metadata)
            .filter(([_, v]) => v !== undefined)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for gRPC status in response headers
      const grpcStatus = response.headers.get('grpc-status');
      if (grpcStatus && parseInt(grpcStatus) !== GrpcStatus.OK) {
        const grpcMessage = response.headers.get('grpc-message') || '';
        throw new GrpcApiError(
          parseInt(grpcStatus) as GrpcStatus,
          decodeURIComponent(grpcMessage)
        );
      }

      if (!response.ok) {
        throw GrpcApiError.fromCode(GrpcStatus.INTERNAL);
      }

      const data = await response.json();
      return data as TResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GrpcApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw GrpcApiError.timeout();
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw GrpcApiError.network();
        }
      }

      throw new GrpcApiError(GrpcStatus.UNKNOWN, 'An unexpected error occurred');
    }
  }

  /**
   * Exponential backoff with jitter
   */
  private async backoff(attempt: number): Promise<void> {
    const { initialBackoff, maxBackoff, multiplier, jitterFactor } = RETRY_CONFIG;
    const baseDelay = Math.min(initialBackoff * Math.pow(multiplier, attempt - 1), maxBackoff);
    const jitter = baseDelay * jitterFactor * Math.random();
    const delay = baseDelay + jitter;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const grpcClient = new GrpcWebClient();
