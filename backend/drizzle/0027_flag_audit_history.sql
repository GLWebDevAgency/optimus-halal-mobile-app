-- Flag Audit History — tracks every mutation on feature flags
CREATE TABLE IF NOT EXISTS "flag_audit_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "flag_id" uuid NOT NULL REFERENCES "feature_flags"("id") ON DELETE CASCADE,
  "action" varchar(32) NOT NULL, -- create, update, toggle, delete, set_override, remove_override
  "actor_id" uuid NOT NULL,      -- admin or user who performed the action
  "actor_type" varchar(16) NOT NULL DEFAULT 'admin', -- admin, system
  "changes" jsonb,               -- { field: { old, new } } for updates
  "metadata" jsonb,              -- extra context (userId for overrides, reason, etc.)
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_flag_audit_flag_id" ON "flag_audit_history"("flag_id");
CREATE INDEX IF NOT EXISTS "idx_flag_audit_created_at" ON "flag_audit_history"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_flag_audit_actor" ON "flag_audit_history"("actor_id");
