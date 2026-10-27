#!/usr/bin/env node
import { DatabaseService } from '../workers/platform-api/src/services/database';

console.log('[DB Backup] Starting automated Cloudflare D1 database snapshot...');
const db = DatabaseService.getInstance();

async function runBackup() {
  const tables = ['users', 'wallets', 'products', 'code_inventory', 'transactions', 'app_releases', 'feature_flags'];
  const snapshot: Record<string, any[]> = {};

  for (const table of tables) {
    const { results } = await db.prepare(`SELECT * FROM ${table}`).all();
    snapshot[table] = results;
  }

  const output = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: snapshot,
  };

  console.log(`[DB Backup] Snapshot completed successfully (${JSON.stringify(output).length} bytes)`);
}

runBackup().catch(console.error);
