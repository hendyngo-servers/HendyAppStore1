import test from 'node:test';
import assert from 'node:assert/strict';
import TelegramBotWorker from '../index';
import { TelegramApiClient } from '../utils/telegram-api';
import { getBotDatabase } from '../db';

test('telegram-bot: processes /start and replies with ecosystem menu', async () => {
  TelegramApiClient.clearOutbound();

  const update = {
    update_id: 10001,
    message: {
      message_id: 1,
      from: { id: 123456789, is_bot: false, first_name: 'Hendy', username: 'hendy_admin' },
      chat: { id: 123456789, type: 'private' },
      text: '/start',
      date: Math.floor(Date.now() / 1000),
    },
  };

  const req = new Request('http://localhost/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  const res = await TelegramBotWorker.fetch(req);
  assert.equal(res.status, 200);

  const lastOutbound = TelegramApiClient.getLastOutbound();
  assert.ok(lastOutbound);
  assert.equal(lastOutbound.chat_id, 123456789);
  assert.ok(lastOutbound.text.includes('Hendy AppStore Ecosystem'));
  assert.ok(lastOutbound.reply_markup?.inline_keyboard);
});

test('telegram-bot: deep-linked /start ref_123 gives referrer reward', async () => {
  TelegramApiClient.clearOutbound();
  const db = getBotDatabase();

  const newUserId = 777888999;
  const referrerId = 123456789;

  // Get initial referral count
  const initialUser = await db.prepare('SELECT referral_count FROM users WHERE telegram_id = ?').bind(referrerId).first() as any;
  const initialCount = initialUser?.referral_count || 0;

  const update = {
    update_id: 10002,
    message: {
      message_id: 2,
      from: { id: newUserId, is_bot: false, first_name: 'InvitedFriend' },
      chat: { id: newUserId, type: 'private' },
      text: `/start ref_${referrerId}`,
      date: Math.floor(Date.now() / 1000),
    },
  };

  const req = new Request('http://localhost/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  await TelegramBotWorker.fetch(req);

  const updatedUser = await db.prepare('SELECT referral_count FROM users WHERE telegram_id = ?').bind(referrerId).first() as any;
  assert.equal(updatedUser.referral_count, initialCount + 1);
});

test('telegram-bot: handles callback query for shop menu', async () => {
  TelegramApiClient.clearOutbound();

  const update = {
    update_id: 10003,
    callback_query: {
      id: 'cb_query_999',
      from: { id: 123456789, first_name: 'Hendy' },
      message: { message_id: 50, chat: { id: 123456789 } },
      data: 'cmd_shop',
    },
  };

  const req = new Request('http://localhost/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  const res = await TelegramBotWorker.fetch(req);
  assert.equal(res.status, 200);

  const lastOutbound = TelegramApiClient.getLastOutbound();
  assert.ok(lastOutbound);
  assert.ok(lastOutbound.text.includes('Code Catalog'));
});
