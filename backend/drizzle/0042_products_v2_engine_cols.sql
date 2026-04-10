-- Migration: 0042_products_v2_engine_cols.sql
-- Halal Engine V2 — Add 8 new nullable columns to products table.
-- All columns are nullable with no DEFAULT for zero-downtime ADD COLUMN on 817K rows.

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categories_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "food_groups_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "states_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packaging_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gemini_extract" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gemini_extract_hash" varchar(64);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "halal_engine_version" varchar(30);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "halal_track" varchar(15);
