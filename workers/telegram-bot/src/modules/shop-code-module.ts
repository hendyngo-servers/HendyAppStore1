import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleShopMenu(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const { results: products } = await db.prepare(`
    SELECT * FROM products WHERE is_active = 1 ORDER BY price ASC
  `).all();

  const user = await db.prepare('SELECT role, vip_expires_at FROM users WHERE telegram_id = ?').bind(chatId).first() as any;
  const isVip = user?.role === 'vip' || (user?.vip_expires_at && user.vip_expires_at > Date.now());

  let text = `🛒 <b>Hendy AppStore — Code Catalog</b>\n\nInstant digital keys with automatic warranty delivery:\n\n`;

  const buttons: any[] = [];

  for (const prod of products) {
    const discount = isVip ? (prod.vip_discount_percent || 0) : 0;
    const finalPrice = prod.price * (1 - discount / 100);
    const inStock = prod.stock_count > 0;

    text += `<b>${prod.title}</b>\n`;
    text += `• Price: <b>${formatVND(finalPrice)}</b> ${isVip ? `<i>(-${discount}% VIP)</i>` : ''}\n`;
    text += `• Stock: <b>${inStock ? `${prod.stock_count} available` : '❌ Out of stock'}</b>\n`;
    text += `• Info: ${prod.description}\n\n`;

    if (inStock) {
      buttons.push([
        { text: `Buy ${prod.title.slice(0, 20)} — ${formatVND(finalPrice)}`, callback_data: `buy_${prod.id}` },
      ]);
    }
  }

  buttons.push([
    { text: '💳 Deposit More Balance', callback_data: 'cmd_deposit' },
    { text: '🔙 Back to Menu', callback_data: 'cmd_menu' },
  ]);

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}

export async function handlePurchaseItem(
  chatId: number,
  productId: string,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first() as any;
  if (!product || !product.is_active) {
    await telegramApi.sendMessage(chatId, '❌ Product not found or currently unavailable.');
    return;
  }

  const wallet = await db.prepare('SELECT balance FROM wallets WHERE user_telegram_id = ?').bind(chatId).first() as any;
  const user = await db.prepare('SELECT role, vip_expires_at FROM users WHERE telegram_id = ?').bind(chatId).first() as any;
  const isVip = user?.role === 'vip' || (user?.vip_expires_at && user.vip_expires_at > Date.now());
  const discount = isVip ? (product.vip_discount_percent || 0) : 0;
  const finalPrice = product.price * (1 - discount / 100);

  if (!wallet || wallet.balance < finalPrice) {
    await telegramApi.sendMessage(
      chatId,
      `⚠️ <b>Insufficient Balance</b>\n\nPrice: <b>${formatVND(finalPrice)}</b>\nYour balance: <b>${formatVND(wallet?.balance || 0)}</b>\n\nPlease top up your wallet to proceed.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Deposit Now', callback_data: 'cmd_deposit' }],
            [{ text: '🔙 Return to Shop', callback_data: 'cmd_shop' }],
          ],
        },
      }
    );
    return;
  }

  // Fetch available code
  const codeItem = await db.prepare(`
    SELECT * FROM code_inventory WHERE product_id = ? AND is_redeemed = 0 LIMIT 1
  `).bind(product.id).first() as any;

  if (!codeItem) {
    await telegramApi.sendMessage(chatId, '❌ Sorry, this item is temporarily out of stock. Please check back later!');
    return;
  }

  // Atomically update
  const now = new Date().toISOString();
  await db.prepare('UPDATE code_inventory SET is_redeemed = 1, redeemed_by = ?, redeemed_at = ? WHERE id = ?').bind(chatId, now, codeItem.id).run();
  await db.prepare('UPDATE wallets SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ? WHERE user_telegram_id = ?').bind(finalPrice, finalPrice, now, chatId).run();
  await db.prepare('UPDATE products SET stock_count = MAX(0, stock_count - 1) WHERE id = ?').bind(product.id).run();

  const refCode = `BUY_${Date.now().toString(36).toUpperCase()}`;
  const txId = `tx_${Date.now()}`;
  await db.prepare(`
    INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, product_id, code_inventory_id, notes)
    VALUES (?, ?, ?, 'purchase', 'completed', ?, ?, ?, ?)
  `).bind(txId, chatId, finalPrice, refCode, product.id, codeItem.id, `Purchased: ${product.title}`).run();

  // Send purchase confirmation with copyable code
  const message = `✅ <b>Purchase Successful!</b>

📦 <b>Item:</b> ${product.title}
💰 <b>Paid:</b> <code>${formatVND(finalPrice)}</code>
🔖 <b>Order Ref:</b> <code>${refCode}</code>

🔑 <b>YOUR CODE / ACTIVATION KEY:</b>
<code>${codeItem.code_value}</code>
<i>(Tap the code above to copy to clipboard)</i>

⚠️ <i>Please activate your code immediately. All purchases include 24/7 warranty support.</i>`;

  await telegramApi.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📜 My Order History', callback_data: 'cmd_history' }],
        [{ text: '🛒 Continue Shopping', callback_data: 'cmd_shop' }],
      ],
    },
  });
}

export async function handleOrderHistory(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const { results: orders } = await db.prepare(`
    SELECT c.code_value, c.redeemed_at, p.title
    FROM code_inventory c
    JOIN products p ON c.product_id = p.id
    WHERE c.redeemed_by = ?
    ORDER BY c.redeemed_at DESC
    LIMIT 10
  `).bind(chatId).all();

  if (orders.length === 0) {
    await telegramApi.sendMessage(chatId, '📦 You have not purchased any digital codes yet.', {
      reply_markup: {
        inline_keyboard: [[{ text: '🛒 Browse Shop', callback_data: 'cmd_shop' }]],
      },
    });
    return;
  }

  let text = `📜 <b>Your Purchased Codes (Recent ${orders.length}):</b>\n\n`;
  for (const ord of orders) {
    text += `<b>${ord.title}</b>\n`;
    text += `Key: <code>${ord.code_value}</code>\n`;
    text += `Date: <i>${ord.redeemed_at}</i>\n\n`;
  }

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }]],
    },
  });
}
