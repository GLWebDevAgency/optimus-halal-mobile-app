-- Migration 0021: Add data quality flag for nutrient validation
-- Enables the "I don't know" pattern: unreliable products return score=null
-- instead of potentially misleading scores from corrupt OFF data.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS data_quality_flag VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_quality_reasons TEXT[] DEFAULT NULL;

-- Index for dashboard queries: find all unreliable products for manual review
CREATE INDEX IF NOT EXISTS products_data_quality_flag_idx
  ON products (data_quality_flag)
  WHERE data_quality_flag IS NOT NULL;

COMMENT ON COLUMN products.data_quality_flag IS 'Nutrient data quality: NULL=not assessed, valid=passed checks, suspicious=minor issues, unreliable=critical anomaly (force score=null)';
COMMENT ON COLUMN products.data_quality_reasons IS 'Array of reasons for the data quality flag (e.g. calorie_formula_mismatch, fat_satfat_inconsistency)';
