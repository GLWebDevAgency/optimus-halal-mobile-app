-- Remove duplicate boycott_targets rows before adding unique constraint.
-- Keeps the oldest row per company_name (smallest added_at).
DELETE FROM boycott_targets a
USING boycott_targets b
WHERE a.id <> b.id
  AND a.company_name = b.company_name
  AND a.added_at > b.added_at;--> statement-breakpoint

-- Now safe to add the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "boycott_targets_company_name_idx"
  ON "boycott_targets" USING btree ("company_name");
