-- 0007_bot_configs.sql: Telegram Bot Dynamic Menus, Commands, and Message Templates
CREATE TABLE IF NOT EXISTS bot_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

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
