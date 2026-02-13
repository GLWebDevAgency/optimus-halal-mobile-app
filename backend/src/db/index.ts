import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import { env } from "../lib/env.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: true,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
