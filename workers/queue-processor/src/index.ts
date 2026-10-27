import { processBankSyncJob } from './jobs/bank-sync';
import { processBotBroadcastJob } from './jobs/bot-broadcast';
import { processOtaBuildJob } from './jobs/ota-build';
import { handleQueueFailure } from './utils/retry-handler';
import type { QueueJobPayload } from '@packages/types';
import { createLogger } from '@packages/logger';

const logger = createLogger('queue-processor');

export interface QueueProcessorEnv {
  DB?: any;
  TELEGRAM_BOT_TOKEN?: string;
}

export default {
  /**
   * Cloudflare Queue Consumer Event Handler
   */
  async queue(batch: { queue: string; messages: Array<{ id: string; body: QueueJobPayload; ack: () => void; retry: () => void }> }, env: QueueProcessorEnv = {}, ctx?: any): Promise<void> {
    logger.info(`Received queue batch from [${batch.queue}] with ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      const job = message.body;
      try {
        if (job.type === 'bank_sync') {
          await processBankSyncJob(job.data as any, env.TELEGRAM_BOT_TOKEN, env.DB);
        } else if (job.type === 'bot_broadcast') {
          await processBotBroadcastJob(job.data as any, env.TELEGRAM_BOT_TOKEN, env.DB);
        } else if (job.type === 'ota_build') {
          await processOtaBuildJob(job.data as any, env.DB);
        } else {
          logger.warn('Unknown job type in queue', { type: job.type });
        }
        message.ack();
      } catch (err: any) {
        logger.error(`Error processing job ${job.jobId}`, err);
        const failureResult = await handleQueueFailure(job, batch.queue, err, env.DB);
        if (failureResult.shouldRetry) {
          message.retry();
        } else {
          message.ack(); // Acknowledge so it leaves main queue since it is in DLQ
        }
      }
    }
  },

  /**
   * HTTP endpoint to inspect queue processor or manually trigger job processing
   */
  async fetch(request: Request, env: QueueProcessorEnv = {}): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/queue/process-single') {
      try {
        const body = await request.json() as QueueJobPayload;
        if (body.type === 'bank_sync') {
          const res = await processBankSyncJob(body.data as any, env.TELEGRAM_BOT_TOKEN, env.DB);
          return new Response(JSON.stringify({ ok: true, res }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (body.type === 'bot_broadcast') {
          const res = await processBotBroadcastJob(body.data as any, env.TELEGRAM_BOT_TOKEN, env.DB);
          return new Response(JSON.stringify({ ok: true, res }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (body.type === 'ota_build') {
          const res = await processOtaBuildJob(body.data as any, env.DB);
          return new Response(JSON.stringify({ ok: true, res }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ worker: 'queue-processor', status: 'online' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
