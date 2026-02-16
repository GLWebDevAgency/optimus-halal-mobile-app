CREATE TYPE "public"."additive_category" AS ENUM('colorant', 'preservative', 'antioxidant', 'emulsifier', 'stabilizer', 'thickener', 'flavor_enhancer', 'sweetener', 'acid', 'anti_caking', 'glazing_agent', 'humectant', 'raising_agent', 'sequestrant', 'other');--> statement-breakpoint
CREATE TYPE "public"."additive_origin" AS ENUM('plant', 'animal', 'synthetic', 'mineral', 'insect', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."efsa_status" AS ENUM('approved', 'under_review', 'restricted', 'banned');--> statement-breakpoint
CREATE TYPE "public"."toxicity_level" AS ENUM('safe', 'low_concern', 'moderate_concern', 'high_concern');--> statement-breakpoint
CREATE TYPE "public"."article_type" AS ENUM('blog', 'partner_news', 'educational', 'community');--> statement-breakpoint
CREATE TYPE "public"."madhab" AS ENUM('hanafi', 'shafii', 'maliki', 'hanbali', 'general');--> statement-breakpoint
CREATE TABLE "additive_madhab_rulings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"additive_code" varchar(10) NOT NULL,
	"madhab" "madhab" NOT NULL,
	"ruling" "halal_status" NOT NULL,
	"explanation_fr" text NOT NULL,
	"explanation_en" text,
	"scholarly_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "additives" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name_fr" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"name_ar" varchar(255),
	"category" "additive_category" NOT NULL,
	"halal_status_default" "halal_status" NOT NULL,
	"halal_explanation_fr" text,
	"halal_explanation_en" text,
	"origin" "additive_origin" NOT NULL,
	"origin_details" text,
	"toxicity_level" "toxicity_level" DEFAULT 'safe' NOT NULL,
	"adi_mg_per_kg" double precision,
	"risk_pregnant" boolean DEFAULT false NOT NULL,
	"risk_children" boolean DEFAULT false NOT NULL,
	"risk_allergic" boolean DEFAULT false NOT NULL,
	"health_effects_fr" text,
	"health_effects_en" text,
	"efsa_status" "efsa_status" DEFAULT 'approved' NOT NULL,
	"banned_countries" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"cover_image" text,
	"excerpt" text,
	"content" text,
	"author" varchar(100) DEFAULT 'Optimus Team' NOT NULL,
	"type" "article_type" DEFAULT 'blog' NOT NULL,
	"tags" text[] DEFAULT '{}',
	"read_time_minutes" integer DEFAULT 3,
	"external_link" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "phone" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "madhab" "madhab" DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_pregnant" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_children" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "additive_madhab_rulings" ADD CONSTRAINT "additive_madhab_rulings_additive_code_additives_code_fk" FOREIGN KEY ("additive_code") REFERENCES "public"."additives"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "madhab_ruling_unique_idx" ON "additive_madhab_rulings" USING btree ("additive_code","madhab");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "articles_type_idx" ON "articles" USING btree ("type");--> statement-breakpoint
CREATE INDEX "articles_is_published_idx" ON "articles" USING btree ("is_published");