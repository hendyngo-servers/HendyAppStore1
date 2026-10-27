import { handleHealth } from './routes/health';
import { handleAuth } from './routes/auth';
import { handleShop } from './routes/shop';
import { handleWallet } from './routes/wallet';
import { handleReleases } from './routes/releases';
import { handleAdmin } from './routes/admin';
import { handleWebhooks } from './routes/webhooks';
import { handleUsers } from './routes/users';
import { handleTasks } from './routes/tasks';
import { handleMinigames } from './routes/minigames';
import { handleMaintenance } from './routes/maintenance';
import { handleFeatures } from './routes/features';
import { createLogger } from '@packages/logger';

const logger = createLogger('platform-api');

export interface PlatformApiEnv {
  DB?: any;
  KV_FEATURE_FLAGS?: any;
  KV_MAINTENANCE?: any;
  KV_BOT_CONFIG?: any;
  QUEUE_BANK_SYNC?: any;
  QUEUE_BROADCAST?: any;
  QUEUE_OTA_BUILD?: any;
  API_ADMIN_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: PlatformApiEnv = {}, ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const start = Date.now();

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key, X-Telegram-Init-Data, X-User-Telegram-Id',
        },
      });
    }

    try {
      let response: Response;

      if (url.pathname === '/api/health' || url.pathname === '/health') {
        response = await handleHealth(request, env);
      } else if (url.pathname.startsWith('/api/auth')) {
        response = await handleAuth(request, env);
      } else if (url.pathname.startsWith('/api/shop')) {
        response = await handleShop(request, env);
      } else if (url.pathname.startsWith('/api/wallet')) {
        response = await handleWallet(request, env);
      } else if (url.pathname.startsWith('/api/releases')) {
        response = await handleReleases(request, env);
      } else if (url.pathname.startsWith('/api/admin')) {
        response = await handleAdmin(request, env);
      } else if (url.pathname.startsWith('/api/webhooks') || url.pathname.startsWith('/webhook')) {
        response = await handleWebhooks(request, env);
      } else if (url.pathname.startsWith('/api/users')) {
        response = await handleUsers(request, env);
      } else if (url.pathname.startsWith('/api/tasks')) {
        response = await handleTasks(request, env);
      } else if (url.pathname.startsWith('/api/minigames')) {
        response = await handleMinigames(request, env);
      } else if (url.pathname.startsWith('/api/maintenance')) {
        response = await handleMaintenance(request, env);
      } else if (url.pathname.startsWith('/api/features')) {
        response = await handleFeatures(request, env);
      } else {
        response = new Response(JSON.stringify({ error: 'Endpoint Not Found', path: url.pathname }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Add CORS headers to all responses
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('X-Response-Time-Ms', String(Date.now() - start));

      logger.debug('Handled API request', {
        method: request.method,
        path: url.pathname,
        status: response.status,
        duration: Date.now() - start,
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err: any) {
      logger.error('Unhandled exception in platform-api', err, { path: url.pathname });
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  },
};
