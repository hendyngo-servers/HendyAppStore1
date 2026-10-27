import type { DeviceInfo, DeviceType, ClientLayout } from '@packages/types';

export function detectDevice(request: Request): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || '';
  const country = request.headers.get('cf-ipcountry') || 'VN';
  const ipAddress = request.headers.get('cf-connecting-ip') || '127.0.0.1';

  const isTelegramClient = /Telegram|TelegramBot/i.test(userAgent) ||
    request.headers.has('X-Telegram-Bot-Api-Secret-Token') ||
    request.headers.has('x-telegram-init-data');

  const isBotTraffic = /bot|spider|crawl|slurp|facebookexternalhit/i.test(userAgent) && !isTelegramClient;

  let platform: DeviceInfo['platform'] = 'other';
  if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'ios';
  else if (/Android/i.test(userAgent)) platform = 'android';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) platform = 'macos';
  else if (/Windows/i.test(userAgent)) platform = 'windows';
  else if (/Linux/i.test(userAgent)) platform = 'linux';

  let type: DeviceType = 'desktop';
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    type = 'mobile';
  } else if (/iPad|Tablet/i.test(userAgent)) {
    type = 'tablet';
  } else if (isBotTraffic) {
    type = 'bot';
  }

  return {
    type,
    platform,
    isTelegramClient,
    isBotTraffic,
    ipAddress,
    country,
    userAgent,
  };
}
