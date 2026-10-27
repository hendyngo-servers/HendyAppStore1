import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleGiftcodeRedeem(
  chatId: number,
  code: string,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const cleanCode = code.trim().toUpperCase();

  // Check special promo giftcodes
  if (cleanCode === 'WELCOME2026' || cleanCode === 'HENDYFREE') {
    const checkUsed = await db.prepare('SELECT * FROM transactions WHERE user_telegram_id = ? AND reference_code = ?').bind(chatId, `GIFT_${cleanCode}`).first();
    if (checkUsed) {
      await telegramApi.sendMessage(chatId, '❌ You have already redeemed this promotional giftcode.');
      return;
    }

    const rewardCoins = 20000;
    const rewardSpins = 2;

    await db.prepare('UPDATE wallets SET balance = balance + ?, spin_credits = spin_credits + ? WHERE user_telegram_id = ?').bind(rewardCoins, rewardSpins, chatId).run();
    await db.prepare(`
      INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, notes)
      VALUES (?, ?, ?, 'bonus', 'completed', ?, 'Redeemed Promo Giftcode')
    `).bind(`gift_${Date.now()}`, chatId, rewardCoins, `GIFT_${cleanCode}`).run();

    await telegramApi.sendMessage(
      chatId,
      `🎉 <b>Promo Code Redeemed!</b>\n\nCode: <code>${cleanCode}</code>\nReward: <b>+${formatVND(rewardCoins)}</b> and <b>+${rewardSpins} Lucky Spins</b>!`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }]],
        },
      }
    );
    return;
  }

  await telegramApi.sendMessage(chatId, '❌ Invalid or expired giftcode. Please verify and try again.');
}
