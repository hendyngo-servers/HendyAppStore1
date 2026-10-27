import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

export async function handleUsers(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  if (auth.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // GET /api/users
  if (request.method === 'GET' && url.pathname === '/api/users') {
    const search = url.searchParams.get('q');
    let query = `
      SELECT u.*, w.balance as wallet_balance, w.spin_credits
      FROM users u
      LEFT JOIN wallets w ON u.telegram_id = w.user_telegram_id
    `;
    const params: any[] = [];
    if (search) {
      query += ` WHERE u.username LIKE ? OR u.first_name LIKE ? OR CAST(u.telegram_id AS TEXT) LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += ` ORDER BY u.created_at DESC LIMIT 50`;

    const { results } = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({ users: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/users/action (Ban/Unban, VIP promote, adjust balance)
  if (request.method === 'POST' && url.pathname === '/api/users/action') {
    try {
      const body = await request.json() as {
        telegramId: number;
        action: 'ban' | 'unban' | 'set_role' | 'adjust_balance';
        role?: 'user' | 'vip' | 'admin' | 'moderator';
        balanceDelta?: number;
      };

      if (body.action === 'ban') {
        await db.prepare('UPDATE users SET status = "banned", updated_at = datetime("now") WHERE telegram_id = ?').bind(body.telegramId).run();
      } else if (body.action === 'unban') {
        await db.prepare('UPDATE users SET status = "active", updated_at = datetime("now") WHERE telegram_id = ?').bind(body.telegramId).run();
      } else if (body.action === 'set_role' && body.role) {
        await db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE telegram_id = ?').bind(body.role, body.telegramId).run();
      } else if (body.action === 'adjust_balance' && body.balanceDelta !== undefined) {
        await db.prepare(`
          UPDATE wallets
          SET balance = MAX(0, balance + ?), updated_at = datetime('now')
          WHERE user_telegram_id = ?
        `).bind(body.balanceDelta, body.telegramId).run();
      }

      return new Response(JSON.stringify({ success: true, telegramId: body.telegramId, action: body.action }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Users endpoint not found' }), { status: 404 });
}
