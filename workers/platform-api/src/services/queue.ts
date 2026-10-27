import type { QueueJobPayload } from '@packages/types';
import { createLogger } from '@packages/logger';

const logger = createLogger('queue-producer');

/**
 * Universal Cloudflare Queue Producer client
 */
export class QueueService {
  private queueName: string;
  private cfQueue: any = null;
  private static inMemoryQueue: QueueJobPayload[] = [];

  constructor(queueName: string, cfQueue?: any) {
    this.queueName = queueName;
    this.cfQueue = cfQueue;
  }

  public async send(
    type: QueueJobPayload['type'],
    data: Record<string, any>,
    options?: { maxAttempts?: number }
  ): Promise<QueueJobPayload> {
    const job: QueueJobPayload = {
      jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: Date.now(),
    };

    if (this.cfQueue) {
      await this.cfQueue.send(job);
    } else {
      QueueService.inMemoryQueue.push(job);
    }

    logger.info(`Enqueued job to [${this.queueName}]`, { jobId: job.jobId, type });
    return job;
  }

  public static getInMemoryJobs(): QueueJobPayload[] {
    return [...this.inMemoryQueue];
  }

  public static popInMemoryJob(): QueueJobPayload | undefined {
    return this.inMemoryQueue.shift();
  }

  public static clear(): void {
    this.inMemoryQueue = [];
  }
}
