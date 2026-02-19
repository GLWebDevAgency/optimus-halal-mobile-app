CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."subscription_event_type" AS ENUM('INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'NON_RENEWING_PURCHASE', 'PRODUCT_CHANGE', 'UNCANCELLATION');--> statement-breakpoint
CREATE TABLE "review_helpful_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "subscription_event_type" NOT NULL,
	"provider" varchar(20) NOT NULL,
	"product_id" varchar(100),
	"price" double precision,
	"currency" varchar(3) DEFAULT 'EUR',
	"environment" varchar(20) DEFAULT 'PRODUCTION' NOT NULL,
	"raw_payload" jsonb,
	"webhook_event_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_events_webhook_event_id_unique" UNIQUE("webhook_event_id")
);
--> statement-breakpoint
ALTER TABLE "scans" DROP CONSTRAINT "scans_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_provider" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_product_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_helpful_unique" ON "review_helpful_votes" USING btree ("review_id","user_id");--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;