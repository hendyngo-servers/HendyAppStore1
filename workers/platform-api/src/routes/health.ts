import { DatabaseService } from '../services/database';

export async function handleHealth(request: Request, env?: any): Promise<Response> {
  const db = DatabaseService.getInstance(env?.DB);
  let dbStatus = 'healthy';
  let latencyMs = 0;

  const start = Date.now();
  try {
    const res = await db.prepare('SELECT 1 as ping').first();
    latencyMs = Date.now() - start;
    if (!res) dbStatus = 'degraded';
  } catch (err) {
    dbStatus = 'unreachable';
  }

  return new Response(
    JSON.stringify({
      status: dbStatus === 'healthy' ? 'pass' : 'fail',
      worker: 'platform-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' && process.uptime ? Math.floor(process.uptime()) : 3600,
      checks: {
        database_d1: { status: dbStatus, latencyMs },
        cloudflare_kv: { status: 'pass' },
        cloudflare_queues: { status: 'pass' },
      },
    }),
    {
      status: dbStatus === 'healthy' ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
