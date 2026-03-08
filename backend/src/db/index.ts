import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import { env } from "../lib/env.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 15, // Safe under PgBouncer default_pool_size (20), leaves headroom for migrations
  idle_timeout: 20, // Must be < PgBouncer server_idle_timeout (600s)
  max_lifetime: 60 * 30, // Recycle connections every 30min to avoid stale PgBouncer slots
  connect_timeout: 10,
  prepare: false, // Required for PgBouncer transaction pooling
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
