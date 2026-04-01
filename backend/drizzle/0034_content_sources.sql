-- 0034: Content sources — monitored feeds for veille automation
-- Used by Claude Cowork scheduled task to detect new content
-- and generate draft alerts/articles.

DO $$ BEGIN
  CREATE TYPE content_source_type AS ENUM ('rss', 'website', 'instagram', 'tiktok', 'youtube');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_target AS ENUM ('alert', 'article', 'auto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "content_sources" (
  "id"               uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  "name"             varchar(100) NOT NULL,
  "url"              text         NOT NULL,
  "type"             content_source_type NOT NULL DEFAULT 'rss',
  "target_type"      content_target NOT NULL DEFAULT 'auto',
  "category_hint"    varchar(50),
  "is_active"        boolean      NOT NULL DEFAULT true,
  "last_fetched_at"  timestamptz,
  "last_item_date"   timestamptz,
  "last_fetch_count" integer      DEFAULT 0,
  "created_at"       timestamptz  DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "content_sources_active_idx"
  ON "content_sources" ("is_active");

-- Seed initial sources
INSERT INTO "content_sources" ("name", "url", "type", "target_type", "category_hint") VALUES
  ('Al-Kanz', 'https://www.al-kanz.org/feed/', 'rss', 'auto', NULL),
  ('AVS Actualites', 'https://www.avs.fr/', 'website', 'alert', 'certification'),
  ('Achahada', 'https://achahada.com/', 'website', 'alert', 'certification'),
  ('RappelConso Alim', 'https://rappel.conso.gouv.fr/', 'website', 'alert', 'community'),
  ('BDS France', 'https://www.bdsfrance.org/', 'website', 'alert', 'boycott')
ON CONFLICT DO NOTHING;
