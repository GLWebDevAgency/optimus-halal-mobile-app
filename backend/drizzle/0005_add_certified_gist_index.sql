-- Partial GiST index for certified active stores (optimizes store.nearby with halalCertifiedOnly)
CREATE INDEX IF NOT EXISTS "stores_active_certified_location_gist_idx"
ON "stores" USING GIST ("location")
WHERE is_active = true AND halal_certified = true;

-- Composite index for rating-based sorting
CREATE INDEX IF NOT EXISTS "stores_active_rating_idx"
ON "stores" (average_rating DESC, review_count DESC)
WHERE is_active = true;
