-- Enum pour les rôles administrateurs
DO $$ BEGIN
  CREATE TYPE "admin_role" AS ENUM ('admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "admin_role" NOT NULL DEFAULT 'admin',
  "granted_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "admins_user_id_unique" UNIQUE ("user_id")
);

CREATE INDEX IF NOT EXISTS "admins_user_id_idx" ON "admins" ("user_id");
