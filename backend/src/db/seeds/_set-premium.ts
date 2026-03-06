/**
 * One-off script: Set a user's subscriptionTier to "premium" manually.
 *
 * Usage: npx tsx src/db/seeds/_set-premium.ts
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users } from "../schema/users.js";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:6432/optimus_halal";

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(sql);

async function main() {
  // Find the user "Mehdi" (adjust email/name if needed)
  const allUsers = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName, subscriptionTier: users.subscriptionTier })
    .from(users)
    .limit(10);

  console.log("Users found:", allUsers.length);
  for (const u of allUsers) {
    console.log(`  - ${u.displayName} (${u.email}) → tier: ${u.subscriptionTier}`);
  }

  // Update ALL users to premium for now (since there's likely only the dev user)
  // If you want to target a specific user, filter by email
  const target = allUsers[0];
  if (!target) {
    console.log("No users found!");
    await sql.end();
    return;
  }

  console.log(`\nUpgrading "${target.displayName}" to premium...`);

  const [updated] = await db
    .update(users)
    .set({
      subscriptionTier: "premium",
      subscriptionProvider: "manual",
      subscriptionExpiresAt: new Date("2027-12-31T23:59:59Z"), // Far future
    })
    .where(eq(users.id, target.id))
    .returning({
      id: users.id,
      displayName: users.displayName,
      subscriptionTier: users.subscriptionTier,
      subscriptionProvider: users.subscriptionProvider,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
    });

  console.log("✓ Updated:", updated);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
