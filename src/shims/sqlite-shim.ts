// Browser in-memory SQLite shim matching node:sqlite DatabaseSync interface

export class DatabaseSync {
  private tables: Map<string, any[]> = new Map();

  constructor(filename: string = ':memory:') {
    this.initDefaultTables();
  }

  private initDefaultTables() {
    this.tables.set('users', [
      { id: 'usr_admin_01', telegram_id: 123456789, username: 'hendy_admin', first_name: 'Hendy', last_name: 'Admin', role: 'admin', status: 'active', daily_streak: 15, referral_count: 42, referral_earnings: 420000.0, vip_expires_at: null, last_check_in: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'usr_vip_02', telegram_id: 987654321, username: 'crypto_whiz', first_name: 'Alex', last_name: 'Nguyen', role: 'vip', status: 'active', daily_streak: 7, referral_count: 12, referral_earnings: 120000.0, vip_expires_at: Date.now() + 30 * 86400 * 1000, last_check_in: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'usr_user_03', telegram_id: 555444333, username: 'sarah_gamer', first_name: 'Sarah', last_name: 'Connor', role: 'user', status: 'active', daily_streak: 3, referral_count: 2, referral_earnings: 20000.0, vip_expires_at: null, last_check_in: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]);

    this.tables.set('wallets', [
      { user_telegram_id: 123456789, balance: 500000.0, spin_credits: 99, total_deposited: 1000000.0, total_spent: 500000.0, updated_at: new Date().toISOString() },
      { user_telegram_id: 987654321, balance: 245000.0, spin_credits: 10, total_deposited: 300000.0, total_spent: 55000.0, updated_at: new Date().toISOString() },
      { user_telegram_id: 555444333, balance: 50000.0, spin_credits: 3, total_deposited: 50000.0, total_spent: 0.0, updated_at: new Date().toISOString() },
    ]);

    this.tables.set('products', [
      { id: 'prod_spotify_1m', sku: 'SKU-SPOTIFY-1M', title: 'Spotify Premium 1 Month Code', description: 'Instant activation key for Spotify Individual account with zero ads.', category: 'account', price: 35000.0, vip_discount_percent: 15, stock_count: 25, is_active: 1, created_at: new Date().toISOString() },
      { id: 'prod_netflix_gift', sku: 'SKU-NETFLIX-100K', title: 'Netflix Voucher 100,000 VND', description: 'Official digital gift card redeemable on Netflix accounts worldwide.', category: 'giftcard', price: 95000.0, vip_discount_percent: 10, stock_count: 18, is_active: 1, created_at: new Date().toISOString() },
      { id: 'prod_steam_usd5', sku: 'SKU-STEAM-5USD', title: 'Steam Wallet Card $5 USD', description: 'Top-up wallet balance for Steam store games and community market.', category: 'game', price: 125000.0, vip_discount_percent: 5, stock_count: 40, is_active: 1, created_at: new Date().toISOString() },
      { id: 'prod_nordvpn_1y', sku: 'SKU-NORDVPN-1Y', title: 'NordVPN 1-Year Ultra Secure Key', description: 'Military-grade encryption VPN license with 6 simultaneous device connections.', category: 'vpn', price: 380000.0, vip_discount_percent: 20, stock_count: 12, is_active: 1, created_at: new Date().toISOString() },
    ]);

    this.tables.set('code_inventory', [
      { id: 'code_001', product_id: 'prod_spotify_1m', code_value: 'SPOT-PREM-9832-XKLP-2026', is_redeemed: 0, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() },
      { id: 'code_002', product_id: 'prod_spotify_1m', code_value: 'SPOT-PREM-1102-MMQZ-2026', is_redeemed: 0, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() },
      { id: 'code_003', product_id: 'prod_netflix_gift', code_value: 'NFLX-VN-4491-9920-8811', is_redeemed: 0, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() },
      { id: 'code_004', product_id: 'prod_steam_usd5', code_value: 'STM5-XK82-991A-GG44-PO99', is_redeemed: 0, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() },
      { id: 'code_005', product_id: 'prod_nordvpn_1y', code_value: 'NORD-1Y-AAAA-BBBB-CCCC-DDDD', is_redeemed: 0, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() },
    ]);

    this.tables.set('transactions', [
      { id: 'tx_seed_01', user_telegram_id: 123456789, amount: 500000.0, type: 'deposit', status: 'completed', reference_code: 'DEP_INIT_ADMIN', product_id: null, code_inventory_id: null, notes: 'Initial balance top-up', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]);

    this.tables.set('tasks', [
      { id: 'task_join_tg', title: 'Join Official Telegram Channel', description: 'Subscribe to @HendyAppStoreNews to get latest deals and updates.', reward_coins: 10000.0, reward_spins: 1, action_type: 'telegram_channel', action_target: '@HendyAppStoreNews', is_active: 1, created_at: new Date().toISOString() },
      { id: 'task_invite_3', title: 'Invite 3 Friends to Bot', description: 'Share your referral link with at least 3 active friends.', reward_coins: 30000.0, reward_spins: 3, action_type: 'invite_friends', action_target: 'referral', is_active: 1, created_at: new Date().toISOString() },
      { id: 'task_checkin', title: 'Daily Login Check-In', description: 'Open the bot daily to maintain your reward streak.', reward_coins: 5000.0, reward_spins: 1, action_type: 'daily_checkin', action_target: 'checkin', is_active: 1, created_at: new Date().toISOString() },
    ]);

    this.tables.set('user_task_progress', []);
    this.tables.set('minigame_history', []);

    this.tables.set('feature_flags', [
      { key: 'vip_store_enabled', name: 'VIP Special Catalog', description: 'Show exclusive VIP discount categories in bot and mini-app', enabled: 1, rollout_percentage: 100, environment: 'all', updated_at: new Date().toISOString() },
      { key: 'lucky_wheel_enabled', name: 'Lucky Wheel Minigame', description: 'Enable Lucky Wheel gacha with daily free spins', enabled: 1, rollout_percentage: 100, environment: 'all', updated_at: new Date().toISOString() },
      { key: 'instant_bank_sync', name: 'Instant Bank QR Deposit', description: 'Automatic VietQR webhook reconciliation', enabled: 1, rollout_percentage: 100, environment: 'all', updated_at: new Date().toISOString() },
      { key: 'maintenance_mode', name: 'System Maintenance Killswitch', description: 'Perimeter maintenance mode toggle handled by Edge Router', enabled: 0, rollout_percentage: 0, environment: 'all', updated_at: new Date().toISOString() },
    ]);

    this.tables.set('app_releases', [
      { id: 'rel_100', version: '1.0.0', build_number: 100, platform: 'ios', download_url: 'https://cdn.hendyappstore.com/builds/ios/1.0.0/app.ipa', release_notes: 'Initial production release for HendyAppStore Telegram ecosystem.', status: 'published', created_at: new Date().toISOString() },
    ]);

    this.tables.set('queue_dlq', []);
    this.tables.set('audit_logs', []);
    this.tables.set('broadcast_history', []);
  }

  public exec(sql: string): void {
    // Schema creation in memory handled by initDefaultTables
  }

  public prepare(query: string) {
    const self = this;
    const cleanQuery = query.trim();

    return {
      all(...params: any[]) {
        return self.handleAll(cleanQuery, params);
      },
      get(...params: any[]) {
        const results = self.handleAll(cleanQuery, params);
        return results[0] || null;
      },
      run(...params: any[]) {
        return self.handleRun(cleanQuery, params);
      },
    };
  }

  private handleAll(query: string, params: any[]): any[] {
    const lower = query.toLowerCase();

    // Queries without FROM (e.g. SELECT 1 as ping)
    if (!query.match(/FROM/i)) {
      if (lower.includes('ping') || lower.includes('1')) {
        return [{ ping: 1 }];
      }
      return [{}];
    }

    // Check count query: SELECT COUNT(*) as count FROM tableName
    const countMatch = query.match(/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)/i);
    if (countMatch) {
      const colName = countMatch[1];
      const table = countMatch[2];
      const rows = this.tables.get(table) || [];
      return [{ [colName]: rows.length }];
    }

    // Check sum query: SELECT SUM(col) as total FROM tableName ...
    const sumMatch = query.match(/SELECT\s+SUM\((\w+)\)\s+as\s+(\w+)\s+FROM\s+(\w+)/i);
    if (sumMatch) {
      const sumCol = sumMatch[1];
      const colName = sumMatch[2];
      const table = sumMatch[3];
      const rows = this.tables.get(table) || [];
      const total = rows.reduce((acc, r) => acc + (Number(r[sumCol]) || 0), 0);
      return [{ [colName]: total }];
    }

    // Simple table select: SELECT ... FROM tableName
    const fromMatch = query.match(/FROM\s+(\w+)/i);
    if (fromMatch) {
      const table = fromMatch[1];
      let rows = [...(this.tables.get(table) || [])];

      // Handle simple WHERE equality filter: WHERE col = ?
      if (lower.includes('where')) {
        const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*(?:\?|'([^']+)'|"([^"]+)"|(\d+))/i);
        if (whereMatch) {
          const col = whereMatch[1];
          const val = params.length > 0 ? params[0] : (whereMatch[2] || whereMatch[3] || whereMatch[4]);
          rows = rows.filter((r) => String(r[col]) === String(val));
        }
      }

      return rows;
    }

    return [];
  }

  private handleRun(query: string, params: any[]): { changes: number } {
    const lower = query.toLowerCase();

    // UPDATE tableName SET ... WHERE ...
    if (lower.startsWith('update')) {
      const updateMatch = query.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*\?/i);
      if (updateMatch) {
        const table = updateMatch[1];
        const rows = this.tables.get(table) || [];
        const whereCol = updateMatch[3];
        const whereVal = params[params.length - 1];

        const target = rows.find((r) => String(r[whereCol]) === String(whereVal));
        if (target) {
          if (query.includes('balance = balance - ?')) {
            target.balance = (target.balance || 0) - Number(params[0]);
          } else if (query.includes('balance = balance + ?')) {
            target.balance = (target.balance || 0) + Number(params[0]);
          }
          if (query.includes('spin_credits = spin_credits - 1')) {
            target.spin_credits = Math.max(0, (target.spin_credits || 1) - 1);
          }
          if (query.includes('enabled = ?')) {
            target.enabled = params[0];
          }
          if (query.includes('is_redeemed = 1')) {
            target.is_redeemed = 1;
            target.redeemed_by = params[0];
            target.redeemed_at = params[1];
          }
        }
        return { changes: 1 };
      }
    }

    // INSERT INTO tableName (...) VALUES (...)
    if (lower.startsWith('insert')) {
      const insertMatch = query.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)/i);
      if (insertMatch) {
        const table = insertMatch[1];
        let rows = this.tables.get(table);
        if (!rows) {
          rows = [];
          this.tables.set(table, rows);
        }

        const newRow: any = { id: `id_${Date.now()}` };
        if (table === 'transactions') {
          newRow.id = params[0];
          newRow.user_telegram_id = params[1];
          newRow.amount = params[2];
          newRow.type = params[3] || 'purchase';
          newRow.status = params[4] || 'completed';
          newRow.reference_code = params[5];
          newRow.created_at = new Date().toISOString();
        } else if (table === 'users') {
          newRow.telegram_id = params[1];
          newRow.username = params[2];
          newRow.first_name = params[3];
          newRow.role = params[5] || 'user';
        }
        rows.push(newRow);
        return { changes: 1 };
      }
    }

    return { changes: 0 };
  }
}

export default {
  DatabaseSync,
};
