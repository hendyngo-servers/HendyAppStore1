export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
export type ClientLayout = 'pocket-cms' | 'full-studio' | 'telegram-miniapp' | 'public-portal';

export interface DeviceInfo {
  type: DeviceType;
  platform: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other';
  isTelegramClient: boolean;
  isBotTraffic: boolean;
  ipAddress?: string;
  country?: string;
  userAgent: string;
}

export interface EdgeRouteDecision {
  layout: ClientLayout;
  maintenanceMode: boolean;
  allowed: boolean;
  reason?: string;
  targetWorker: 'telegram-bot' | 'platform-api' | 'web-admin' | 'mini-app' | 'maintenance-static';
}
