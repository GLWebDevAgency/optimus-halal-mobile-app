import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { hashPassword } from "../../services/auth.service.js";

export const TEST_USER = {
  email: "test@optimus.fr",
  password: "Password123!",
  displayName: "Test User",
};

export async function seedTestUser() {
  const passwordHash = await hashPassword(TEST_USER.password);
  const [user] = await db
    .insert(users)
    .values({
      email: TEST_USER.email,
      passwordHash,
      displayName: TEST_USER.displayName,
    })
    .returning();
  return user;
}
