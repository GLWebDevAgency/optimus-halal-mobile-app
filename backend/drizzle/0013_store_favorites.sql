-- Store Favorites table
CREATE TABLE IF NOT EXISTS "store_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_store_id_stores_id_fk"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "store_favorites_user_store_idx" ON "store_favorites" USING btree ("user_id", "store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_favorites_user_idx" ON "store_favorites" USING btree ("user_id");
