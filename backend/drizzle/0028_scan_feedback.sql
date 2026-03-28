-- Scan Feedback — community validation votes on halal analysis results.
-- One vote per (user, product). Upserted so users can change their mind.

CREATE TABLE IF NOT EXISTS "scan_feedback" (
  "id"          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id"  uuid        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "is_correct"  boolean     NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "scan_feedback_user_product_uidx"
  ON "scan_feedback"("user_id", "product_id");

CREATE INDEX IF NOT EXISTS "scan_feedback_product_idx"
  ON "scan_feedback"("product_id");
