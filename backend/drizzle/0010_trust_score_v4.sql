-- Trust Score V4: Transparency indicators for certifiers
-- Adds 3 boolean columns to certifiers table for organizational transparency scoring.
-- Post-slaughter electrocution column already exists from 0008 migration.

DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "transparency_public_charter" boolean;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "transparency_audit_reports" boolean;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "transparency_company_list" boolean;
EXCEPTION WHEN duplicate_column THEN null;
END $$;