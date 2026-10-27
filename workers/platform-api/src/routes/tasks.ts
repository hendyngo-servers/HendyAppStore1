import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

export async function handleTasks(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  if (!auth.isAuthenticated || !auth.telegramId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // GET /api/tasks
  if (request.method === 'GET' && url.pathname === '/api/tasks') {
    const { results: tasks } = await db.prepare('SELECT * FROM tasks WHERE is_active = 1').all();
    const { results: progress } = await db.prepare(`
      SELECT task_id, is_completed, completed_at FROM user_task_progress
      WHERE user_telegram_id = ?
    `).bind(auth.telegramId).all();

    const completedMap = new Map(progress.map((p: any) => [p.task_id, p]));
    const formatted = tasks.map((t: any) => ({
      ...t,
      isCompleted: completedMap.get(t.id)?.is_completed === 1,
      completedAt: completedMap.get(t.id)?.completed_at || null,
    }));

    return new Response(JSON.stringify({ tasks: formatted }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/tasks/claim
  if (request.method === 'POST' && url.pathname === '/api/tasks/claim') {
    try {
      const body = await request.json() as { taskId: string };
      const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(body.taskId).first();
      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
      }

      // Check if already completed
      const existing = await db.prepare(`
        SELECT * FROM user_task_progress WHERE user_telegram_id = ? AND task_id = ?
      `).bind(auth.telegramId, task.id).first();

      if (existing && existing.is_completed) {
        return new Response(JSON.stringify({ error: 'Task already completed' }), { status: 400 });
      }

      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO user_task_progress (user_telegram_id, task_id, is_completed, completed_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(user_telegram_id, task_id) DO UPDATE SET
          is_completed = 1,
          completed_at = excluded.completed_at
      `).bind(auth.telegramId, task.id, now).run();

      // Credit wallet reward coins and spin credits
      await db.prepare(`
        UPDATE wallets
        SET balance = balance + ?, spin_credits = spin_credits + ?, updated_at = ?
        WHERE user_telegram_id = ?
      `).bind(task.reward_coins, task.reward_spins, now, auth.telegramId).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: `Claimed ${task.reward_coins.toLocaleString()} coins and ${task.reward_spins} lucky spin!`,
          rewardCoins: task.reward_coins,
          rewardSpins: task.reward_spins,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // POST /api/tasks/checkin (Daily Check-in)
  if (request.method === 'POST' && url.pathname === '/api/tasks/checkin') {
    const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(auth.telegramId).first();
    const today = new Date().toISOString().split('T')[0];

    if (user?.last_check_in === today) {
      return new Response(JSON.stringify({ error: 'Already checked in today' }), { status: 400 });
    }

    const currentStreak = user?.last_check_in ? (user.daily_streak || 0) + 1 : 1;
    const rewardCoins = 5000 + Math.min(currentStreak * 1000, 20000);
    const rewardSpins = currentStreak % 3 === 0 ? 2 : 1;

    await db.prepare(`
      UPDATE users
      SET daily_streak = ?, last_check_in = ?, updated_at = datetime('now')
      WHERE telegram_id = ?
    `).bind(currentStreak, today, auth.telegramId).run();

    await db.prepare(`
      UPDATE wallets
      SET balance = balance + ?, spin_credits = spin_credits + ?, updated_at = datetime('now')
      WHERE user_telegram_id = ?
    `).bind(rewardCoins, rewardSpins, auth.telegramId).run();

    return new Response(
      JSON.stringify({
        success: true,
        streak: currentStreak,
        rewardCoins,
        rewardSpins,
        message: `Day ${currentStreak} check-in success! Earned ${rewardCoins} coins + ${rewardSpins} spin.`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ error: 'Tasks endpoint not found' }), { status: 404 });
}
