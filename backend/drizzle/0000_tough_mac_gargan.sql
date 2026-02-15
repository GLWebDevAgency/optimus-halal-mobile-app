CREATE TYPE "public"."alert_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."boycott_level" AS ENUM('official_bds', 'grassroots', 'pressure', 'community');--> statement-breakpoint
CREATE TYPE "public"."halal_strictness" AS ENUM('relaxed', 'moderate', 'strict', 'very_strict');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('fr', 'en', 'ar');--> statement-breakpoint
CREATE TYPE "public"."halal_status" AS ENUM('halal', 'haram', 'doubtful', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'in_review', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."certifier" AS ENUM('avs', 'achahada', 'argml', 'mosquee_de_paris', 'mosquee_de_lyon', 'other', 'none');--> statement-breakpoint
CREATE TYPE "public"."store_type" AS ENUM('supermarket', 'butcher', 'restaurant', 'bakery', 'abattoir', 'wholesaler', 'online', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('alert', 'promotion', 'scan_result', 'reward', 'community', 'system');--> statement-breakpoint
CREATE TYPE "public"."point_action" AS ENUM('scan', 'review', 'report', 'referral', 'streak_bonus', 'daily_login', 'achievement', 'redemption');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('available', 'claimed', 'expired', 'used');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'resolved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('incorrect_halal_status', 'wrong_ingredients', 'missing_product', 'store_issue', 'other');--> statement-breakpoint
CREATE TABLE "alert_categories" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_ar" varchar(100),
	"icon" varchar(50),
	"color" varchar(7)
);
--> statement-breakpoint
CREATE TABLE "alert_read_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alert_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"severity" "alert_severity" DEFAULT 'info' NOT NULL,
	"priority" "alert_priority" DEFAULT 'medium' NOT NULL,
	"category_id" varchar(50),
	"image_url" text,
	"product_id" uuid,
	"store_id" uuid,
	"source_url" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boycott_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"brands" text[] NOT NULL,
	"parent_company" varchar(255),
	"sector" varchar(100),
	"logo_url" text,
	"boycott_level" "boycott_level" NOT NULL,
	"severity" varchar(20) DEFAULT 'warning' NOT NULL,
	"reason" text NOT NULL,
	"reason_summary" varchar(500),
	"source_url" text,
	"source_name" varchar(100),
	"barcode_prefix" text[],
	"off_brand_tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "certifiers" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"website" text,
	"creation_year" integer,
	"controllers_are_employees" boolean,
	"controllers_present_each_production" boolean,
	"has_salaried_slaughterers" boolean,
	"accepts_mechanical_slaughter" boolean,
	"accepts_electronarcosis" boolean,
	"accepts_post_slaughter_electrocution" boolean,
	"accepts_stunning" boolean,
	"halal_assessment" boolean DEFAULT false NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"notes" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"folder_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(50),
	"address_type" varchar(20) DEFAULT 'home' NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"street" text NOT NULL,
	"street_number" varchar(20),
	"apartment" varchar(50),
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(10) NOT NULL,
	"country" varchar(50) DEFAULT 'France' NOT NULL,
	"instructions" text,
	"latitude" double precision,
	"longitude" double precision,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"device_id" varchar(255),
	"device_name" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"avatar_url" text,
	"bio" text,
	"city" varchar(100),
	"preferred_language" "language" DEFAULT 'fr' NOT NULL,
	"halal_strictness" "halal_strictness" DEFAULT 'moderate' NOT NULL,
	"dietary_restrictions" text[],
	"allergens" text[],
	"level" integer DEFAULT 1 NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"total_scans" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_scan_date" timestamp with time zone,
	"notification_enabled" boolean DEFAULT true NOT NULL,
	"biometric_enabled" boolean DEFAULT false NOT NULL,
	"dark_mode" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_ar" varchar(100),
	"icon" varchar(50),
	"parent_id" varchar(50),
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barcode" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"brand_logo" text,
	"category" varchar(100),
	"category_id" varchar(50),
	"description" text,
	"image_url" text,
	"ingredients" text[],
	"halal_status" "halal_status" DEFAULT 'unknown' NOT NULL,
	"confidence_score" double precision DEFAULT 0 NOT NULL,
	"certifier_id" varchar(50),
	"certifier_name" varchar(255),
	"certifier_logo" text,
	"nutrition_facts" jsonb,
	"price" double precision,
	"currency" varchar(3) DEFAULT 'EUR',
	"in_stock" boolean DEFAULT true,
	"off_data" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"barcode" varchar(50) NOT NULL,
	"product_name" varchar(255),
	"brand_name" varchar(255),
	"photo_urls" text[],
	"notes" text,
	"status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"barcode" varchar(50) NOT NULL,
	"halal_status" varchar(20),
	"confidence_score" double precision,
	"latitude" double precision,
	"longitude" double precision,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" varchar(5),
	"close_time" varchar(5),
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"store_type" "store_type" DEFAULT 'other' NOT NULL,
	"image_url" text,
	"logo_url" text,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(10),
	"country" varchar(50) DEFAULT 'France' NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"website" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"halal_certified" boolean DEFAULT false NOT NULL,
	"certifier" "certifier" DEFAULT 'none' NOT NULL,
	"certifier_name" varchar(255),
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_id" varchar(100),
	"source_type" varchar(50),
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"promotions_enabled" boolean DEFAULT true NOT NULL,
	"scan_results_enabled" boolean DEFAULT true NOT NULL,
	"rewards_enabled" boolean DEFAULT true NOT NULL,
	"community_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'system' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"image_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(10) NOT NULL,
	"device_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_ar" varchar(100),
	"description" text,
	"description_fr" text,
	"icon" varchar(50),
	"points_reward" integer DEFAULT 0 NOT NULL,
	"requirement" jsonb,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "point_action" NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_fr" varchar(255),
	"name_ar" varchar(255),
	"description" text,
	"description_fr" text,
	"image_url" text,
	"points_cost" integer NOT NULL,
	"category" varchar(50),
	"partner_id" uuid,
	"partner_name" varchar(255),
	"total_quantity" integer,
	"remaining_quantity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" varchar(50) NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"status" "reward_status" DEFAULT 'claimed' NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"redemption_code" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "report_type" NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"product_id" uuid,
	"store_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"photo_urls" text[],
	"admin_response" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"store_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"photo_urls" text[],
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_read_status" ADD CONSTRAINT "alert_read_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_read_status" ADD CONSTRAINT "alert_read_status_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_category_id_alert_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."alert_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_folders" ADD CONSTRAINT "favorite_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_folder_id_favorite_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."favorite_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_requests" ADD CONSTRAINT "analysis_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_read_user_alert_idx" ON "alert_read_status" USING btree ("user_id","alert_id");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alerts_published_at_idx" ON "alerts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "alerts_category_idx" ON "alerts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "boycott_targets_level_idx" ON "boycott_targets" USING btree ("boycott_level");--> statement-breakpoint
CREATE INDEX "boycott_targets_active_idx" ON "boycott_targets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "certifiers_trust_score_idx" ON "certifiers" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX "certifiers_halal_assessment_idx" ON "certifiers" USING btree ("halal_assessment");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_product_idx" ON "favorites" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "favorites_folder_idx" ON "favorites" USING btree ("folder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_city_idx" ON "users" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "products_halal_status_idx" ON "products" USING btree ("halal_status");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scans_user_id_idx" ON "scans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scans_barcode_idx" ON "scans" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "scans_scanned_at_idx" ON "scans" USING btree ("scanned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "store_subs_user_store_idx" ON "store_subscriptions" USING btree ("user_id","store_id");--> statement-breakpoint
CREATE INDEX "stores_city_idx" ON "stores" USING btree ("city");--> statement-breakpoint
CREATE INDEX "stores_type_idx" ON "stores" USING btree ("store_type");--> statement-breakpoint
CREATE INDEX "stores_certifier_idx" ON "stores" USING btree ("certifier");--> statement-breakpoint
CREATE INDEX "stores_location_idx" ON "stores" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_source_id_idx" ON "stores" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_sent_at_idx" ON "notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "points_user_id_idx" ON "point_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "points_action_idx" ON "point_transactions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "points_created_at_idx" ON "point_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_user_achievement_idx" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "user_rewards_user_id_idx" ON "user_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_rewards_status_idx" ON "user_rewards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_user_id_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_type_idx" ON "reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_store_id_idx" ON "reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");