export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  worker: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class StructuredLogger {
  private workerName: string;
  private static memoryLogs: LogEntry[] = [];

  constructor(workerName: string) {
    this.workerName = workerName;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      worker: this.workerName,
      message,
      context,
      error: error
        ? {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack,
          }
        : undefined,
    };

    StructuredLogger.memoryLogs.unshift(entry);
    if (StructuredLogger.memoryLogs.length > 200) {
      StructuredLogger.memoryLogs.pop();
    }

    // Output formatted JSON for Cloudflare Worker log tail / Axiom
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[${entry.worker}] [${level.toUpperCase()}] ${message}`, context || '');

    return entry;
  }

  public debug(message: string, context?: Record<string, any>): LogEntry {
    return this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): LogEntry {
    return this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): LogEntry {
    return this.log('warn', message, context);
  }

  public error(message: string, error?: any, context?: Record<string, any>): LogEntry {
    return this.log('error', message, context, error);
  }

  public static getRecentLogs(limit: number = 50, worker?: string): LogEntry[] {
    let logs = this.memoryLogs;
    if (worker) {
      logs = logs.filter((l) => l.worker === worker);
    }
    return logs.slice(0, limit);
  }

  public static clearLogs(): void {
    this.memoryLogs = [];
  }
}

export const createLogger = (worker: string) => new StructuredLogger(worker);
