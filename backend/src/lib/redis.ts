import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
  enableReadyCheck: true,
  keepAlive: 30000,
});

redis.on("error", (err) => {
  logger.error("Erreur de connexion Redis (non-fatale)", { error: err.message });
});
