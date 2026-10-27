export interface WorkerEnvSecrets {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_ADMIN_IDS: string;
  API_ADMIN_KEY: string;
  API_JWT_SECRET: string;
  BANK_WEBHOOK_SECRET: string;
  MAINTENANCE_OVERRIDE_KEY?: string;
}

export interface BotState {
  userId: number;
  currentStep: string;
  tempData?: Record<string, any>;
  lastInteractionAt: number;
}
