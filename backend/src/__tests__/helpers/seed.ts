import { db } from "../../db/index.js";
import { users, articles, products, scans } from "../../db/schema/index.js";
import { hashPassword } from "../../services/auth.service.js";

export const TEST_USER = {
  email: "test@naqiy.fr",
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

export async function seedArticles(count = 5) {
  const items = Array.from({ length: count }, (_, i) => ({
    title: `Article ${i + 1}`,
    slug: `article-${i + 1}`,
    excerpt: `Excerpt for article ${i + 1}`,
    content: `Full content of article ${i + 1}`,
    type: "blog" as const,
    isPublished: true,
    publishedAt: new Date(Date.now() - i * 86_400_000),
  }));

  return db.insert(articles).values(items).returning();
}

export async function seedProductAndScan(userId: string) {
  const [product] = await db
    .insert(products)
    .values({
      barcode: "3760020507350",
      name: "Test Product",
      brand: "Test Brand",
      halalStatus: "halal",
      confidenceScore: 95,
      ingredients: ["water", "sugar"],
    })
    .returning();

  const [scan] = await db
    .insert(scans)
    .values({
      userId,
      productId: product.id,
      barcode: product.barcode,
      halalStatus: "halal",
      confidenceScore: 95,
    })
    .returning();

  return { product, scan };
}
