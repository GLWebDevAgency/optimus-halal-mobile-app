import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const halalStatusEnum = pgEnum("halal_status", [
  "halal",
  "haram",
  "doubtful",
  "unknown",
]);

export const products = pgTable(
  "products",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    barcode: t.varchar({ length: 50 }).notNull(),
    name: t.varchar({ length: 255 }).notNull(),
    brand: t.varchar({ length: 255 }),
    brandLogo: t.text("brand_logo"),
    category: t.varchar({ length: 100 }),
    categoryId: t.varchar("category_id", { length: 50 }),
    description: t.text(),
    imageUrl: t.text("image_url"),
    ingredients: t.text().array(),
    halalStatus: halalStatusEnum("halal_status").default("unknown").notNull(),
    confidenceScore: t.doublePrecision("confidence_score").default(0).notNull(),
    certifierId: t.varchar("certifier_id", { length: 50 }),
    certifierName: t.varchar("certifier_name", { length: 255 }),
    certifierLogo: t.text("certifier_logo"),
    nutritionFacts: t.jsonb("nutrition_facts"),
    price: t.doublePrecision(),
    currency: t.varchar({ length: 3 }).default("EUR"),
    inStock: t.boolean("in_stock").default(true),
    // OpenFoodFacts data blob (complete response for fallback)
    offData: t.jsonb("off_data"),
    lastSyncedAt: t.timestamp("last_synced_at", { withTimezone: true }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),

    // ── V2: IDENTITE PRODUIT ENRICHIE ────────────────────────
    genericName: t.varchar("generic_name", { length: 500 }),
    brandOwner: t.varchar("brand_owner", { length: 255 }),
    quantity: t.varchar({ length: 100 }),
    servingSize: t.varchar("serving_size", { length: 100 }),
    countriesTags: t.text("countries_tags").array(),

    // ── V2: INGREDIENTS & ALLERGENES (halal-critical) ────────
    ingredientsText: t.text("ingredients_text"),
    allergensTags: t.text("allergens_tags").array(),
    tracesTags: t.text("traces_tags").array(),
    additivesTags: t.text("additives_tags").array(),
    ingredientsAnalysisTags: t.text("ingredients_analysis_tags").array(),

    // ── V2: NUTRITION DENORMALISEE ───────────────────────────
    nutriscoreGrade: t.varchar("nutriscore_grade", { length: 1 }),
    novaGroup: t.smallint("nova_group"),
    ecoscoreGrade: t.varchar("ecoscore_grade", { length: 1 }),
    energyKcal100g: t.real("energy_kcal_100g"),
    fat100g: t.real("fat_100g"),
    saturatedFat100g: t.real("saturated_fat_100g"),
    carbohydrates100g: t.real("carbohydrates_100g"),
    sugars100g: t.real("sugars_100g"),
    fiber100g: t.real("fiber_100g"),
    proteins100g: t.real("proteins_100g"),
    salt100g: t.real("salt_100g"),

    // ── V2: LABELS & CERTIFICATIONS ─────────────────────────
    labelsTags: t.text("labels_tags").array(),
    embCodes: t.varchar("emb_codes", { length: 255 }),

    // ── V2: ORIGINE & TRACABILITE ───────────────────────────
    originsTags: t.text("origins_tags").array(),
    manufacturingPlaces: t.varchar("manufacturing_places", { length: 500 }),

    // ── V2: IMAGES MULTI-SOURCES ────────────────────────────
    imageIngredientsUrl: t.text("image_ingredients_url"),
    imageNutritionUrl: t.text("image_nutrition_url"),
    imageFrontUrl: t.text("image_front_url"),
    imageR2Key: t.varchar("image_r2_key", { length: 255 }),

    // ── V2: QUALITE & PROVENANCE ────────────────────────────
    completeness: t.real(),
    dataSources: t.text("data_sources").array().default([]),
    offLastModified: t.timestamp("off_last_modified", { withTimezone: true }),
    analysisVersion: t.smallint("analysis_version").default(1),
  },
  (table) => [
    // V1 indexes
    t.uniqueIndex("products_barcode_idx").on(table.barcode),
    t.index("products_halal_status_idx").on(table.halalStatus),
    t.index("products_category_idx").on(table.category),
    t.index("products_name_idx").on(table.name),
    // V2 indexes
    t.index("products_brand_idx").on(table.brand),
    t.index("products_completeness_idx").on(table.completeness),
    t.index("products_countries_gin_idx").using(
      "gin",
      table.countriesTags,
    ),
    t.index("products_labels_gin_idx").using(
      "gin",
      table.labelsTags,
    ),
    t.index("products_allergens_gin_idx").using(
      "gin",
      table.allergensTags,
    ),
    t.index("products_additives_gin_idx").using(
      "gin",
      table.additivesTags,
    ),
  ]
);

export const categories = pgTable("categories", {
  id: t.varchar({ length: 50 }).primaryKey(),
  name: t.varchar({ length: 100 }).notNull(),
  nameFr: t.varchar("name_fr", { length: 100 }),
  nameAr: t.varchar("name_ar", { length: 100 }),
  icon: t.varchar({ length: 50 }),
  parentId: t.varchar("parent_id", { length: 50 }),
  sortOrder: t.integer("sort_order").default(0),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
