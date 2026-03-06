ALTER TABLE "certifiers" ADD COLUMN IF NOT EXISTS "last_verified_at" varchar(10);
ALTER TABLE "certifiers" ADD COLUMN IF NOT EXISTS "evidence_level" varchar(20) DEFAULT 'declared';
ALTER TABLE "certifiers" ADD COLUMN IF NOT EXISTS "data_source_url" text;
