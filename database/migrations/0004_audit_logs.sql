-- 0004_audit_logs.sql: Administrator & Security Audit Trail
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

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_telegram_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
