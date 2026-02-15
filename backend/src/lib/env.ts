import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default("noreply-optimus-halal@optimus-os.fr"),
  BREVO_SENDER_NAME: z.string().default("Optimus Halal"),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  OPENFOODFACTS_API_URL: z
    .string()
    .url()
    .default("https://world.openfoodfacts.org/api/v2"),
  CORS_ORIGINS: z
    .string()
    .default("*")
    .describe("Comma-separated allowed origins, or * for all"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // In test mode, use test defaults — no real env needed
  if (process.env.VITEST) {
    const testEnv = {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/optimus_test",
      REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
      JWT_SECRET: "test-secret-at-least-32-chars-long-for-vitest",
      JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-chars-long",
      JWT_ACCESS_EXPIRY: "15m",
      JWT_REFRESH_EXPIRY: "7d",
      PORT: 0,
      NODE_ENV: "test",
      CORS_ORIGINS: "*",
      ...process.env,
    };
    return envSchema.parse(testEnv);
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      msg: "Variables d'environnement invalides",
      errors: result.error.flatten().fieldErrors,
    }));
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
