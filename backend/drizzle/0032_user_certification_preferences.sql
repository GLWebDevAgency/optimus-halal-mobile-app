-- 0032: Add certification_preferences to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "certification_preferences" text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "users_cert_prefs_idx"
  ON "users" USING GIN ("certification_preferences");
