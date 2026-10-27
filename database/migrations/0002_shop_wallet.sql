-- 0002_shop_wallet.sql: Products, Code Inventory, Wallets, and Transactions
CREATE TABLE IF NOT EXISTS wallets (
  user_telegram_id INTEGER PRIMARY KEY,
  balance REAL DEFAULT 0.0,
  spin_credits INTEGER DEFAULT 3,
  total_deposited REAL DEFAULT 0.0,
  total_spent REAL DEFAULT 0.0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

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
CREATE INDEX IF NOT EXISTS idx_code_inventory_product ON code_inventory(product_id, is_redeemed);
