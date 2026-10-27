import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleTasksMenu(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const { results: tasks } = await db.prepare('SELECT * FROM tasks WHERE is_active = 1').all();
  const { results: completed } = await db.prepare('SELECT task_id FROM user_task_progress WHERE user_telegram_id = ? AND is_completed = 1').bind(chatId).all();

  const completedSet = new Set(completed.map((c: any) => c.task_id));

  let text = `📋 <b>Daily Quest & Task Center</b>\n\nComplete social tasks to earn free coins and lucky wheel spins:\n\n`;
  const buttons: any[] = [];

  for (const t of tasks) {
    const isDone = completedSet.has(t.id);
    text += `${isDone ? '✅' : '⏳'} <b>${t.title}</b>\n`;
    text += `• Reward: <b>+${formatVND(t.reward_coins)}</b> & <b>+${t.reward_spins} spin</b>\n`;
    text += `• ${t.description}\n\n`;

    if (!isDone) {
      buttons.push([
        { text: `Claim: ${t.title.slice(0, 22)}`, callback_data: `claim_${t.id}` },
      ]);
    }
  }

  buttons.push([
    { text: '🔙 Back to Menu', callback_data: 'cmd_menu' },
  ]);

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}

export async function handleClaimTask(
  chatId: number,
  taskId: string,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first() as any;
  if (!task) {
    await telegramApi.sendMessage(chatId, '❌ Task not found.');
    return;
  }

  const existing = await db.prepare('SELECT * FROM user_task_progress WHERE user_telegram_id = ? AND task_id = ?').bind(chatId, taskId).first() as any;
  if (existing && existing.is_completed) {
    await telegramApi.sendMessage(chatId, '⚠️ You have already claimed this task reward!');
    return;
  }

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO user_task_progress (user_telegram_id, task_id, is_completed, completed_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_telegram_id, task_id) DO UPDATE SET is_completed = 1, completed_at = excluded.completed_at
  `).bind(chatId, taskId, now).run();

  await db.prepare('UPDATE wallets SET balance = balance + ?, spin_credits = spin_credits + ? WHERE user_telegram_id = ?').bind(task.reward_coins, task.reward_spins, chatId).run();

  await telegramApi.sendMessage(
    chatId,
    `🎉 <b>Task Completed!</b>\n\nReward: <b>+${formatVND(task.reward_coins)}</b> and <b>+${task.reward_spins} Lucky Spin</b> credited!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎡 Spin Lucky Wheel', callback_data: 'cmd_spin' }],
          [{ text: '🔙 Back to Tasks', callback_data: 'cmd_tasks' }],
        ],
      },
    }
  );
}
