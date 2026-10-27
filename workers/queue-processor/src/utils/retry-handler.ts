import { DatabaseService } from '../../../platform-api/src/services/database';
import type { QueueJobPayload } from '@packages/types';
import { createLogger } from '@packages/logger';

const logger = createLogger('queue-retry-handler');

export async function handleQueueFailure(
  job: QueueJobPayload,
  queueName: string,
  error: any,
  cfDb?: any
): Promise<{ shouldRetry: boolean; dlqId?: string }> {
  const db = DatabaseService.getInstance(cfDb);
  const nextAttempt = (job.attempts || 0) + 1;

  if (nextAttempt < (job.maxAttempts || 3)) {
    logger.warn(`Job ${job.jobId} failed, will retry (${nextAttempt}/${job.maxAttempts})`, { error: error.message });
    return { shouldRetry: true };
  }

  // Exceeded max attempts: Route to Dead-Letter Queue (DLQ)
  const dlqId = `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const errorMsg = error?.message || String(error);
  const errorStack = error?.stack || null;

  try {
    await db.prepare(`
      INSERT INTO queue_dlq (id, queue_name, job_type, payload, error_message, error_stack, retry_count, max_retries, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      dlqId,
      queueName,
      job.type,
      JSON.stringify(job.data),
      errorMsg,
      errorStack,
      nextAttempt,
      job.maxAttempts || 3
    ).run();

    logger.error(`Job ${job.jobId} moved to Dead-Letter Queue [${dlqId}]`, error);
  } catch (dlqErr) {
    logger.error('Failed to record job to queue_dlq table', dlqErr);
  }

  return { shouldRetry: false, dlqId };
}
