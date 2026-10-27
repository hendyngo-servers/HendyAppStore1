import { createLogger } from '@packages/logger';

const logger = createLogger('failure-handler');

export interface WorkerHealthReport {
  worker: string;
  isHealthy: boolean;
  statusCode?: number;
  latencyMs: number;
  consecutiveFailures: number;
  lastChecked: string;
}

export class FailureHandler {
  private static failureCounts: Map<string, number> = new Map();

  public static async checkWorkerHealth(
    workerName: string,
    healthEndpoint: string,
    fetchFn?: (url: string) => Promise<Response>
  ): Promise<WorkerHealthReport> {
    const start = Date.now();
    try {
      const fetchImpl = fetchFn || fetch;
      const res = await fetchImpl(healthEndpoint);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        this.failureCounts.set(workerName, 0);
        return {
          worker: workerName,
          isHealthy: true,
          statusCode: res.status,
          latencyMs,
          consecutiveFailures: 0,
          lastChecked: new Date().toISOString(),
        };
      }

      const failures = (this.failureCounts.get(workerName) || 0) + 1;
      this.failureCounts.set(workerName, failures);
      logger.warn(`Health check degraded for ${workerName} (${failures} failures)`, { status: res.status });

      return {
        worker: workerName,
        isHealthy: false,
        statusCode: res.status,
        latencyMs,
        consecutiveFailures: failures,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const failures = (this.failureCounts.get(workerName) || 0) + 1;
      this.failureCounts.set(workerName, failures);
      logger.error(`Health check exception for ${workerName}`, err);

      return {
        worker: workerName,
        isHealthy: false,
        latencyMs,
        consecutiveFailures: failures,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  public static shouldTriggerHealing(report: WorkerHealthReport, threshold: number = 3): boolean {
    return report.consecutiveFailures >= threshold;
  }
}
