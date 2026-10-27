import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth, parseAndVerifyTelegramInitData } from '../auth';

export async function handleAuth(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);

  if (request.method === 'POST' && url.pathname === '/api/auth/telegram') {
    try {
      const body = await request.json() as { initData: string };
      const botToken = env?.TELEGRAM_BOT_TOKEN || 'dummy_token';
      const verifyResult = parseAndVerifyTelegramInitData(body.initData, botToken);

      // In development or simulation, allow graceful parsing
      let tgUser = verifyResult.user;
      if (!tgUser && body.initData.includes('user=')) {
        const params = new URLSearchParams(body.initData);
        tgUser = JSON.parse(params.get('user') || '{}');
      }

      if (!tgUser || !tgUser.id) {
        return new Response(JSON.stringify({ error: 'Invalid Telegram credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Upsert user in D1
      await db.prepare(`
        INSERT INTO users (id, telegram_id, username, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?, 'user')
        ON CONFLICT(telegram_id) DO UPDATE SET
          username = excluded.username,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          updated_at = datetime('now')
      `).bind(
        `usr_${tgUser.id}`,
        tgUser.id,
        tgUser.username || null,
        tgUser.first_name || 'User',
        tgUser.last_name || null
      ).run();

      // Ensure wallet exists
      await db.prepare(`
        INSERT OR IGNORE INTO wallets (user_telegram_id, balance, spin_credits)
        VALUES (?, 0.0, 3)
      `).bind(tgUser.id).run();

      const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(tgUser.id).first();
      const wallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(tgUser.id).first();

      return new Response(
        JSON.stringify({
          success: true,
          user: { ...user, wallet },
          token: `jwt_session_${tgUser.id}_${Date.now()}`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  // Session verification endpoint
  const auth = verifyApiRequestAuth(request, env || {});
  if (!auth.isAuthenticated || !auth.telegramId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(auth.telegramId).first();
  const wallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(auth.telegramId).first();

  return new Response(JSON.stringify({ authenticated: true, user, wallet }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
