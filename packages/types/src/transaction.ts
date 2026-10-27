export type TransactionType = 'deposit' | 'purchase' | 'refund' | 'bonus' | 'referral_payout' | 'minigame_win';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  user_telegram_id: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference_code: string; // e.g. BANK_123 or ORDER_456
  product_id?: string | null;
  code_inventory_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  user_telegram_id: number;
  balance: number;
  spin_credits: number;
  total_deposited: number;
  total_spent: number;
  updated_at: string;
}
