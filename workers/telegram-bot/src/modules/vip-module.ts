import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleVipMenu(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const user = await db.prepare('SELECT role, vip_expires_at FROM users WHERE telegram_id = ?').bind(chatId).first() as any;
  const isVip = user?.role === 'vip' || (user?.vip_expires_at && user.vip_expires_at > Date.now());

  let statusText = '👑 <b>VIP Status:</b> Inactive (Standard Member)';
  if (isVip && user.vip_expires_at) {
    const daysLeft = Math.max(0, Math.ceil((user.vip_expires_at - Date.now()) / (86400 * 1000)));
    statusText = `👑 <b>VIP Status:</b> <b>ACTIVE</b> (${daysLeft} days remaining)`;
  }

  const vipPrice = 99000;

  const text = `💎 <b>HendyAppStore VIP Elite Pass</b>\n\n${statusText}

<b>Exclusive VIP Privileges:</b>
⚡ <b>10% - 20% Extra Discount</b> on all digital code purchases
🎡 <b>+3 Free Lucky Wheel Spins</b> granted every single day
🚀 <b>Priority Instant Code Delivery</b> & direct VIP support channel
🎁 <b>Exclusive Gacha Drops</b> and unlisted product access

Subscription: <b>${formatVND(vipPrice)} / 30 Days</b>`;

  const inlineKeyboard = [
    [
      { text: `🌟 Upgrade to VIP (${formatVND(vipPrice)})`, callback_data: 'buy_vip_pass' },
    ],
    [
      { text: '🔙 Back to Menu', callback_data: 'cmd_menu' },
    ],
  ];

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

export async function handleBuyVipPass(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const vipPrice = 99000;
  const wallet = await db.prepare('SELECT balance FROM wallets WHERE user_telegram_id = ?').bind(chatId).first() as any;

  if (!wallet || wallet.balance < vipPrice) {
    await telegramApi.sendMessage(
      chatId,
      `⚠️ <b>Insufficient Balance</b>\n\nVIP Pass Price: <b>${formatVND(vipPrice)}</b>\nYour balance: <b>${formatVND(wallet?.balance || 0)}</b>\n\nPlease top up your wallet to activate VIP status.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Deposit Balance', callback_data: 'cmd_deposit' }],
            [{ text: '🔙 Return to VIP Club', callback_data: 'cmd_vip' }],
          ],
        },
      }
    );
    return;
  }

  // Deduct balance and extend VIP by 30 days
  const extraMs = 30 * 86400 * 1000;
  const user = await db.prepare('SELECT vip_expires_at FROM users WHERE telegram_id = ?').bind(chatId).first() as any;
  const currentExpiry = user?.vip_expires_at && user.vip_expires_at > Date.now() ? user.vip_expires_at : Date.now();
  const newExpiry = currentExpiry + extraMs;

  await db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = datetime("now") WHERE user_telegram_id = ?').bind(vipPrice, chatId).run();
  await db.prepare('UPDATE users SET role = "vip", vip_expires_at = ?, updated_at = datetime("now") WHERE telegram_id = ?').bind(newExpiry, chatId).run();

  // Record transaction
  const txId = `tx_vip_${Date.now()}`;
  await db.prepare(`
    INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, notes)
    VALUES (?, ?, ?, 'purchase', 'completed', ?, 'VIP Pass 30 Days')
  `).bind(txId, chatId, vipPrice, `VIP_${Date.now().toString(36).toUpperCase()}`).run();

  await telegramApi.sendMessage(
    chatId,
    `🎉 <b>Welcome to the VIP Club!</b>\n\nYour 30-day VIP Elite status has been successfully activated.\nEnjoy instant store discounts and daily bonus spins!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Shop with VIP Discount', callback_data: 'cmd_shop' }],
          [{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }],
        ],
      },
    }
  );
}
