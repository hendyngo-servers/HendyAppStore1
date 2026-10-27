import EdgeRouterWorker from '../workers/edge-router/src/index';
import PlatformApiWorker from '../workers/platform-api/src/index';
import TelegramBotWorker from '../workers/telegram-bot/src/index';
import QueueProcessorWorker from '../workers/queue-processor/src/index';
import SelfHealingWorker from '../workers/self-healing-bot/src/index';
import { DatabaseService } from '../workers/platform-api/src/services/database';
import { TelegramApiClient, type TelegramOutboundMessage } from '../workers/telegram-bot/src/utils/telegram-api';
import { QueueService } from '../workers/platform-api/src/services/queue';
import { StructuredLogger, type LogEntry } from '../packages/logger/src/index';
import type { QueueJobPayload } from '../packages/types/src';

export interface SimulatedServerState {
  isMaintenance: boolean;
  botToken: string;
  adminKey: string;
}

export class ServerBridge {
  private static db = DatabaseService.getInstance();

  public static async queryDatabase(sql: string, params: any[] = []): Promise<any> {
    const trimmed = sql.trim();
    if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
      const res = await this.db.prepare(sql).bind(...params).all();
      return res.results;
    } else {
      const res = await this.db.prepare(sql).bind(...params).run();
      return res;
    }
  }

  public static async fetchTable(tableName: string): Promise<any[]> {
    const res = await this.db.prepare(`SELECT * FROM ${tableName} LIMIT 100`).all();
    return res.results;
  }

  public static async dispatchTelegramUpdate(textOrCallback: string, options: {
    userId?: number;
    username?: string;
    isCallback?: boolean;
    callbackId?: string;
  } = {}): Promise<{ outbound: TelegramOutboundMessage[]; action: string; success: boolean }> {
    const userId = options.userId || 123456789;
    const isCallback = options.isCallback || false;
    const startIndex = TelegramApiClient.getRecentOutbound().length;

    let update: any;
    if (isCallback) {
      update = {
        update_id: Date.now(),
        callback_query: {
          id: options.callbackId || `cb_${Date.now()}`,
          from: { id: userId, first_name: options.username || 'Admin', username: options.username || 'hendy_admin' },
          message: { message_id: 100, chat: { id: userId } },
          data: textOrCallback,
        },
      };
    } else {
      update = {
        update_id: Date.now(),
        message: {
          message_id: 100,
          from: { id: userId, is_bot: false, first_name: options.username || 'Admin', username: options.username || 'hendy_admin' },
          chat: { id: userId, type: 'private' },
          text: textOrCallback,
          date: Math.floor(Date.now() / 1000),
        },
      };
    }

    const env = {
      TELEGRAM_BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
      TELEGRAM_BOT_USERNAME: 'HendyAppStoreBot',
      TELEGRAM_ADMIN_IDS: '123456789,987654321',
      MINI_APP_URL: window.location.origin,
    };

    const res = await TelegramBotWorker.fetch(new Request('http://localhost/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    }), env);

    const result = await res.json() as any;
    const allOutbound = TelegramApiClient.getRecentOutbound();
    const newOutbound = allOutbound.slice(startIndex);

    return {
      outbound: newOutbound,
      action: result?.result?.action || 'processed',
      success: result?.ok ?? true,
    };
  }

  public static async callPlatformApi(method: string, path: string, body?: any, headers: Record<string, string> = {}): Promise<{ status: number; durationMs: number; data: any }> {
    const start = Date.now();
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const req = new Request(`http://localhost${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const env = {
      API_ADMIN_KEY: 'hendy_admin_secret_key_2026',
      TELEGRAM_BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
      ENVIRONMENT: 'development',
    };

    const res = await PlatformApiWorker.fetch(req, env);
    const durationMs = Date.now() - start;
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    return { status: res.status, durationMs, data };
  }

  public static async processQueues(): Promise<{ processedCount: number }> {
    const jobs = QueueService.getInMemoryJobs();
    QueueService.clear();

    const messages = jobs.map((job) => ({
      id: job.jobId,
      body: job,
      ack: () => {},
      retry: () => {},
    }));

    if (messages.length > 0) {
      await QueueProcessorWorker.queue({ queue: 'ecosystem-queue', messages }, {
        TELEGRAM_BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
      });
    }

    return { processedCount: messages.length };
  }

  public static getQueuedJobs(): QueueJobPayload[] {
    return QueueService.getInMemoryJobs();
  }

  public static getSystemLogs(limit: number = 50, worker?: string): LogEntry[] {
    return StructuredLogger.getRecentLogs(limit, worker);
  }

  public static async testEdgeRoute(path: string, userAgent?: string): Promise<any> {
    const req = new Request(`http://localhost${path}`, {
      headers: {
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    const res = await EdgeRouterWorker.fetch(req, {
      MAINTENANCE_OVERRIDE_KEY: 'hendy_bypass_2026',
    });
    return res.json();
  }
}
