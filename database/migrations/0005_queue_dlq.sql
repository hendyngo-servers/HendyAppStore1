-- 0005_queue_dlq.sql: Cloudflare Queues Dead-Letter Queue (DLQ) & Failure Tracking
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

CREATE INDEX IF NOT EXISTS idx_dlq_queue ON queue_dlq(queue_name, status);
