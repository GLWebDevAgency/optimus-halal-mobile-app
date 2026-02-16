import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import { env } from "../lib/env.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20, // Must be < PgBouncer server_idle_timeout (600s)
  connect_timeout: 10,
  prepare: false, // Required for PgBouncer transaction pooling
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
