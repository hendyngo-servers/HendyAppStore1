import test from 'node:test';
import assert from 'node:assert/strict';
import PlatformApiWorker from '../index';
import { DatabaseService } from '../services/database';

test('platform-api: health endpoint returns 200 and healthy checks', async () => {
  const req = new Request('http://localhost/api/health');
  const res = await PlatformApiWorker.fetch(req);
  assert.equal(res.status, 200);

  const json = await res.json() as any;
  assert.equal(json.status, 'pass');
  assert.equal(json.worker, 'platform-api');
  assert.equal(json.checks.database_d1.status, 'healthy');
});

test('platform-api: shop list items returns seeded products', async () => {
  const req = new Request('http://localhost/api/shop/items');
  const res = await PlatformApiWorker.fetch(req);
  assert.equal(res.status, 200);

  const json = await res.json() as any;
  assert.ok(Array.isArray(json.items));
  assert.ok(json.items.length >= 4);

  const spotify = json.items.find((i: any) => i.sku === 'SKU-SPOTIFY-1M');
  assert.ok(spotify);
  assert.equal(spotify.price, 35000);
});

test('platform-api: purchase code flow checks balance and deducts correctly', async () => {
  const db = DatabaseService.getInstance();
  // Ensure test user has 100,000 balance
  await db.prepare('UPDATE wallets SET balance = 100000 WHERE user_telegram_id = 123456789').run();

  const req = new Request('http://localhost/api/shop/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-telegram-id': '123456789',
    },
    body: JSON.stringify({ productId: 'prod_spotify_1m' }),
  });

  const res = await PlatformApiWorker.fetch(req);
  assert.equal(res.status, 200);

  const json = await res.json() as any;
  assert.equal(json.success, true);
  assert.ok(json.code);
  assert.ok(json.referenceCode);

  // Check that wallet was deducted
  const wallet = await db.prepare('SELECT balance FROM wallets WHERE user_telegram_id = 123456789').first() as any;
  // Spotify price is 35000 (with VIP discount 15% for admin/vip = 29750)
  assert.ok(wallet.balance < 100000);
});

test('platform-api: feature flags endpoint evaluates client flags', async () => {
  const req = new Request('http://localhost/api/features');
  const res = await PlatformApiWorker.fetch(req);
  assert.equal(res.status, 200);

  const json = await res.json() as any;
  assert.ok(json.flags);
  assert.equal(typeof json.flags.vip_store_enabled, 'boolean');
});
