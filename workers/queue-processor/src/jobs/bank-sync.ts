import { DatabaseService } from '../../../platform-api/src/services/database';
import { TelegramApiClient } from '../../../telegram-bot/src/utils/telegram-api';
import { formatVND } from '../../../telegram-bot/src/utils/formatters';
import { createLogger } from '@packages/logger';

const logger = createLogger('job-bank-sync');

export async function processBankSyncJob(
  jobData: { amount: number; memo: string; referenceNumber: string; receivedAt: string },
  botToken?: string,
  cfDb?: any
): Promise<{ success: boolean; transactionId?: string; userTelegramId?: number }> {
  const db = DatabaseService.getInstance(cfDb);
  const telegramApi = new TelegramApiClient(botToken || 'dummy_token');

  logger.info('Processing Bank Sync Job', jobData);

  // Match memo: e.g. "HD12349876" or contains it
  const memoMatch = jobData.memo.match(/HD\d{8}/i);
  const memoCode = memoMatch ? memoMatch[0].toUpperCase() : jobData.memo.trim().toUpperCase();

  // Find matching pending deposit transaction
  const tx = await db.prepare(`
    SELECT * FROM transactions
    WHERE (reference_code = ? OR reference_code LIKE ?) AND type = 'deposit' AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(memoCode, `%${memoCode}%`).first() as any;

  if (!tx) {
    logger.warn('No pending transaction matched for memo', { memoCode, amount: jobData.amount });
    return { success: false };
  }

  const depositAmount = jobData.amount;
  const userTelegramId = tx.user_telegram_id;
  const now = new Date().toISOString();

  // 1. Mark transaction completed
  await db.prepare(`
    UPDATE transactions
    SET status = 'completed', amount = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).bind(depositAmount, `Matched via bank webhook #${jobData.referenceNumber}`, now, tx.id).run();

  // 2. Increment wallet balance and total_deposited
  await db.prepare(`
    UPDATE wallets
    SET balance = balance + ?, total_deposited = total_deposited + ?, updated_at = ?
    WHERE user_telegram_id = ?
  `).bind(depositAmount, depositAmount, now, userTelegramId).run();

  // 3. Send Telegram notification to user
  try {
    const updatedWallet = await db.prepare('SELECT balance FROM wallets WHERE user_telegram_id = ?').bind(userTelegramId).first() as any;
    await telegramApi.sendMessage(
      userTelegramId,
      `🎉 <b>Deposit Credited!</b>\n\nAmount: <b>+${formatVND(depositAmount)}</b>\nReference: <code>${memoCode}</code>\nNew Balance: <b>${formatVND(updatedWallet?.balance || 0)}</b>\n\nThank you for using HendyAppStore!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Browse Store', callback_data: 'cmd_shop' }],
            [{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }],
          ],
        },
      }
    );
  } catch (err) {
    logger.warn('Could not send notification to user', err);
  }

  logger.info(`Successfully completed deposit for user ${userTelegramId}`, { amount: depositAmount, txId: tx.id });
  return { success: true, transactionId: tx.id, userTelegramId };
}
