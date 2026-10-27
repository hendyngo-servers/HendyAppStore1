import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';
import { getBotDatabase } from '../db';

export async function handleStartAndMenu(
  chatId: number,
  user: any,
  botToken: string,
  miniAppUrl?: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);
  const wallet = await db.prepare('SELECT balance, spin_credits FROM wallets WHERE user_telegram_id = ?').bind(chatId).first() as any;

  const isVip = user.role === 'vip' || (user.vip_expires_at && user.vip_expires_at > Date.now());
  const balanceStr = formatVND(wallet?.balance || 0);
  const spinsStr = wallet?.spin_credits || 0;
  const webAppTarget = miniAppUrl || 'https://ais-dev-renq7se3xgwcgnpbpakgtp-244078512104.asia-southeast1.run.app';

  const text = `👋 Hello <b>${user.first_name || 'Friend'}</b>!
Welcome to <b>Hendy AppStore Ecosystem</b> 🚀

💳 <b>Balance:</b> <code>${balanceStr}</code>
🎡 <b>Lucky Spins:</b> <code>${spinsStr} remaining</code>
👑 <b>Status:</b> ${isVip ? '⭐ <b>VIP Elite</b>' : 'Standard Member'}

Select an option below to buy game & app codes, top up your wallet, or participate in daily events:`;

  const inlineKeyboard = [
    [
      { text: '📱 Open Mini App Store', web_app: { url: webAppTarget } },
    ],
    [
      { text: '🛒 Browse Code Shop', callback_data: 'cmd_shop' },
      { text: '💳 Deposit Balance', callback_data: 'cmd_deposit' },
    ],
    [
      { text: '🎡 Lucky Wheel Spin', callback_data: 'cmd_spin' },
      { text: '💎 VIP Club', callback_data: 'cmd_vip' },
    ],
    [
      { text: '📋 Daily Tasks', callback_data: 'cmd_tasks' },
      { text: '👥 Invite Friends', callback_data: 'cmd_referral' },
    ],
    [
      { text: '🎁 Redeem Giftcode', callback_data: 'cmd_giftcode' },
      { text: '📜 My Order History', callback_data: 'cmd_history' },
    ],
  ];

  if (user.role === 'admin') {
    inlineKeyboard.push([
      { text: '🛠️ Admin Command Center', callback_data: 'cmd_admin' },
    ]);
  }

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}
