-- 0015: Add PostGIS GiST index on stores.location for efficient spatial queries
-- Without this index, ST_DWithin() performs a sequential scan O(n)
-- With GiST index: O(log n) — critical for store.nearby endpoint at scale

CREATE INDEX IF NOT EXISTS stores_location_gist_idx ON stores USING GIST(location);
