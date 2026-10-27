import { DatabaseService } from '../../../platform-api/src/services/database';
import { createLogger } from '@packages/logger';

const logger = createLogger('job-ota-build');

export async function processOtaBuildJob(
  jobData: { platform: string; version: string; buildNumber: number; commitSha?: string },
  cfDb?: any
): Promise<{ success: boolean; releaseId: string }> {
  const db = DatabaseService.getInstance(cfDb);
  logger.info('Processing OTA Build Artifact Job', jobData);

  const releaseId = `rel_${Date.now()}`;
  const downloadUrl = `https://cdn.hendyappstore.com/builds/${jobData.platform}/${jobData.version}/app-release.${jobData.platform === 'ios' ? 'ipa' : 'apk'}`;
  const manifestUrl = jobData.platform === 'ios' ? `https://cdn.hendyappstore.com/builds/ios/${jobData.version}/manifest.plist` : undefined;

  await db.prepare(`
    INSERT INTO app_releases (id, version, build_number, platform, download_url, manifest_url, release_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
  `).bind(
    releaseId,
    jobData.version,
    jobData.buildNumber,
    jobData.platform,
    downloadUrl,
    manifestUrl || null,
    `Automated OTA Release v${jobData.version} build #${jobData.buildNumber}`
  ).run();

  logger.info('OTA release published', { releaseId, version: jobData.version });
  return { success: true, releaseId };
}
