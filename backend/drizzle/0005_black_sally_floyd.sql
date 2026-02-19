ALTER TABLE "users" ADD COLUMN "streak_freeze_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak_freeze_last_used" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_active_certified_location_gist_idx" ON "stores" USING GIST ("location") WHERE is_active = true AND halal_certified = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_active_rating_idx" ON "stores" (average_rating DESC, review_count DESC) WHERE is_active = true;