import { createLogger } from '@packages/logger';

const logger = createLogger('rollback-service');

export async function executeEmergencyRollback(
  targetWorker: string,
  targetVersion: string,
  kv?: any
): Promise<{ success: boolean; rolledBackTo: string; timestamp: string }> {
  const timestamp = new Date().toISOString();
  logger.warn(`Executing EMERGENCY ROLLBACK for ${targetWorker} to version ${targetVersion}`);

  if (kv) {
    try {
      await kv.put(`version_${targetWorker}`, targetVersion);
    } catch (err) {
      logger.error('Failed writing rollback version to KV', err);
    }
  }

  return {
    success: true,
    rolledBackTo: targetVersion,
    timestamp,
  };
}
