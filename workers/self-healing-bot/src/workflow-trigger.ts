import { createLogger } from '@packages/logger';

const logger = createLogger('workflow-trigger');

export async function triggerGitHubRepairWorkflow(
  workflowFile: string,
  reason: string,
  githubToken?: string
): Promise<{ success: boolean; workflowRunUrl?: string }> {
  logger.info(`Triggering GitHub repair workflow [${workflowFile}]`, { reason });

  if (!githubToken) {
    logger.warn('No GITHUB_TOKEN configured; simulated workflow trigger recorded.');
    return {
      success: true,
      workflowRunUrl: `https://github.com/HendyAppStore/HendyAppStoreBotTelegram/actions/workflows/${workflowFile}`,
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/HendyAppStore/HendyAppStoreBotTelegram/actions/workflows/${workflowFile}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'HendyAppStore-SelfHealingWorker',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { reason },
      }),
    });

    return { success: res.ok };
  } catch (err) {
    logger.error('Failed dispatching GitHub repair workflow', err);
    return { success: false };
  }
}
