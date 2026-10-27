import { DatabaseService } from '../services/database';
import { KVService } from '../services/kv';
import { evaluateFeatureFlag } from '../../../../packages/feature-flags/src/evaluator';
import { verifyApiRequestAuth } from '../auth';
import type { FeatureFlag } from '../../../../packages/types/src';

export async function handleFeatures(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const kv = new KVService('feature-flags', env?.KV_FEATURE_FLAGS);
  const auth = verifyApiRequestAuth(request, env || {});

  // GET /api/features (Evaluated feature flags for client)
  if (request.method === 'GET' && url.pathname === '/api/features') {
    const { results } = await db.prepare('SELECT * FROM feature_flags').all();

    const flags: Record<string, boolean> = {};
    for (const raw of results) {
      const flag: FeatureFlag = {
        key: raw.key,
        name: raw.name,
        description: raw.description,
        enabled: Boolean(raw.enabled),
        rolloutPercentage: raw.rollout_percentage,
        allowedRoles: raw.allowed_roles ? JSON.parse(raw.allowed_roles) : undefined,
        allowedTelegramIds: raw.allowed_telegram_ids ? JSON.parse(raw.allowed_telegram_ids) : undefined,
        environment: raw.environment,
        updated_at: raw.updated_at,
      };

      flags[flag.key] = evaluateFeatureFlag(flag, {
        telegramId: auth.telegramId,
        role: auth.role,
        environment: env?.ENVIRONMENT || 'production',
      });
    }

    return new Response(JSON.stringify({ flags }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/features/raw (Admin listing with full flag definitions)
  if (request.method === 'GET' && url.pathname === '/api/features/raw') {
    if (auth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    const { results } = await db.prepare('SELECT * FROM feature_flags ORDER BY key ASC').all();
    return new Response(JSON.stringify({ flags: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/features/toggle (Admin toggle flag in D1 and cache in KV)
  if (request.method === 'POST' && url.pathname === '/api/features/toggle') {
    if (auth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    try {
      const body = await request.json() as { key: string; enabled: boolean };
      await db.prepare(`
        UPDATE feature_flags
        SET enabled = ?, updated_at = datetime('now')
        WHERE key = ?
      `).bind(body.enabled ? 1 : 0, body.key).run();

      await kv.put(`flag_${body.key}`, JSON.stringify({ enabled: body.enabled }));

      return new Response(JSON.stringify({ success: true, key: body.key, enabled: body.enabled }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Features endpoint not found' }), { status: 404 });
}
