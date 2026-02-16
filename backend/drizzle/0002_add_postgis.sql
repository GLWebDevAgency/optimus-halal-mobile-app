-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);

-- Backfill from existing latitude/longitude
UPDATE "stores"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "location" IS NULL;

-- Create GiST index for fast spatial queries
CREATE INDEX IF NOT EXISTS "stores_location_gist_idx" ON "stores" USING GIST ("location");

-- Trigger to auto-sync location from lat/long on INSERT/UPDATE
CREATE OR REPLACE FUNCTION sync_store_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stores_location_sync ON "stores";
CREATE TRIGGER stores_location_sync
BEFORE INSERT OR UPDATE OF latitude, longitude ON "stores"
FOR EACH ROW
EXECUTE FUNCTION sync_store_location();
