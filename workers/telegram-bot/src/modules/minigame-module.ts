import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

const WHEEL_PRIZES = [
  { label: '💰 10,000 Coins', type: 'coins', value: 10000, weight: 35 },
  { label: '💰 25,000 Coins', type: 'coins', value: 25000, weight: 25 },
  { label: '💰 50,000 Coins', type: 'coins', value: 50000, weight: 15 },
  { label: '💰 100,000 Coins', type: 'coins', value: 100000, weight: 8 },
  { label: '🎡 +2 Free Spins', type: 'spins', value: 2, weight: 10 },
  { label: '👑 3-Day VIP Elite Pass', type: 'vip_days', value: 3, weight: 5 },
  { label: '🔥 JACKPOT 500,000 Coins', type: 'coins', value: 500000, weight: 2 },
];

export async function handleMinigameSpin(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const wallet = await db.prepare('SELECT balance, spin_credits FROM wallets WHERE user_telegram_id = ?').bind(chatId).first() as any;

  if (!wallet || wallet.spin_credits < 1) {
    await telegramApi.sendMessage(
      chatId,
      `🎡 <b>Lucky Wheel Minigame</b>\n\n❌ <b>Out of Spins!</b>\nYou have <b>0</b> spin credits remaining.\n\nComplete daily tasks or invite friends to earn free spins!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Daily Tasks (+Spins)', callback_data: 'cmd_tasks' }],
            [{ text: '👥 Invite Friends (+Spins)', callback_data: 'cmd_referral' }],
            [{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }],
          ],
        },
      }
    );
    return;
  }

  // Deduct 1 spin credit
  await db.prepare('UPDATE wallets SET spin_credits = spin_credits - 1 WHERE user_telegram_id = ?').bind(chatId).run();

  // Weighted random pick
  const totalWeight = WHEEL_PRIZES.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * totalWeight;
  let prize = WHEEL_PRIZES[0];
  for (const p of WHEEL_PRIZES) {
    if (r < p.weight) {
      prize = p;
      break;
    }
    r -= p.weight;
  }

  // Grant prize
  if (prize.type === 'coins') {
    await db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_telegram_id = ?').bind(prize.value, chatId).run();
  } else if (prize.type === 'spins') {
    await db.prepare('UPDATE wallets SET spin_credits = spin_credits + ? WHERE user_telegram_id = ?').bind(prize.value, chatId).run();
  } else if (prize.type === 'vip_days') {
    const extraMs = Number(prize.value) * 86400 * 1000;
    const user = await db.prepare('SELECT vip_expires_at FROM users WHERE telegram_id = ?').bind(chatId).first() as any;
    const currentExpiry = user?.vip_expires_at && user.vip_expires_at > Date.now() ? user.vip_expires_at : Date.now();
    await db.prepare('UPDATE users SET role = "vip", vip_expires_at = ? WHERE telegram_id = ?').bind(currentExpiry + extraMs, chatId).run();
  }

  const historyId = `spin_${Date.now()}`;
  await db.prepare(`
    INSERT INTO minigame_history (id, user_telegram_id, game_key, prize_label, prize_type, prize_value)
    VALUES (?, ?, 'lucky_wheel', ?, ?, ?)
  `).bind(historyId, chatId, prize.label, prize.type, String(prize.value)).run();

  const remainingSpins = wallet.spin_credits - 1 + (prize.type === 'spins' ? Number(prize.value) : 0);

  const text = `🎡 <b>LUCKY WHEEL RESULT</b>\n\n🎉 Congratulations! You won:\n👉 <b>${prize.label}</b>\n\nYour prize has been instantly credited to your wallet!\n\n🎡 <b>Remaining Spins:</b> ${remainingSpins}`;

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        ...(remainingSpins > 0 ? [[{ text: '🎡 Spin Again!', callback_data: 'cmd_spin' }]] : []),
        [{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }],
      ],
    },
  });
}
