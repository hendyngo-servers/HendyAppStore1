import type { DeviceInfo, ClientLayout } from '@packages/types';

export function resolveClientLayout(device: DeviceInfo, pathname: string): ClientLayout {
  // If Telegram WebApp init data or inside Telegram Webview
  if (device.isTelegramClient || pathname.startsWith('/mini-app')) {
    return 'telegram-miniapp';
  }

  // Admin CMS paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/cms')) {
    // If accessing admin from mobile device, route to MobileCMSPocketLayout
    if (device.type === 'mobile') {
      return 'pocket-cms';
    }
    // Desktop admin layout
    return 'full-studio';
  }

  // General public download / OTA portal
  return 'public-portal';
}
