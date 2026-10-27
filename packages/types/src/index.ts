export * from './user';
export * from './product';
export * from './transaction';
export * from './device';
export * from './app-release';
export * from './feature-flags';
export * from './secrets';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  reward_spins: number;
  action_type: 'telegram_channel' | 'daily_checkin' | 'invite_friends' | 'external_link';
  action_target: string;
  is_active: boolean;
}

export interface UserTaskProgress {
  user_telegram_id: number;
  task_id: string;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface MinigameConfig {
  id: string;
  game_key: 'lucky_wheel' | 'gacha_chest' | 'dice_roll';
  name: string;
  cost_spins: number;
  prizes: Array<{
    id: string;
    label: string;
    type: 'coins' | 'vip_days' | 'code' | 'spins' | 'empty';
    value: number | string;
    weight: number;
  }>;
}

export interface QueueJobPayload {
  jobId: string;
  type: 'bank_sync' | 'bot_broadcast' | 'ota_build' | 'user_sync';
  data: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}
