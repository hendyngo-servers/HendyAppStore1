export type ProductCategory = 'software' | 'game' | 'vpn' | 'giftcard' | 'account' | 'tool';

export interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number; // in credits/currency
  vip_discount_percent: number;
  stock_count: number;
  image_url?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CodeInventoryItem {
  id: string;
  product_id: string;
  code_value: string; // The license key, activation code, or gift code
  is_redeemed: boolean;
  redeemed_by?: number | null; // telegram_id
  redeemed_at?: string | null;
  created_at: string;
}
