-- Feature Flags system — full custom (PostgreSQL + Redis + tRPC)
-- Tables: feature_flags (definitions + rules) + flag_user_overrides (per-user overrides)

CREATE TABLE IF NOT EXISTS feature_flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 VARCHAR(100) NOT NULL UNIQUE,
  label               VARCHAR(200) NOT NULL,
  description         TEXT,
  flag_type           VARCHAR(20) NOT NULL DEFAULT 'boolean',
  enabled             BOOLEAN NOT NULL DEFAULT false,
  default_value       JSONB NOT NULL DEFAULT 'false',
  rollout_percentage  INT NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  variants            JSONB,
  rules               JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags (enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS flag_user_overrides (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id    UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value      JSONB NOT NULL,
  reason     VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (flag_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_user ON flag_user_overrides (user_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_flag ON flag_user_overrides (flag_id);

-- Seed the 17 existing hardcoded flags with their current default values
INSERT INTO feature_flags (key, label, description, flag_type, enabled, default_value) VALUES
  ('marketplaceEnabled',      'Marketplace',                'Marketplace produits certifiés (Coming Soon)',       'boolean', false, 'false'),
  ('paymentsEnabled',         'Paiements',                  'Paiement in-app (RevenueCat)',                       'boolean', true,  'true'),
  ('offlineMode',             'Mode hors-ligne',            'Cache hors-ligne MMKV',                              'boolean', true,  'true'),
  ('pushNotifications',       'Notifications push',         'Notifications push (Expo Notifications)',            'boolean', true,  'true'),
  ('aiScanner',               'Scanner IA',                 'Analyse ingrédients par Gemini AI',                  'boolean', false, 'false'),
  ('gamificationEnabled',     'Gamification',               'XP, niveaux, badges, streak',                        'boolean', false, 'false'),
  ('socialSharing',           'Partage social',             'Partage de résultats de scan',                       'boolean', true,  'true'),
  ('analyticsEnabled',        'Analytics',                  'PostHog + Sentry analytics',                         'boolean', true,  'true'),
  ('socialAuthEnabled',       'Auth sociale',               'Google / Apple Sign-In (OAuth)',                      'boolean', false, 'false'),
  ('alternativesEnabled',     'Alternatives halal',         'Alternatives halal certifiées (V2)',                  'boolean', false, 'false'),
  ('alertsEnabled',           'Alertes éthiques',           'Veille éthique halal (alertes push)',                'boolean', false, 'false'),
  ('featuredArticlesEnabled', 'Articles à la une',          'Section "À la une" sur le home',                     'boolean', true,  'true'),
  ('paywallEnabled',          'Paywall',                    'Gate Naqiy+ (paywall RevenueCat)',                   'boolean', true,  'true'),
  ('favoritesLimitEnabled',   'Limite favoris',             'Limite favoris pour free tier',                      'boolean', true,  'true'),
  ('scanHistoryLimitEnabled', 'Limite historique scans',    'Limite historique scans free tier',                  'boolean', true,  'true'),
  ('offlineCacheEnabled',     'Cache offline premium',      'Cache offline premium',                              'boolean', false, 'false'),
  ('premiumMapEnabled',       'Carte premium',              'Carte enrichie premium',                             'boolean', false, 'false'),
  ('healthProfileEnabled',    'Profil santé',               'Profil santé / allergènes personnalisé',            'boolean', false, 'false')
ON CONFLICT (key) DO NOTHING;
