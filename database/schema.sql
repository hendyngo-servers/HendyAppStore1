-- HendyAppStore Master D1 SQLite Database Schema

-- 1. Users Table
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

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  user_telegram_id INTEGER PRIMARY KEY,
  balance REAL DEFAULT 0.0,
  spin_credits INTEGER DEFAULT 3,
  total_deposited REAL DEFAULT 0.0,
  total_spent REAL DEFAULT 0.0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  vip_discount_percent INTEGER DEFAULT 10,
  stock_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Code Inventory Table
CREATE TABLE IF NOT EXISTS code_inventory (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  code_value TEXT NOT NULL,
  is_redeemed INTEGER DEFAULT 0,
  redeemed_by INTEGER,
  redeemed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (redeemed_by) REFERENCES users(telegram_id)
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_telegram_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund', 'bonus', 'referral_payout', 'minigame_win')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_code TEXT UNIQUE NOT NULL,
  product_id TEXT,
  code_inventory_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (code_inventory_id) REFERENCES code_inventory(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(reference_code);

-- 6. App Releases Table
CREATE TABLE IF NOT EXISTS app_releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'macos', 'windows')),
  download_url TEXT NOT NULL,
  manifest_url TEXT,
  release_notes TEXT,
  is_mandatory INTEGER DEFAULT 0,
  min_supported_version TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  sha256_checksum TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deprecated')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_telegram_id INTEGER,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  target_id TEXT,
  changes_diff TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. Queue Dead-Letter Queue (DLQ) Table
CREATE TABLE IF NOT EXISTS queue_dlq (
  id TEXT PRIMARY KEY,
  queue_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'discarded')),
  created_at TEXT DEFAULT (datetime('now')),
  last_retried_at TEXT
);

-- 9. Tasks & Progress Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_coins REAL DEFAULT 100.0,
  reward_spins INTEGER DEFAULT 1,
  action_type TEXT NOT NULL CHECK (action_type IN ('telegram_channel', 'daily_checkin', 'invite_friends', 'external_link')),
  action_target TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_task_progress (
  user_telegram_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  completed_at TEXT,
  PRIMARY KEY (user_telegram_id, task_id),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 10. Minigame History Table
CREATE TABLE IF NOT EXISTS minigame_history (
  id TEXT PRIMARY KEY,
  user_telegram_id INTEGER NOT NULL,
  game_key TEXT NOT NULL,
  prize_label TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_value TEXT NOT NULL,
  spun_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);

-- 11. Bot Configs Table
CREATE TABLE IF NOT EXISTS bot_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 12. Broadcast History Table
CREATE TABLE IF NOT EXISTS broadcast_history (
  id TEXT PRIMARY KEY,
  sent_by_telegram_id INTEGER,
  message_text TEXT NOT NULL,
  filter_role TEXT,
  total_recipients INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- 13. Feature Flags Table
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
