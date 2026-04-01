-- 0033: Product recalls — RappelConso government data
-- Stores food safety recalls with GTIN barcode for scan-time matching.
-- Admin moderation: status flow = pending → approved / rejected.

CREATE TABLE IF NOT EXISTS "product_recalls" (
  "id"                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  "source_reference"    varchar(100) NOT NULL UNIQUE,
  "gtin"                varchar(14),
  "brand_name"          varchar(255),
  "product_name"        varchar(500),
  "sub_category"        varchar(255),
  "recall_reason"       text        NOT NULL,
  "health_risks"        text,
  "consumer_actions"    text,
  "health_precautions"  text,
  "distributors"        text,
  "geo_scope"           varchar(500),
  "image_url"           text,
  "pdf_url"             text,
  "source_url"          text,
  "status"              varchar(20) NOT NULL DEFAULT 'pending',
  "reviewed_by"         uuid        REFERENCES "admins"("id"),
  "reviewed_at"         timestamptz,
  "auto_approved"       boolean     NOT NULL DEFAULT false,
  "published_at"        timestamptz NOT NULL,
  "recall_end_date"     timestamptz,
  "created_at"          timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "product_recalls_gtin_idx"
  ON "product_recalls" ("gtin");

CREATE INDEX IF NOT EXISTS "product_recalls_published_at_idx"
  ON "product_recalls" ("published_at");

CREATE INDEX IF NOT EXISTS "product_recalls_status_idx"
  ON "product_recalls" ("status");
