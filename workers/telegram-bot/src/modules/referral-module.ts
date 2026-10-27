import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleReferralStart(
  refPayload: string,
  newUserTelegramId: number,
  botToken: string,
  cfDb?: any
): Promise<number | null> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  // Parse referrer ID from payload: ref_12345 or 12345
  const rawId = refPayload.replace(/^ref_/, '');
  const referrerTelegramId = parseInt(rawId, 10);

  if (isNaN(referrerTelegramId) || referrerTelegramId === newUserTelegramId) {
    return null;
  }

  // Check if referrer exists
  const referrer = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(referrerTelegramId).first() as any;
  if (!referrer) {
    return null;
  }

  // Check if new user already has a referrer
  const user = await db.prepare('SELECT referrer_id FROM users WHERE telegram_id = ?').bind(newUserTelegramId).first() as any;
  if (user && user.referrer_id) {
    return user.referrer_id; // Already bound
  }

  // Bind referrer to new user
  await db.prepare('UPDATE users SET referrer_id = ? WHERE telegram_id = ?').bind(referrerTelegramId, newUserTelegramId).run();

  // Give referrer referral bonus (+1 spin credit and reward coins)
  const bonusCoins = 10000;
  await db.prepare(`
    UPDATE users
    SET referral_count = referral_count + 1,
        referral_earnings = referral_earnings + ?,
        updated_at = datetime('now')
    WHERE telegram_id = ?
  `).bind(bonusCoins, referrerTelegramId).run();

  await db.prepare(`
    UPDATE wallets
    SET balance = balance + ?, spin_credits = spin_credits + 1, updated_at = datetime('now')
    WHERE user_telegram_id = ?
  `).bind(bonusCoins, referrerTelegramId).run();

  // Notify referrer in Telegram
  await telegramApi.sendMessage(
    referrerTelegramId,
    `🎉 <b>New Referral Joined!</b>\n\nA new friend joined HendyAppStore through your link.\n🎁 Bonus: <b>+${formatVND(bonusCoins)}</b> and <b>+1 Lucky Spin Credit</b> credited to your balance!`
  );

  return referrerTelegramId;
}

export async function handleReferralMenu(
  chatId: number,
  botUsername: string,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);
  const user = await db.prepare('SELECT referral_count, referral_earnings FROM users WHERE telegram_id = ?').bind(chatId).first() as any;

  const botName = botUsername || 'HendyAppStoreBot';
  const refLink = `https://t.me/${botName}?start=ref_${chatId}`;

  const message = `👥 <b>Affiliate & Referral Center</b>

Share your unique invitation link with friends and gaming groups:
🔗 <code>${refLink}</code>

<b>Your Referral Stats:</b>
• Friends Invited: <b>${user?.referral_count || 0}</b>
• Total Earnings: <b>${formatVND(user?.referral_earnings || 0)}</b>

<b>Rewards per Referral:</b>
💰 <b>+10,000 VND</b> instant balance
🎡 <b>+1 Free Lucky Wheel Spin</b>
⭐ <b>5% Commission</b> on all code purchases made by your friends!`;

  await telegramApi.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📤 Share Link to Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join HendyAppStore for instant digital codes, game cards, and lucky spins!')}` },
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'cmd_menu' },
        ],
      ],
    },
  });
}
