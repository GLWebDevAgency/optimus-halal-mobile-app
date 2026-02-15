import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

// Clean all tables before each test file
beforeEach(async () => {
  await db.execute(sql`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
});

afterAll(async () => {
  await db.$client.end({ timeout: 5 });
});
