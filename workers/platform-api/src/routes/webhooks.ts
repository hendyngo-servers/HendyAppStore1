import { DatabaseService } from '../services/database';
import { QueueService } from '../services/queue';
import { createLogger } from '@packages/logger';

const logger = createLogger('bank-webhook');

export async function handleWebhooks(request: Request, env?: any): Promise<Response> {
  const url = new URL(request.url);
  const queue = new QueueService('bank-sync-queue', env?.QUEUE_BANK_SYNC);

  // POST /api/webhooks/bank
  if (request.method === 'POST' && (url.pathname === '/api/webhooks/bank' || url.pathname === '/webhook/bank')) {
    try {
      const body = await request.json() as {
        gateway?: string;
        amount: number;
        content: string; // The transfer memo containing e.g. HD12349876
        transactionDate?: string;
        referenceNumber?: string;
      };

      logger.info('Received incoming bank webhook', {
        amount: body.amount,
        content: body.content,
        ref: body.referenceNumber,
      });

      // Enqueue job for background processing by Queue Processor Worker
      const job = await queue.send('bank_sync', {
        amount: body.amount,
        memo: body.content,
        referenceNumber: body.referenceNumber || `BANK_${Date.now()}`,
        receivedAt: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: 'queued',
          jobId: job.jobId,
          message: 'Bank transfer webhook enqueued for asynchronous processing',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      logger.error('Failed processing bank webhook', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ error: 'Webhook endpoint not found' }), { status: 404 });
}
