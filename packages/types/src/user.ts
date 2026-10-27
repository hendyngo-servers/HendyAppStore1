export type UserRole = 'user' | 'vip' | 'admin' | 'moderator';

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string; // Internal UUID
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  status: UserStatus;
  vip_expires_at?: number | null; // Unix timestamp ms
  referrer_id?: number | null; // Telegram ID of inviter
  referral_count: number;
  referral_earnings: number;
  daily_streak: number;
  last_check_in?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  wallet_balance: number;
  spin_credits: number;
}
