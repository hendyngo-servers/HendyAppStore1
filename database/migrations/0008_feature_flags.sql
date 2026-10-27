-- 0008_feature_flags.sql: Feature Toggles Matrix
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  rollout_percentage INTEGER DEFAULT 100,
  allowed_roles TEXT,
  allowed_telegram_ids TEXT,
  environment TEXT DEFAULT 'all',
  metadata TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
