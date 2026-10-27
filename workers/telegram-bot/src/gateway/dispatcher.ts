import { checkBotAuthGuard } from './auth-guard';
import { checkBotMaintenance } from './maintenance-check';
import { handleStartAndMenu } from '../modules/menu-module';
import { handleShopMenu, handlePurchaseItem, handleOrderHistory } from '../modules/shop-code-module';
import { handleDepositMenu, handleProcessDeposit } from '../modules/deposit-module';
import { handleMinigameSpin } from '../modules/minigame-module';
import { handleVipMenu, handleBuyVipPass } from '../modules/vip-module';
import { handleGiftcodeRedeem } from '../modules/giftcode-module';
import { handleTasksMenu, handleClaimTask } from '../modules/social-module';
import { handleReferralStart, handleReferralMenu } from '../modules/referral-module';
import { handleAdminMenu, handleAdminToggleMaintenance } from '../modules/admin-module';
import { TelegramApiClient } from '../utils/telegram-api';
import { createLogger } from '@packages/logger';

const logger = createLogger('telegram-dispatcher');

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

export async function dispatchTelegramUpdate(
  update: TelegramUpdate,
  env: {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_BOT_USERNAME?: string;
    TELEGRAM_ADMIN_IDS?: string;
    MINI_APP_URL?: string;
    DB?: any;
    KV_MAINTENANCE?: any;
  }
): Promise<{ success: boolean; action: string }> {
  const botToken = env.TELEGRAM_BOT_TOKEN || 'dummy_token';
  const telegramApi = new TelegramApiClient(botToken);

  // 1. Handle regular text messages
  if (update.message && update.message.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const fromUser = msg.from;
    const text = msg.text.trim();

    logger.info('Incoming Telegram message', { chatId, text, from: fromUser.username });

    // Auth Guard
    const guard = await checkBotAuthGuard(
      fromUser.id,
      { username: fromUser.username, first_name: fromUser.first_name, last_name: fromUser.last_name },
      env.TELEGRAM_ADMIN_IDS,
      env.DB
    );

    if (!guard.allowed) {
      if (guard.rejectionMessage) {
        await telegramApi.sendMessage(chatId, guard.rejectionMessage);
      }
      return { success: false, action: 'banned_user_blocked' };
    }

    // Maintenance Guard
    const maint = await checkBotMaintenance(guard.isAdmin, env.DB, env.KV_MAINTENANCE);
    if (maint.isMaintenance && maint.message) {
      await telegramApi.sendMessage(chatId, maint.message);
      return { success: true, action: 'maintenance_message_sent' };
    }

    // Deep-linked /start ref_123 handler
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1 && parts[1].startsWith('ref_')) {
        await handleReferralStart(parts[1], fromUser.id, botToken, env.DB);
      }
      await handleStartAndMenu(chatId, guard.user, botToken, env.MINI_APP_URL, env.DB);
      return { success: true, action: 'start_dispatched' };
    }

    // Command routing
    if (text === '/menu') {
      await handleStartAndMenu(chatId, guard.user, botToken, env.MINI_APP_URL, env.DB);
      return { success: true, action: 'menu_dispatched' };
    }

    if (text === '/shop') {
      await handleShopMenu(chatId, botToken, env.DB);
      return { success: true, action: 'shop_dispatched' };
    }

    if (text === '/deposit') {
      await handleDepositMenu(chatId, botToken, env.DB);
      return { success: true, action: 'deposit_dispatched' };
    }

    if (text === '/spin') {
      await handleMinigameSpin(chatId, botToken, env.DB);
      return { success: true, action: 'spin_dispatched' };
    }

    if (text === '/vip') {
      await handleVipMenu(chatId, botToken, env.DB);
      return { success: true, action: 'vip_dispatched' };
    }

    if (text === '/tasks') {
      await handleTasksMenu(chatId, botToken, env.DB);
      return { success: true, action: 'tasks_dispatched' };
    }

    if (text === '/referral' || text === '/invite') {
      await handleReferralMenu(chatId, env.TELEGRAM_BOT_USERNAME || 'HendyAppStoreBot', botToken, env.DB);
      return { success: true, action: 'referral_dispatched' };
    }

    if (text === '/history') {
      await handleOrderHistory(chatId, botToken, env.DB);
      return { success: true, action: 'history_dispatched' };
    }

    if (text.startsWith('/giftcode')) {
      const code = text.replace('/giftcode', '').trim();
      if (!code) {
        await telegramApi.sendMessage(chatId, 'Usage: <code>/giftcode &lt;CODE&gt;</code>\nExample: <code>/giftcode WELCOME2026</code>');
      } else {
        await handleGiftcodeRedeem(chatId, code, botToken, env.DB);
      }
      return { success: true, action: 'giftcode_dispatched' };
    }

    if (text === '/admin') {
      if (!guard.isAdmin) {
        await telegramApi.sendMessage(chatId, '⛔ Access Denied. Admin authorization required.');
        return { success: false, action: 'admin_denied' };
      }
      await handleAdminMenu(chatId, botToken, env.DB);
      return { success: true, action: 'admin_dispatched' };
    }

    // Default fallback
    await handleStartAndMenu(chatId, guard.user, botToken, env.MINI_APP_URL, env.DB);
    return { success: true, action: 'default_menu_fallback' };
  }

  // 2. Handle Inline Keyboard Callback Queries
  if (update.callback_query && update.callback_query.data) {
    const cb = update.callback_query;
    const data = cb.data;
    const chatId = cb.message ? cb.message.chat.id : cb.from.id;
    const fromUser = cb.from;

    logger.info('Incoming Telegram callback query', { chatId, data });

    // Answer callback query quickly
    await telegramApi.answerCallbackQuery(cb.id);

    const guard = await checkBotAuthGuard(fromUser.id, { username: fromUser.username, first_name: fromUser.first_name }, env.TELEGRAM_ADMIN_IDS, env.DB);
    if (!guard.allowed) return { success: false, action: 'banned_user' };

    if (data === 'cmd_menu') {
      await handleStartAndMenu(chatId, guard.user, botToken, env.MINI_APP_URL, env.DB);
      return { success: true, action: 'cb_menu' };
    }

    if (data === 'cmd_shop') {
      await handleShopMenu(chatId, botToken, env.DB);
      return { success: true, action: 'cb_shop' };
    }

    if (data === 'cmd_deposit') {
      await handleDepositMenu(chatId, botToken, env.DB);
      return { success: true, action: 'cb_deposit' };
    }

    if (data === 'cmd_spin') {
      await handleMinigameSpin(chatId, botToken, env.DB);
      return { success: true, action: 'cb_spin' };
    }

    if (data === 'cmd_vip') {
      await handleVipMenu(chatId, botToken, env.DB);
      return { success: true, action: 'cb_vip' };
    }

    if (data === 'cmd_tasks') {
      await handleTasksMenu(chatId, botToken, env.DB);
      return { success: true, action: 'cb_tasks' };
    }

    if (data === 'cmd_referral') {
      await handleReferralMenu(chatId, env.TELEGRAM_BOT_USERNAME || 'HendyAppStoreBot', botToken, env.DB);
      return { success: true, action: 'cb_referral' };
    }

    if (data === 'cmd_history') {
      await handleOrderHistory(chatId, botToken, env.DB);
      return { success: true, action: 'cb_history' };
    }

    if (data === 'cmd_giftcode') {
      await telegramApi.sendMessage(chatId, '🎁 To redeem a promotional code, send: <code>/giftcode WELCOME2026</code>');
      return { success: true, action: 'cb_giftcode_prompt' };
    }

    if (data.startsWith('buy_vip_pass')) {
      await handleBuyVipPass(chatId, botToken, env.DB);
      return { success: true, action: 'cb_buy_vip' };
    }

    if (data.startsWith('buy_')) {
      const prodId = data.replace('buy_', '');
      await handlePurchaseItem(chatId, prodId, botToken, env.DB);
      return { success: true, action: `cb_buy_${prodId}` };
    }

    if (data.startsWith('dep_')) {
      const amount = parseInt(data.replace('dep_', ''), 10);
      await handleProcessDeposit(chatId, amount, botToken, env.DB);
      return { success: true, action: `cb_deposit_${amount}` };
    }

    if (data.startsWith('claim_')) {
      const taskId = data.replace('claim_', '');
      await handleClaimTask(chatId, taskId, botToken, env.DB);
      return { success: true, action: `cb_claim_${taskId}` };
    }

    if (data === 'cmd_admin') {
      if (!guard.isAdmin) return { success: false, action: 'admin_denied' };
      await handleAdminMenu(chatId, botToken, env.DB);
      return { success: true, action: 'cb_admin' };
    }

    if (data === 'adm_toggle_maint') {
      if (!guard.isAdmin) return { success: false, action: 'admin_denied' };
      await handleAdminToggleMaintenance(chatId, botToken, env.DB);
      return { success: true, action: 'cb_adm_toggle_maint' };
    }
  }

  return { success: false, action: 'unknown_update_structure' };
}
