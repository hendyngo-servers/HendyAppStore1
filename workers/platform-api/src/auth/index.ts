import crypto from 'node:crypto';
import type { UserRole } from '@packages/types';

export interface AuthContext {
  isAuthenticated: boolean;
  userId?: string;
  telegramId?: number;
  role: UserRole;
  error?: string;
}

export function parseAndVerifyTelegramInitData(
  initDataRaw: string,
  botToken: string
): { isValid: boolean; user?: any } {
  if (!initDataRaw) return { isValid: false };

  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) return { isValid: false };

    params.delete('hash');
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join('\n');

    // WebAppData secret key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isValid = calculatedHash === hash;
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : undefined;

    return { isValid, user };
  } catch {
    return { isValid: false };
  }
}

export function verifyApiRequestAuth(
  request: Request,
  env: { API_ADMIN_KEY?: string; TELEGRAM_BOT_TOKEN?: string; API_JWT_SECRET?: string }
): AuthContext {
  const adminKey = request.headers.get('x-admin-key');
  const configuredAdminKey = env.API_ADMIN_KEY || 'hendy_admin_secret_key_2026';

  // 1. Admin API Key Check
  if (adminKey && adminKey === configuredAdminKey) {
    return {
      isAuthenticated: true,
      telegramId: 123456789,
      role: 'admin',
    };
  }

  // 2. Telegram Mini App InitData Check
  const initData = request.headers.get('x-telegram-init-data');
  if (initData) {
    const botToken = env.TELEGRAM_BOT_TOKEN || 'dummy_token';
    const result = parseAndVerifyTelegramInitData(initData, botToken);
    if (result.isValid && result.user) {
      return {
        isAuthenticated: true,
        telegramId: result.user.id,
        role: 'user',
      };
    }
  }

  // 3. Fallback header for internal worker-to-worker or simulated testing
  const simulatedTelegramId = request.headers.get('x-user-telegram-id');
  if (simulatedTelegramId) {
    const tid = parseInt(simulatedTelegramId, 10);
    return {
      isAuthenticated: true,
      telegramId: tid,
      role: tid === 123456789 ? 'admin' : tid === 987654321 ? 'vip' : 'user',
    };
  }

  return {
    isAuthenticated: false,
    role: 'user',
    error: 'Missing or invalid authentication credentials',
  };
}
