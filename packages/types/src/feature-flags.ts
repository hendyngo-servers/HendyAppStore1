export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 - 100
  allowedRoles?: string[];
  allowedTelegramIds?: number[];
  environment: 'development' | 'staging' | 'production' | 'all';
  metadata?: Record<string, any>;
  updated_at: string;
}

export interface FeatureEvaluationContext {
  userId?: string;
  telegramId?: number;
  role?: string;
  environment?: string;
  ipCountry?: string;
}
