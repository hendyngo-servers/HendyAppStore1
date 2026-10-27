export interface MaintenanceConfig {
  isActive: boolean;
  message: string;
  allowedIps: string[];
  bypassSecret?: string;
  estimatedResolution?: string;
}

export function checkMaintenanceGuard(
  request: Request,
  config: MaintenanceConfig
): { blocked: boolean; response?: Response } {
  if (!config.isActive) {
    return { blocked: false };
  }

  // Bypass via secret header or query
  const url = new URL(request.url);
  const bypassHeader = request.headers.get('x-maintenance-bypass');
  const bypassQuery = url.searchParams.get('bypass');

  if (config.bypassSecret && (bypassHeader === config.bypassSecret || bypassQuery === config.bypassSecret)) {
    return { blocked: false };
  }

  // IP whitelist check
  const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
  if (config.allowedIps.includes(clientIp)) {
    return { blocked: false };
  }

  // If requesting API / Webhook, return JSON 503
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/webhook')) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({
          error: 'Service Unavailable',
          maintenance: true,
          message: config.message || 'System maintenance in progress. Please check back shortly.',
          estimatedResolution: config.estimatedResolution || '30 minutes',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '300',
          },
        }
      ),
    };
  }

  // Return HTML maintenance screen for direct browsers
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>System Under Maintenance | HendyAppStore</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 24px; margin-bottom: 12px; color: #f59e0b; }
    p { color: #94a3b8; line-height: 1.6; font-size: 15px; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 9999px; color: #f59e0b; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">SYSTEM MAINTENANCE</div>
    <h1>We are currently updating</h1>
    <p>${config.message || 'HendyAppStore is performing scheduled server upgrades to improve speed and reliability.'}</p>
    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Estimated downtime: ${config.estimatedResolution || 'Under 30 minutes'}</p>
  </div>
</body>
</html>`;

  return {
    blocked: true,
    response: new Response(html, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '300',
      },
    }),
  };
}
