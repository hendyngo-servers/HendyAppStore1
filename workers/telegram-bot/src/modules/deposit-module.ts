import { getBotDatabase } from '../db';
import { TelegramApiClient } from '../utils/telegram-api';
import { formatVND } from '../utils/formatters';

export async function handleDepositMenu(
  chatId: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const telegramApi = new TelegramApiClient(botToken);

  const text = `💳 <b>Top-Up Wallet Balance</b>

Instant deposit via VietQR automated bank transfer.
Select a package or enter a custom amount:`;

  const inlineKeyboard = [
    [
      { text: '50,000 VND', callback_data: 'dep_50000' },
      { text: '100,000 VND', callback_data: 'dep_100000' },
    ],
    [
      { text: '200,000 VND', callback_data: 'dep_200000' },
      { text: '500,000 VND (+5% bonus)', callback_data: 'dep_500000' },
    ],
    [
      { text: '1,000,000 VND (+10% bonus)', callback_data: 'dep_1000000' },
    ],
    [
      { text: '🔙 Back to Menu', callback_data: 'cmd_menu' },
    ],
  ];

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

export async function handleProcessDeposit(
  chatId: number,
  amount: number,
  botToken: string,
  cfDb?: any
): Promise<void> {
  const db = getBotDatabase(cfDb);
  const telegramApi = new TelegramApiClient(botToken);

  const memoCode = `HD${chatId.toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
  const txId = `dep_${Date.now()}`;

  await db.prepare(`
    INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, notes)
    VALUES (?, ?, ?, 'deposit', 'pending', ?, 'Telegram bot bank transfer')
  `).bind(txId, chatId, amount, memoCode).run();

  const bankName = 'MBBank (Ngân hàng Quân Đội)';
  const accountNumber = '0988889999';
  const accountName = 'HENDY ECOSYSTEM';
  const qrUrl = `https://img.vietqr.io/image/970422-${accountNumber}-compact2.png?amount=${amount}&addInfo=${memoCode}&accountName=HENDY%20ECOSYSTEM`;

  const text = `🏦 <b>Automated Bank Transfer QR</b>

Please transfer the exact amount and memo content below. Our automated system will credit your balance within 3-10 seconds:

• <b>Bank:</b> <code>${bankName}</code>
• <b>Account Number:</b> <code>${accountNumber}</code>
• <b>Account Name:</b> <code>${accountName}</code>
• <b>Amount:</b> <code>${formatVND(amount)}</code>
• <b>Transfer Memo (CRITICAL):</b> <code>${memoCode}</code>

⚠️ <i>Important: You MUST include <code>${memoCode}</code> in your bank transfer description for instant automated crediting.</i>

Scan the VietQR code in your banking app:
${qrUrl}`;

  await telegramApi.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Check Balance Now', callback_data: 'cmd_menu' }],
        [{ text: '🔙 Back to Menu', callback_data: 'cmd_menu' }],
      ],
    },
  });
}
