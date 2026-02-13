import { TRPCError } from "@trpc/server";

export const ErrorCode = {
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",

  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export function unauthorized(message = "Authentication required"): TRPCError {
  return new TRPCError({ code: "UNAUTHORIZED", message });
}

export function forbidden(message = "Access denied"): TRPCError {
  return new TRPCError({ code: "FORBIDDEN", message });
}

export function notFound(resource = "Resource"): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message: `${resource} not found`,
  });
}

export function badRequest(message: string): TRPCError {
  return new TRPCError({ code: "BAD_REQUEST", message });
}

export function conflict(message: string): TRPCError {
  return new TRPCError({ code: "CONFLICT", message });
}

export function internal(message = "Internal server error"): TRPCError {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
}

export function rateLimited(): TRPCError {
  return new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: "Too many requests. Please try again later.",
  });
}
