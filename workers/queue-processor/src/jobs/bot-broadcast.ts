import { DatabaseService } from '../../../platform-api/src/services/database';
import { TelegramApiClient } from '../../../telegram-bot/src/utils/telegram-api';
import { createLogger } from '@packages/logger';

const logger = createLogger('job-bot-broadcast');

export async function processBotBroadcastJob(
  jobData: { broadcastId: string; message: string; filterRole?: string },
  botToken?: string,
  cfDb?: any
): Promise<{ success: boolean; sentCount: number; failCount: number }> {
  const db = DatabaseService.getInstance(cfDb);
  const telegramApi = new TelegramApiClient(botToken || 'dummy_token');

  logger.info('Starting Telegram mass broadcast job', { broadcastId: jobData.broadcastId });

  // Update status to processing
  await db.prepare('UPDATE broadcast_history SET status = "processing" WHERE id = ?').bind(jobData.broadcastId).run();

  // Fetch recipients
  let query = 'SELECT telegram_id FROM users WHERE status = "active"';
  const params: any[] = [];
  if (jobData.filterRole && jobData.filterRole !== 'all') {
    query += ' AND role = ?';
    params.push(jobData.filterRole);
  }

  const { results: recipients } = await db.prepare(query).bind(...params).all();

  let sentCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    try {
      await telegramApi.sendMessage(
        recipient.telegram_id,
        `📢 <b>ANNOUNCEMENT</b>\n\n${jobData.message}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '📱 Open Store', callback_data: 'cmd_menu' }]],
          },
        }
      );
      sentCount++;
    } catch (err) {
      failCount++;
    }
  }

  // Update broadcast record
  await db.prepare(`
    UPDATE broadcast_history
    SET status = 'completed',
        total_recipients = ?,
        success_count = ?,
        fail_count = ?,
        completed_at = datetime('now')
    WHERE id = ?
  `).bind(recipients.length, sentCount, failCount, jobData.broadcastId).run();

  logger.info('Broadcast finished', { broadcastId: jobData.broadcastId, sentCount, failCount });
  return { success: true, sentCount, failCount };
}
