export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const;
