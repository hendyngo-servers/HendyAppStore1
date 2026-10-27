import { getBotDatabase } from '../db';
import type { User } from '@packages/types';

export interface GuardedUserContext {
  allowed: boolean;
  user: User;
  isAdmin: boolean;
  isVip: boolean;
  rejectionMessage?: string;
}

export async function checkBotAuthGuard(
  telegramId: number,
  userData: { username?: string; first_name?: string; last_name?: string },
  adminIdsString?: string,
  cfDb?: any
): Promise<GuardedUserContext> {
  const db = getBotDatabase(cfDb);

  // Check admin list from environment or database
  const adminIds = (adminIdsString || '123456789')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const isConfiguredAdmin = adminIds.includes(telegramId);

  // Upsert user record
  await db.prepare(`
    INSERT INTO users (id, telegram_id, username, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = datetime('now')
  `).bind(
    `usr_${telegramId}`,
    telegramId,
    userData.username || null,
    userData.first_name || 'User',
    userData.last_name || null,
    isConfiguredAdmin ? 'admin' : 'user'
  ).run();

  // Ensure wallet exists
  await db.prepare(`
    INSERT OR IGNORE INTO wallets (user_telegram_id, balance, spin_credits)
    VALUES (?, 0.0, 3)
  `).bind(telegramId).run();

  const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first() as User;

  if (user.status === 'banned') {
    return {
      allowed: false,
      user,
      isAdmin: false,
      isVip: false,
      rejectionMessage: '⛔ <b>Account Suspended</b>\n\nYour account has been restricted by system administrators. Contact support if you believe this is an error.',
    };
  }

  const isVip = user.role === 'vip' || (user.vip_expires_at ? user.vip_expires_at > Date.now() : false);
  const isAdmin = user.role === 'admin' || isConfiguredAdmin;

  return {
    allowed: true,
    user,
    isAdmin,
    isVip,
  };
}
