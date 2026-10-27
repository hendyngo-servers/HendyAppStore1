import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleAdminMenu(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first('count');
  const totalBalance = await db.prepare('SELECT SUM(balance) as total FROM wallets').first('total');
  const totalSales = await db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = "purchase"').first('total');
  const pendingDeposits = await db.prepare('SELECT COUNT(*) as count FROM transactions WHERE type = "deposit" AND status = "pending"').first('count');

  const text = `🛠️ <b>HendyAppStore — Telegram Admin Console</b>

📊 <b>Live Platform Metrics:</b>
• Total Registered Users: <b>${totalUsers || 0}</b>
• Total Wallet Balances: <b>${formatVND(totalBalance || 0)}</b>
• Total Code Sales: <b>${formatVND(totalSales || 0)}</b>
• Pending Bank Deposits: <b>${pendingDeposits || 0}</b>

Select an administrative action below:`;

  const inlineKeyboard = [
    [
      { text: '📢 New Mass Broadcast', callback_data: 'adm_broadcast_prompt' },
    ],
    [
      { text: '⚠️ Toggle Maintenance Mode', callback_data: 'adm_toggle_maint' },
    ],
    [
      { text: '🔙 Back to User Menu', callback_data: 'cmd_menu' },
    ],
  ];

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

export async function handleAdminToggleMaintenance(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const current = await db.prepare('SELECT enabled FROM feature_flags WHERE key = "maintenance_mode"').first() as any;
  const newStatus = current?.enabled === 1 ? 0 : 1;

  await db.prepare('UPDATE feature_flags SET enabled = ?, updated_at = datetime("now") WHERE key = "maintenance_mode"').bind(newStatus).run();

  await telegramApi.sendMessage(
    chatId,
    `⚠️ <b>Maintenance Mode Updated:</b> ${newStatus === 1 ? '🔴 ACTIVE (All non-admin traffic blocked)' : '🟢 DEACTIVATED (Normal operations resumed)'}`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'cmd_admin' }]],
      },
    }
  );
}
