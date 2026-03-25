-- Waitlist leads table for pre-launch email collection
CREATE TABLE IF NOT EXISTS "waitlist_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(320) NOT NULL,
  "source" varchar(50) DEFAULT 'landing' NOT NULL,
  "locale" varchar(5) DEFAULT 'fr',
  "utm_source" varchar(100),
  "utm_medium" varchar(100),
  "utm_campaign" varchar(100),
  "consent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_leads_email_idx" ON "waitlist_leads" USING btree ("email");
CREATE INDEX IF NOT EXISTS "waitlist_leads_source_idx" ON "waitlist_leads" USING btree ("source");
CREATE INDEX IF NOT EXISTS "waitlist_leads_created_at_idx" ON "waitlist_leads" USING btree ("created_at");
