-- Track all admin-initiated email sends for audit & analytics
DO $$ BEGIN
  CREATE TYPE email_send_status AS ENUM ('sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(320) NOT NULL,
  template VARCHAR(50) NOT NULL,
  status email_send_status NOT NULL,
  error TEXT,
  batch_id UUID NOT NULL,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_sends_batch_id_idx ON email_sends (batch_id);
CREATE INDEX IF NOT EXISTS email_sends_template_idx ON email_sends (template);
CREATE INDEX IF NOT EXISTS email_sends_created_at_idx ON email_sends (created_at);
CREATE INDEX IF NOT EXISTS email_sends_recipient_idx ON email_sends (recipient_email);
