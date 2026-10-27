import { FailureHandler } from './failure-handler';
import { triggerGitHubRepairWorkflow } from './workflow-trigger';
import { executeEmergencyRollback } from './rollback-service';
import { createLogger } from '@packages/logger';

const logger = createLogger('self-healing-bot');

export interface SelfHealingEnv {
  KV_MAINTENANCE?: any;
  GITHUB_TOKEN?: string;
  PLATFORM_API_URL?: string;
  TELEGRAM_BOT_URL?: string;
}

export default {
  /**
   * Cron Trigger (Runs every 1-5 minutes to monitor worker health and auto-heal)
   */
  async scheduled(event: any, env: SelfHealingEnv = {}, ctx?: any): Promise<void> {
    logger.info('Self-healing heartbeat running scheduled probe...');

    const checks = [
      { name: 'platform-api', url: env.PLATFORM_API_URL || 'http://localhost/api/health' },
      { name: 'telegram-bot', url: env.TELEGRAM_BOT_URL || 'http://localhost/health' },
    ];

    for (const check of checks) {
      const report = await FailureHandler.checkWorkerHealth(check.name, check.url);
      if (FailureHandler.shouldTriggerHealing(report)) {
        logger.error(`Critical failure detected for ${check.name}! Initiating self-healing protocol...`);

        // 1. Trigger redeploy workflow
        await triggerGitHubRepairWorkflow('deploy-workers.yml', `Self-healing automated trigger for degraded worker: ${check.name}`, env.GITHUB_TOKEN);

        // 2. Perform emergency rollback in KV
        await executeEmergencyRollback(check.name, 'v1.0.0-stable', env.KV_MAINTENANCE);
      }
    }
  },

  /**
   * HTTP inspector for self-healing status
   */
  async fetch(request: Request, env: SelfHealingEnv = {}): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/heal/probe') {
      const report = await FailureHandler.checkWorkerHealth('platform-api', 'http://localhost/api/health');
      return new Response(JSON.stringify({ report }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      worker: 'self-healing-bot',
      status: 'active',
      healingProtocols: ['automated_workflow_dispatch', 'kv_version_rollback', 'circuit_breaker'],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
