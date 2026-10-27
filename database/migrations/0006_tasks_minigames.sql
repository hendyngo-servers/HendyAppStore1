-- 0006_tasks_minigames.sql: Tasks, Social Quests, and Lucky Wheel Minigames
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

CREATE INDEX IF NOT EXISTS idx_minigame_user ON minigame_history(user_telegram_id);
