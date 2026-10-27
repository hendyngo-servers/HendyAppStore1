import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

export async function handleReleases(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);

  // GET /api/releases/latest
  if (request.method === 'GET' && url.pathname === '/api/releases/latest') {
    const platform = url.searchParams.get('platform') || 'ios';
    const release = await db.prepare(`
      SELECT * FROM app_releases
      WHERE platform = ? AND status = 'published'
      ORDER BY build_number DESC
      LIMIT 1
    `).bind(platform).first();

    return new Response(JSON.stringify({ release: release || null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/releases
  if (request.method === 'GET' && url.pathname === '/api/releases') {
    const { results } = await db.prepare(`
      SELECT * FROM app_releases ORDER BY build_number DESC LIMIT 20
    `).all();

    return new Response(JSON.stringify({ releases: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/releases (Admin publish new OTA release)
  if (request.method === 'POST' && url.pathname === '/api/releases') {
    const auth = verifyApiRequestAuth(request, env || {});
    if (auth.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    try {
      const body = await request.json() as any;
      const releaseId = `rel_${Date.now()}`;
      await db.prepare(`
        INSERT INTO app_releases (id, version, build_number, platform, download_url, manifest_url, release_notes, is_mandatory, sha256_checksum, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
      `).bind(
        releaseId,
        body.version,
        body.buildNumber || 1,
        body.platform || 'ios',
        body.downloadUrl,
        body.manifestUrl || null,
        body.releaseNotes || 'Bug fixes and performance improvements.',
        body.isMandatory ? 1 : 0,
        body.sha256Checksum || null
      ).run();

      return new Response(JSON.stringify({ success: true, releaseId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Releases endpoint not found' }), { status: 404 });
}
