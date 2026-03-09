-- 0019: Additives V2 — vegetarian/vegan flags + data_source
-- Enables smarter halal inference: vegetarian additives → halal (no animal origin)
-- Nullable: NULL = unknown (distinct from false = confirmed non-vegetarian)

ALTER TABLE additives ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN;
ALTER TABLE additives ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN;
ALTER TABLE additives ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'naqiy';
