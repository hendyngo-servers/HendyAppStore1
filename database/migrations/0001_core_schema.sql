-- 0001_core_schema.sql: Users and Core Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('user', 'vip', 'admin', 'moderator')) DEFAULT 'user',
  status TEXT CHECK (status IN ('active', 'suspended', 'banned')) DEFAULT 'active',
  vip_expires_at INTEGER,
  referrer_id INTEGER,
  referral_count INTEGER DEFAULT 0,
  referral_earnings REAL DEFAULT 0.0,
  daily_streak INTEGER DEFAULT 0,
  last_check_in TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
