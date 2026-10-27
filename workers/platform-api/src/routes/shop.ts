import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

export async function handleShop(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);

  // GET /api/shop/items
  if (request.method === 'GET' && (url.pathname === '/api/shop/items' || url.pathname === '/api/shop')) {
    const category = url.searchParams.get('category');
    let query = 'SELECT * FROM products WHERE is_active = 1';
    let params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY price ASC';

    const { results } = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({ items: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/shop/inventory (Purchased codes history for current user)
  if (request.method === 'GET' && url.pathname === '/api/shop/inventory') {
    const auth = verifyApiRequestAuth(request, env || {});
    if (!auth.isAuthenticated || !auth.telegramId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { results } = await db.prepare(`
      SELECT c.id, c.code_value, c.redeemed_at, p.title, p.category, p.sku
      FROM code_inventory c
      JOIN products p ON c.product_id = p.id
      WHERE c.redeemed_by = ?
      ORDER BY c.redeemed_at DESC
    `).bind(auth.telegramId).all();

    return new Response(JSON.stringify({ codes: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/shop/purchase
  if (request.method === 'POST' && url.pathname === '/api/shop/purchase') {
    const auth = verifyApiRequestAuth(request, env || {});
    if (!auth.isAuthenticated || !auth.telegramId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
      const body = await request.json() as { productId: string };
      const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(body.productId).first();

      if (!product || !product.is_active) {
        return new Response(JSON.stringify({ error: 'Product not found or unavailable' }), { status: 404 });
      }

      // Check user wallet
      const wallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(auth.telegramId).first();
      if (!wallet) {
        return new Response(JSON.stringify({ error: 'Wallet not initialized' }), { status: 400 });
      }

      // Calculate final price with VIP discount if applicable
      const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(auth.telegramId).first();
      const isVip = user?.role === 'vip' || (user?.vip_expires_at && user.vip_expires_at > Date.now());
      const discount = isVip ? (product.vip_discount_percent || 0) : 0;
      const finalPrice = product.price * (1 - discount / 100);

      if (wallet.balance < finalPrice) {
        return new Response(JSON.stringify({
          error: 'Insufficient balance',
          balance: wallet.balance,
          required: finalPrice,
        }), { status: 400 });
      }

      // Find available code from inventory
      const codeItem = await db.prepare(`
        SELECT * FROM code_inventory
        WHERE product_id = ? AND is_redeemed = 0
        LIMIT 1
      `).bind(product.id).first();

      if (!codeItem) {
        return new Response(JSON.stringify({ error: 'Item out of stock. Please check back later.' }), { status: 409 });
      }

      // Atomic updates:
      // 1. Mark code redeemed
      const now = new Date().toISOString();
      await db.prepare(`
        UPDATE code_inventory
        SET is_redeemed = 1, redeemed_by = ?, redeemed_at = ?
        WHERE id = ?
      `).bind(auth.telegramId, now, codeItem.id).run();

      // 2. Decrement wallet balance and increment total_spent
      await db.prepare(`
        UPDATE wallets
        SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ?
        WHERE user_telegram_id = ?
      `).bind(finalPrice, finalPrice, now, auth.telegramId).run();

      // 3. Update product stock count
      await db.prepare(`
        UPDATE products
        SET stock_count = MAX(0, stock_count - 1)
        WHERE id = ?
      `).bind(product.id).run();

      // 4. Record transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const refCode = `BUY_${Date.now().toString(36).toUpperCase()}`;
      await db.prepare(`
        INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, product_id, code_inventory_id, notes)
        VALUES (?, ?, ?, 'purchase', 'completed', ?, ?, ?, ?)
      `).bind(txId, auth.telegramId, finalPrice, refCode, product.id, codeItem.id, `Purchased: ${product.title}`).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Purchase completed successfully!',
          product: { title: product.title, price: finalPrice },
          code: codeItem.code_value,
          referenceCode: refCode,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Shop endpoint not found' }), { status: 404 });
}
