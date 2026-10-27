import { DatabaseSync } from 'node:sqlite';

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: any }>;
  first<T = any>(colName?: string): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<any>;
}

/**
 * Universal D1 Database client adapter that works with Cloudflare D1 or built-in node:sqlite
 */
export class DatabaseService implements D1DatabaseLike {
  private static instance: DatabaseService | null = null;
  private localSqlite: DatabaseSync | null = null;
  private cfDb: any = null;

  constructor(cfDb?: any) {
    if (cfDb) {
      this.cfDb = cfDb;
    } else {
      this.initLocalSqlite();
    }
  }

  public static getInstance(cfDb?: any): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(cfDb);
    } else if (cfDb && !DatabaseService.instance.cfDb) {
      DatabaseService.instance.cfDb = cfDb;
    }
    return DatabaseService.instance;
  }

  private initLocalSqlite(): void {
    if (this.localSqlite) return;
    this.localSqlite = new DatabaseSync(':memory:');
    this.applyInitialSchemas();
  }

  private applyInitialSchemas(): void {
    if (!this.localSqlite) return;

    // Apply master schema
    this.localSqlite.exec(`
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
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_telegram_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        reference_code TEXT UNIQUE NOT NULL,
        product_id TEXT,
        code_inventory_id TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS app_releases (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        build_number INTEGER NOT NULL,
        platform TEXT NOT NULL,
        download_url TEXT NOT NULL,
        manifest_url TEXT,
        release_notes TEXT,
        is_mandatory INTEGER DEFAULT 0,
        min_supported_version TEXT,
        file_size_bytes INTEGER DEFAULT 0,
        sha256_checksum TEXT,
        status TEXT DEFAULT 'published',
        created_at TEXT DEFAULT (datetime('now'))
      );

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

      CREATE TABLE IF NOT EXISTS queue_dlq (
        id TEXT PRIMARY KEY,
        queue_name TEXT NOT NULL,
        job_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        last_retried_at TEXT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        reward_coins REAL DEFAULT 100.0,
        reward_spins INTEGER DEFAULT 1,
        action_type TEXT NOT NULL,
        action_target TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_task_progress (
        user_telegram_id INTEGER NOT NULL,
        task_id TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        completed_at TEXT,
        PRIMARY KEY (user_telegram_id, task_id)
      );

      CREATE TABLE IF NOT EXISTS minigame_history (
        id TEXT PRIMARY KEY,
        user_telegram_id INTEGER NOT NULL,
        game_key TEXT NOT NULL,
        prize_label TEXT NOT NULL,
        prize_type TEXT NOT NULL,
        prize_value TEXT NOT NULL,
        spun_at TEXT DEFAULT (datetime('now'))
      );

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
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT
      );

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
    `);

    // Seed default records
    this.localSqlite.exec(`
      INSERT OR IGNORE INTO users (id, telegram_id, username, first_name, last_name, role, status, daily_streak, referral_count) VALUES
      ('usr_admin_01', 123456789, 'hendy_admin', 'Hendy', 'Admin', 'admin', 'active', 15, 42),
      ('usr_vip_02', 987654321, 'crypto_whiz', 'Alex', 'Nguyen', 'vip', 'active', 7, 12),
      ('usr_user_03', 555444333, 'sarah_gamer', 'Sarah', 'Connor', 'user', 'active', 3, 2);

      INSERT OR IGNORE INTO wallets (user_telegram_id, balance, spin_credits, total_deposited, total_spent) VALUES
      (123456789, 500000.0, 99, 1000000.0, 500000.0),
      (987654321, 245000.0, 10, 300000.0, 55000.0),
      (555444333, 50000.0, 3, 50000.0, 0.0);

      INSERT OR IGNORE INTO products (id, sku, title, description, category, price, vip_discount_percent, stock_count, is_active) VALUES
      ('prod_spotify_1m', 'SKU-SPOTIFY-1M', 'Spotify Premium 1 Month Code', 'Instant activation key for Spotify Individual account with zero ads.', 'account', 35000.0, 15, 25, 1),
      ('prod_netflix_gift', 'SKU-NETFLIX-100K', 'Netflix Voucher 100,000 VND', 'Official digital gift card redeemable on Netflix accounts worldwide.', 'giftcard', 95000.0, 10, 18, 1),
      ('prod_steam_usd5', 'SKU-STEAM-5USD', 'Steam Wallet Card $5 USD', 'Top-up wallet balance for Steam store games and community market.', 'game', 125000.0, 5, 40, 1),
      ('prod_nordvpn_1y', 'SKU-NORDVPN-1Y', 'NordVPN 1-Year Ultra Secure Key', 'Military-grade encryption VPN license with 6 simultaneous device connections.', 'vpn', 380000.0, 20, 12, 1);

      INSERT OR IGNORE INTO code_inventory (id, product_id, code_value, is_redeemed) VALUES
      ('code_001', 'prod_spotify_1m', 'SPOT-PREM-9832-XKLP-2026', 0),
      ('code_002', 'prod_spotify_1m', 'SPOT-PREM-1102-MMQZ-2026', 0),
      ('code_003', 'prod_netflix_gift', 'NFLX-VN-4491-9920-8811', 0),
      ('code_004', 'prod_steam_usd5', 'STM5-XK82-991A-GG44-PO99', 0),
      ('code_005', 'prod_nordvpn_1y', 'NORD-1Y-AAAA-BBBB-CCCC-DDDD', 0);

      INSERT OR IGNORE INTO tasks (id, title, description, reward_coins, reward_spins, action_type, action_target, is_active) VALUES
      ('task_join_tg', 'Join Official Telegram Channel', 'Subscribe to @HendyAppStoreNews to get latest deals and updates.', 10000.0, 1, 'telegram_channel', '@HendyAppStoreNews', 1),
      ('task_invite_3', 'Invite 3 Friends to Bot', 'Share your referral link with at least 3 active friends.', 30000.0, 3, 'invite_friends', 'referral', 1),
      ('task_checkin', 'Daily Login Check-In', 'Open the bot daily to maintain your reward streak.', 5000.0, 1, 'daily_checkin', 'checkin', 1);

      INSERT OR IGNORE INTO bot_configs (key, value, description) VALUES
      ('welcome_message', 'Welcome to <b>Hendy AppStore Bot</b>! Your 1-stop hub for instant digital codes, game cards, and exclusive VIP privileges.', 'Initial /start greeting template'),
      ('support_contact', '@HendySupport247', 'Customer support handle displayed in help command'),
      ('min_deposit_amount', '20000', 'Minimum allowed deposit amount in VND'),
      ('vip_monthly_price', '99000', 'Price for 30-day VIP status pass');

      INSERT OR IGNORE INTO feature_flags (key, name, description, enabled, rollout_percentage, environment) VALUES
      ('vip_store_enabled', 'VIP Special Catalog', 'Show exclusive VIP discount categories in bot and mini-app', 1, 100, 'all'),
      ('lucky_wheel_enabled', 'Lucky Wheel Minigame', 'Enable Lucky Wheel gacha with daily free spins', 1, 100, 'all'),
      ('instant_bank_sync', 'Instant Bank QR Deposit', 'Automatic VietQR webhook reconciliation', 1, 100, 'all'),
      ('maintenance_mode', 'System Maintenance Killswitch', 'Perimeter maintenance mode toggle handled by Edge Router', 0, 0, 'all');
    `);
  }

  public prepare(query: string): D1PreparedStatement {
    if (this.cfDb) {
      return this.cfDb.prepare(query);
    }

    if (!this.localSqlite) {
      this.initLocalSqlite();
    }

    const sqlite = this.localSqlite!;
    let boundParams: any[] = [];

    const stmtObj: D1PreparedStatement = {
      bind(...values: any[]) {
        boundParams = values;
        return stmtObj;
      },
      async all<T = any>(): Promise<{ results: T[] }> {
        try {
          const stmt = sqlite.prepare(query);
          const results = (boundParams.length > 0 ? stmt.all(...boundParams) : stmt.all()) as T[];
          return { results };
        } catch (err: any) {
          console.error('[DatabaseService Error]', query, boundParams, err);
          throw err;
        }
      },
      async first<T = any>(colName?: string): Promise<T | null> {
        try {
          const stmt = sqlite.prepare(query);
          const row = (boundParams.length > 0 ? stmt.get(...boundParams) : stmt.get()) as any;
          if (!row) return null;
          if (colName) return row[colName] ?? null;
          return row as T;
        } catch (err: any) {
          console.error('[DatabaseService Error first]', query, boundParams, err);
          throw err;
        }
      },
      async run(): Promise<{ success: boolean; meta?: any }> {
        try {
          const stmt = sqlite.prepare(query);
          const res = boundParams.length > 0 ? stmt.run(...boundParams) : stmt.run();
          return { success: true, meta: res };
        } catch (err: any) {
          console.error('[DatabaseService Error run]', query, boundParams, err);
          throw err;
        }
      },
    };

    return stmtObj;
  }

  public async exec(query: string): Promise<any> {
    if (this.cfDb) {
      return this.cfDb.exec(query);
    }
    if (!this.localSqlite) this.initLocalSqlite();
    return this.localSqlite!.exec(query);
  }
}
