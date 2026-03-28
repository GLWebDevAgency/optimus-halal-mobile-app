-- Migration 0030: Push token + nudge tracking for guest devices + registered users
-- Enables server-side push notifications for anonymous users (no email).

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_nudge_sent_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_nudge_sent_at TIMESTAMPTZ;

-- Fast lookup: eligible devices (have push token, due for a nudge)
CREATE INDEX IF NOT EXISTS devices_push_nudge_idx
  ON devices (push_nudge_sent_at, quota_hits_count)
  WHERE push_token IS NOT NULL;
