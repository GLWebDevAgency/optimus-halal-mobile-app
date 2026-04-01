-- 0036: Store all RappelConso fields for complete recall display
-- Adds lot identification, sale dates, conservation, compensation, legal nature, contact

ALTER TABLE "product_recalls"
  ADD COLUMN IF NOT EXISTS "lot_identification" text,
  ADD COLUMN IF NOT EXISTS "sale_start_date" varchar(20),
  ADD COLUMN IF NOT EXISTS "sale_end_date" varchar(20),
  ADD COLUMN IF NOT EXISTS "temperature_storage" text,
  ADD COLUMN IF NOT EXISTS "compensation" varchar(255),
  ADD COLUMN IF NOT EXISTS "legal_nature" varchar(255),
  ADD COLUMN IF NOT EXISTS "contact_number" varchar(50);
