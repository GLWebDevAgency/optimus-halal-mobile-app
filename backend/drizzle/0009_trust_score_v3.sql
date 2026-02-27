-- Trust Score V3: VSM indicator, controversy penalty, certifier events timeline
-- Adds 2 columns to certifiers + creates certifier_events table

DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "accepts_vsm" boolean;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "controversy_penalty" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certifier_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certifier_id" varchar(100) NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title_fr" varchar(255) NOT NULL,
	"description_fr" text NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"source_url" text,
	"occurred_at" date NOT NULL,
	"resolved_at" date,
	"resolution_status" varchar(30) NOT NULL,
	"resolution_note_fr" text,
	"score_impact" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifier_events_certifier_id_idx" ON "certifier_events" USING btree ("certifier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifier_events_type_idx" ON "certifier_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifier_events_active_idx" ON "certifier_events" USING btree ("is_active");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifier_events" ADD CONSTRAINT "certifier_events_certifier_id_certifiers_id_fk" FOREIGN KEY ("certifier_id") REFERENCES "public"."certifiers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;