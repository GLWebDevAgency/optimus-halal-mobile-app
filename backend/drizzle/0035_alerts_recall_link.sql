-- 0035: Link alerts to product_recalls for recall-type alerts
-- When a product recall is synced, an alert is auto-created with this FK.
-- Tapping the alert in mobile opens a structured recall detail page.

ALTER TABLE "alerts"
  ADD COLUMN IF NOT EXISTS "product_recall_id" uuid REFERENCES "product_recalls"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "alerts_product_recall_id_idx"
  ON "alerts" ("product_recall_id") WHERE "product_recall_id" IS NOT NULL;

-- Re-add recall category if missing
INSERT INTO "alert_categories" ("id", "name", "name_fr", "name_ar", "icon", "color")
VALUES ('recall', 'Product Recall', 'Rappel Produit', 'استرجاع منتج', 'warning', '#ef4444')
ON CONFLICT ("id") DO NOTHING;
