/**
 * Admin seed — ensures the initial super_admin exists.
 *
 * Reads ADMIN_EMAIL from environment. Finds the matching user
 * and inserts into admins table with role=super_admin.
 * Idempotent (ON CONFLICT DO NOTHING).
 *
 * Called from entrypoint.ts after reference data seeding.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";

export async function seedAdmin(db: PostgresJsDatabase): Promise<number> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("    Admin: ADMIN_EMAIL not set, skipping");
    return 0;
  }

  // Find user by email
  const [user] = await db.execute(sql`
    SELECT id FROM users WHERE LOWER(email) = LOWER(${adminEmail}) LIMIT 1
  `);

  if (!user) {
    console.log(`    Admin: user ${adminEmail} not found in DB, skipping`);
    return 0;
  }

  const userId = user.id as string;

  // Upsert admin with super_admin role
  const result = await db.execute(sql`
    INSERT INTO admins (user_id, role)
    VALUES (${userId}, 'super_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'
    RETURNING id
  `);

  return result.length;
}
