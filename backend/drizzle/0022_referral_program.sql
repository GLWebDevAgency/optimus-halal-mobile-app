-- Referral Program Migration
-- Adds referral_code to users and creates referrals table

ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_days INTEGER NOT NULL DEFAULT 30,
  reward_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_referee_idx ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);

-- Generate referral codes for existing users (6-char alphanumeric uppercase)
UPDATE users SET referral_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
WHERE referral_code IS NULL;
