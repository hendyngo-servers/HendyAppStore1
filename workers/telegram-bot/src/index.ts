import { dispatchTelegramUpdate, type TelegramUpdate } from './gateway/dispatcher';
import { createLogger } from '@packages/logger';

const logger = createLogger('telegram-bot');

export interface TelegramBotEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_ADMIN_IDS?: string;
  MINI_APP_URL?: string;
  DB?: any;
  KV_MAINTENANCE?: any;
  KV_BOT_CONFIG?: any;
}

export default {
  async fetch(request: Request, env: TelegramBotEnv = {}, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return new Response(JSON.stringify({
        status: 'healthy',
        worker: 'telegram-bot',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Webhook POST from Telegram
    if (request.method === 'POST') {
      // Optional secret token header check from Telegram
      const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (env.TELEGRAM_WEBHOOK_SECRET && secretHeader && secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
        logger.warn('Invalid Telegram webhook secret token');
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        const update = await request.json() as TelegramUpdate;
        const result = await dispatchTelegramUpdate(update, env);
        return new Response(JSON.stringify({ ok: true, result }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logger.error('Failed processing Telegram update', err);
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
