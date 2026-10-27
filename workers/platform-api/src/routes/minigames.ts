import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

const WHEEL_PRIZES = [
  { id: 'p1', label: '10,000 Coins', type: 'coins', value: 10000, weight: 35 },
  { id: 'p2', label: '25,000 Coins', type: 'coins', value: 25000, weight: 25 },
  { id: 'p3', label: '50,000 Coins', type: 'coins', value: 50000, weight: 15 },
  { id: 'p4', label: '100,000 Coins', type: 'coins', value: 100000, weight: 8 },
  { id: 'p5', label: '+2 Extra Spins', type: 'spins', value: 2, weight: 10 },
  { id: 'p6', label: '3-Day VIP Pass', type: 'vip_days', value: 3, weight: 5 },
  { id: 'p7', label: 'Jackpot 500,000 Coins', type: 'coins', value: 500000, weight: 2 },
];

export async function handleMinigames(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  // GET /api/minigames/wheel
  if (request.method === 'GET' && url.pathname === '/api/minigames/wheel') {
    return new Response(JSON.stringify({ prizes: WHEEL_PRIZES, spinCost: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!auth.isAuthenticated || !auth.telegramId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // POST /api/minigames/spin
  if (request.method === 'POST' && url.pathname === '/api/minigames/spin') {
    const wallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(auth.telegramId).first();

    if (!wallet || wallet.spin_credits < 1) {
      return new Response(JSON.stringify({
        error: 'No spin credits remaining. Complete daily tasks or invite friends to get more spins!',
        spinCredits: wallet?.spin_credits || 0,
      }), { status: 400 });
    }

    // Weighted random selection
    const totalWeight = WHEEL_PRIZES.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedPrize = WHEEL_PRIZES[0];

    for (const prize of WHEEL_PRIZES) {
      if (rand < prize.weight) {
        selectedPrize = prize;
        break;
      }
      rand -= prize.weight;
    }

    // Apply outcome
    await db.prepare(`
      UPDATE wallets
      SET spin_credits = spin_credits - 1, updated_at = datetime('now')
      WHERE user_telegram_id = ?
    `).bind(auth.telegramId).run();

    if (selectedPrize.type === 'coins') {
      await db.prepare(`
        UPDATE wallets SET balance = balance + ? WHERE user_telegram_id = ?
      `).bind(selectedPrize.value, auth.telegramId).run();
    } else if (selectedPrize.type === 'spins') {
      await db.prepare(`
        UPDATE wallets SET spin_credits = spin_credits + ? WHERE user_telegram_id = ?
      `).bind(selectedPrize.value, auth.telegramId).run();
    } else if (selectedPrize.type === 'vip_days') {
      const extraMs = Number(selectedPrize.value) * 86400 * 1000;
      const user = await db.prepare('SELECT vip_expires_at FROM users WHERE telegram_id = ?').bind(auth.telegramId).first();
      const currentExpiry = user?.vip_expires_at && user.vip_expires_at > Date.now() ? user.vip_expires_at : Date.now();
      const newExpiry = currentExpiry + extraMs;

      await db.prepare(`
        UPDATE users SET role = 'vip', vip_expires_at = ?, updated_at = datetime('now')
        WHERE telegram_id = ?
      `).bind(newExpiry, auth.telegramId).run();
    }

    // Record minigame history
    const historyId = `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.prepare(`
      INSERT INTO minigame_history (id, user_telegram_id, game_key, prize_label, prize_type, prize_value)
      VALUES (?, ?, 'lucky_wheel', ?, ?, ?)
    `).bind(historyId, auth.telegramId, selectedPrize.label, selectedPrize.type, String(selectedPrize.value)).run();

    const updatedWallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(auth.telegramId).first();

    return new Response(
      JSON.stringify({
        success: true,
        prize: selectedPrize,
        remainingSpins: updatedWallet.spin_credits,
        newBalance: updatedWallet.balance,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ error: 'Minigames endpoint not found' }), { status: 404 });
}
