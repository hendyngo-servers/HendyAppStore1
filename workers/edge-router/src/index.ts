import { detectDevice } from './device-detect';
import { checkMaintenanceGuard, type MaintenanceConfig } from './maintenance-guard';
import { resolveClientLayout } from './layout-resolver';
import { createLogger } from '@packages/logger';

const logger = createLogger('edge-router');

export interface EdgeRouterEnv {
  KV_MAINTENANCE?: {
    get: (key: string) => Promise<string | null>;
  };
  PLATFORM_API_SERVICE?: {
    fetch: (request: Request) => Promise<Response>;
  };
  TELEGRAM_BOT_SERVICE?: {
    fetch: (request: Request) => Promise<Response>;
  };
  ENVIRONMENT?: string;
  MAINTENANCE_OVERRIDE_KEY?: string;
}

export default {
  async fetch(request: Request, env: EdgeRouterEnv = {}, ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const start = Date.now();

    // 1. Device detection
    const device = detectDevice(request);

    // 2. Maintenance guard check (via KV or fallback)
    let maintenanceConfig: MaintenanceConfig = {
      isActive: false,
      message: 'System upgrade in progress.',
      allowedIps: ['127.0.0.1'],
      bypassSecret: env.MAINTENANCE_OVERRIDE_KEY || 'hendy_bypass_2026',
    };

    if (env.KV_MAINTENANCE) {
      try {
        const raw = await env.KV_MAINTENANCE.get('status');
        if (raw) {
          const parsed = JSON.parse(raw);
          maintenanceConfig = { ...maintenanceConfig, ...parsed };
        }
      } catch (err) {
        logger.warn('Failed reading maintenance KV', { err });
      }
    }

    const guardResult = checkMaintenanceGuard(request, maintenanceConfig);
    if (guardResult.blocked && guardResult.response) {
      logger.info('Request blocked by maintenance guard', { path: url.pathname, ip: device.ipAddress });
      return guardResult.response;
    }

    // 3. Layout Resolution
    const layout = resolveClientLayout(device, url.pathname);

    // 4. Perimeter Routing
    logger.debug('Perimeter route dispatch', {
      path: url.pathname,
      device: device.type,
      layout,
      durationMs: Date.now() - start,
    });

    // Add security and device headers to downstream requests
    const headers = new Headers(request.headers);
    headers.set('X-Edge-Device-Type', device.type);
    headers.set('X-Edge-Layout', layout);
    headers.set('X-Edge-Country', device.country || 'VN');

    // Telegram Bot Webhook Route
    if (url.pathname === '/webhook/telegram' || url.pathname.startsWith('/bot')) {
      if (env.TELEGRAM_BOT_SERVICE) {
        return env.TELEGRAM_BOT_SERVICE.fetch(new Request(request, { headers }));
      }
      return new Response(JSON.stringify({ status: 'telegram_bot_routed' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Platform API Route
    if (url.pathname.startsWith('/api/')) {
      if (env.PLATFORM_API_SERVICE) {
        return env.PLATFORM_API_SERVICE.fetch(new Request(request, { headers }));
      }
      return new Response(JSON.stringify({ status: 'platform_api_routed', layout }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default response showing Edge Router status
    return new Response(
      JSON.stringify({
        message: 'HendyAppStore Edge Router Online',
        device,
        layout,
        maintenanceActive: maintenanceConfig.isActive,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  },
};
