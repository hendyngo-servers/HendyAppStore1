import { DatabaseService } from '../services/database';
import { QueueService } from '../services/queue';
import { verifyApiRequestAuth } from '../auth';

export async function handleAdmin(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  if (auth.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }

  // GET /api/admin/overview
  if (request.method === 'GET' && url.pathname === '/api/admin/overview') {
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first('count');
    const totalVip = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "vip"').first('count');
    const totalDeposits = await db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = "deposit" AND status = "completed"').first('total');
    const totalSales = await db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = "purchase" AND status = "completed"').first('total');
    const availableCodes = await db.prepare('SELECT COUNT(*) as count FROM code_inventory WHERE is_redeemed = 0').first('count');
    const activeProducts = await db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first('count');

    return new Response(
      JSON.stringify({
        stats: {
          totalUsers: totalUsers || 0,
          totalVip: totalVip || 0,
          totalDeposits: totalDeposits || 0,
          totalSales: totalSales || 0,
          availableCodes: availableCodes || 0,
          activeProducts: activeProducts || 0,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // POST /api/admin/broadcast (Queue-backed mass announcement)
  if (request.method === 'POST' && url.pathname === '/api/admin/broadcast') {
    try {
      const body = await request.json() as {
        message: string;
        filterRole?: string;
      };

      const broadcastQueue = new QueueService('telegram-broadcast-queue', env?.QUEUE_BROADCAST);
      const broadcastId = `bcast_${Date.now()}`;

      // Insert record
      await db.prepare(`
        INSERT INTO broadcast_history (id, sent_by_telegram_id, message_text, filter_role, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).bind(broadcastId, auth.telegramId, body.message, body.filterRole || 'all').run();

      // Enqueue job for Queue Processor Worker
      const job = await broadcastQueue.send('bot_broadcast', {
        broadcastId,
        message: body.message,
        filterRole: body.filterRole,
      });

      return new Response(
        JSON.stringify({
          success: true,
          broadcastId,
          jobId: job.jobId,
          message: 'Broadcast task queued for rate-limited async dispatch',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  // POST /api/admin/products (Create/update product)
  if (request.method === 'POST' && url.pathname === '/api/admin/products') {
    try {
      const body = await request.json() as any;
      const productId = body.id || `prod_${Date.now().toString(36)}`;

      await db.prepare(`
        INSERT INTO products (id, sku, title, description, category, price, vip_discount_percent, stock_count, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          price = excluded.price,
          vip_discount_percent = excluded.vip_discount_percent,
          stock_count = excluded.stock_count,
          is_active = excluded.is_active
      `).bind(
        productId,
        body.sku,
        body.title,
        body.description || '',
        body.category,
        body.price,
        body.vipDiscountPercent || 10,
        body.stockCount || 0,
        body.isActive !== false ? 1 : 0
      ).run();

      return new Response(JSON.stringify({ success: true, productId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  // POST /api/admin/codes (Bulk add code inventory)
  if (request.method === 'POST' && url.pathname === '/api/admin/codes') {
    try {
      const body = await request.json() as {
        productId: string;
        codes: string[];
      };

      let addedCount = 0;
      for (const code of body.codes) {
        if (!code || !code.trim()) continue;
        const codeId = `code_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await db.prepare(`
          INSERT INTO code_inventory (id, product_id, code_value, is_redeemed)
          VALUES (?, ?, ?, 0)
        `).bind(codeId, body.productId, code.trim()).run();
        addedCount++;
      }

      // Update product stock count
      await db.prepare(`
        UPDATE products
        SET stock_count = stock_count + ?
        WHERE id = ?
      `).bind(addedCount, body.productId).run();

      return new Response(JSON.stringify({ success: true, addedCount }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Admin endpoint not found' }), { status: 404 });
}
