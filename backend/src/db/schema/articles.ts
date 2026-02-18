import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const articleTypeEnum = pgEnum("article_type", [
  "blog",
  "partner_news",
  "educational",
  "community",
]);

export const articles = pgTable(
  "articles",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    title: t.varchar({ length: 255 }).notNull(),
    slug: t.varchar({ length: 255 }).unique().notNull(),
    coverImage: t.text("cover_image"),
    excerpt: t.text(),
    content: t.text(),
    author: t.varchar({ length: 100 }).default("Optimus Team").notNull(),
    type: articleTypeEnum().default("blog").notNull(),
    tags: t.text().array().default([]),
    readTimeMinutes: t.integer("read_time_minutes").default(3),
    externalLink: t.text("external_link"),
    isPublished: t.boolean("is_published").default(false).notNull(),
    publishedAt: t
      .timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("articles_published_at_idx").on(table.publishedAt),
    t.index("articles_type_idx").on(table.type),
    t.index("articles_is_published_idx").on(table.isPublished),
  ]
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
