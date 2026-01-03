/**
 * gRPC-Web Configuration
 * 
 * Configuration for connecting to Mobile-Service via gRPC-Web
 * Architecture: React Native → gRPC-Web → Mobile-Service (Rust BFF)
 */

// Environment-specific endpoints
export const GRPC_CONFIG = {
  // Development - Local mobile-service
  development: {
    host: 'http://localhost:8091',
    useTls: false,
  },
  // Staging - Railway staging environment
  staging: {
    host: 'https://mobile-service-staging.up.railway.app',
    useTls: true,
  },
  // Production - Railway production (gRPC-Web over HTTPS)
  production: {
    host: 'https://mobile-service-production.up.railway.app',
    useTls: true,
  },
} as const;

// Current environment
export const CURRENT_ENV = __DEV__ ? 'development' : 'production';

// Get current config
export const getGrpcConfig = () => GRPC_CONFIG[CURRENT_ENV];

// Timeout configuration
export const TIMEOUTS = {
  /** Default RPC timeout in milliseconds */
  default: 30_000,
  /** Timeout for auth operations */
  auth: 15_000,
  /** Timeout for scan operations (needs to be fast) */
  scan: 10_000,
  /** Timeout for upload operations */
  upload: 60_000,
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  /** Maximum number of retries */
  maxRetries: 3,
  /** Initial backoff delay in ms */
  initialBackoff: 1000,
  /** Maximum backoff delay in ms */
  maxBackoff: 10_000,
  /** Backoff multiplier */
  multiplier: 2,
  /** Jitter factor (0-1) */
  jitterFactor: 0.2,
} as const;

// Storage keys for tokens
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@optimus/access_token',
  REFRESH_TOKEN: '@optimus/refresh_token',
  USER_ID: '@optimus/user_id',
} as const;

// gRPC status codes
export enum GrpcStatus {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
  UNAUTHENTICATED = 16,
}

// Map gRPC status to user-friendly messages
export const STATUS_MESSAGES: Record<GrpcStatus, string> = {
  [GrpcStatus.OK]: 'Success',
  [GrpcStatus.CANCELLED]: 'Request was cancelled',
  [GrpcStatus.UNKNOWN]: 'An unknown error occurred',
  [GrpcStatus.INVALID_ARGUMENT]: 'Invalid request data',
  [GrpcStatus.DEADLINE_EXCEEDED]: 'Request timed out',
  [GrpcStatus.NOT_FOUND]: 'Resource not found',
  [GrpcStatus.ALREADY_EXISTS]: 'Resource already exists',
  [GrpcStatus.PERMISSION_DENIED]: 'Permission denied',
  [GrpcStatus.RESOURCE_EXHAUSTED]: 'Too many requests',
  [GrpcStatus.FAILED_PRECONDITION]: 'Operation cannot be performed',
  [GrpcStatus.ABORTED]: 'Operation was aborted',
  [GrpcStatus.OUT_OF_RANGE]: 'Value out of range',
  [GrpcStatus.UNIMPLEMENTED]: 'Feature not implemented',
  [GrpcStatus.INTERNAL]: 'Internal server error',
  [GrpcStatus.UNAVAILABLE]: 'Service unavailable',
  [GrpcStatus.DATA_LOSS]: 'Data loss occurred',
  [GrpcStatus.UNAUTHENTICATED]: 'Authentication required',
};
