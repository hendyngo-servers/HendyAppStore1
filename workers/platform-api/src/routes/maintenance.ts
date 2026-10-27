import { DatabaseService } from '../services/database';
import { KVService } from '../services/kv';
import { verifyApiRequestAuth } from '../auth';

export async function handleMaintenance(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const kv = new KVService('maintenance', env?.KV_MAINTENANCE);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  // GET /api/maintenance/status
  if (request.method === 'GET' && url.pathname === '/api/maintenance/status') {
    const raw = await kv.getJSON<any>('status');
    return new Response(
      JSON.stringify(raw || { isActive: false, message: 'Systems operating normally' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // POST /api/maintenance/toggle (Admin Emergency Kill-switch)
  if (request.method === 'POST' && url.pathname === '/api/maintenance/toggle') {
    if (auth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    try {
      const body = await request.json() as {
        isActive: boolean;
        message?: string;
        allowedIps?: string[];
        estimatedResolution?: string;
      };

      const payload = {
        isActive: body.isActive,
        message: body.message || 'System maintenance in progress',
        allowedIps: body.allowedIps || ['127.0.0.1'],
        estimatedResolution: body.estimatedResolution || '30 minutes',
        updatedAt: new Date().toISOString(),
      };

      await kv.put('status', JSON.stringify(payload));

      // Also log to audit table
      await db.prepare(`
        INSERT INTO audit_logs (id, actor_telegram_id, actor_role, action, target_resource, target_id, changes_diff)
        VALUES (?, ?, 'admin', 'MAINTENANCE_TOGGLE', 'system', 'maintenance_status', ?)
      `).bind(
        `audit_${Date.now()}`,
        auth.telegramId || 0,
        JSON.stringify(payload)
      ).run();

      return new Response(JSON.stringify({ success: true, maintenance: payload }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Maintenance endpoint not found' }), { status: 404 });
}
