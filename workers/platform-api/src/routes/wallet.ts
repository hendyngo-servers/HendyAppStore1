import { DatabaseService } from '../services/database';
import { verifyApiRequestAuth } from '../auth';

export async function handleWallet(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const db = DatabaseService.getInstance(env?.DB);
  const auth = verifyApiRequestAuth(request, env || {});

  if (!auth.isAuthenticated || !auth.telegramId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // GET /api/wallet
  if (request.method === 'GET' && url.pathname === '/api/wallet') {
    const wallet = await db.prepare('SELECT * FROM wallets WHERE user_telegram_id = ?').bind(auth.telegramId).first();
    const user = await db.prepare('SELECT role, vip_expires_at FROM users WHERE telegram_id = ?').bind(auth.telegramId).first();

    return new Response(
      JSON.stringify({
        wallet: wallet || { balance: 0, spin_credits: 0 },
        isVip: user?.role === 'vip' || (user?.vip_expires_at && user.vip_expires_at > Date.now()),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // GET /api/wallet/history
  if (request.method === 'GET' && url.pathname === '/api/wallet/history') {
    const { results } = await db.prepare(`
      SELECT * FROM transactions
      WHERE user_telegram_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(auth.telegramId).all();

    return new Response(JSON.stringify({ transactions: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/wallet/deposit (Initiate deposit transaction with bank VietQR)
  if (request.method === 'POST' && url.pathname === '/api/wallet/deposit') {
    try {
      const body = await request.json() as { amount: number };
      const amount = Number(body.amount);

      if (isNaN(amount) || amount < 10000) {
        return new Response(JSON.stringify({ error: 'Minimum deposit is 10,000 VND' }), { status: 400 });
      }

      // Generate unique memo for automatic bank webhook reconciliation
      const memoCode = `HD${auth.telegramId.toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
      const txId = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      await db.prepare(`
        INSERT INTO transactions (id, user_telegram_id, amount, type, status, reference_code, notes)
        VALUES (?, ?, ?, 'deposit', 'pending', ?, ?)
      `).bind(txId, auth.telegramId, amount, memoCode, 'Awaiting automated bank transfer').run();

      // Quick VietQR deep link structure
      const bankBin = '970422'; // MBBank BIN
      const accountNumber = '0988889999';
      const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${memoCode}&accountName=HENDY%20ECOSYSTEM`;

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: txId,
          referenceCode: memoCode,
          amount,
          bankDetails: {
            bankName: 'MBBank (Military Bank)',
            accountNumber,
            accountName: 'HENDY ECOSYSTEM',
            memo: memoCode,
            qrUrl,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Wallet endpoint not found' }), { status: 404 });
}
