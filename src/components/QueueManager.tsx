import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, AlertOctagon, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { ServerBridge } from '../server-bridge';
import type { QueueJobPayload } from '../../packages/types/src';

export const QueueManager: React.FC = () => {
  const [queuedJobs, setQueuedJobs] = useState<QueueJobPayload[]>([]);
  const [dlqItems, setDlqItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const refreshQueues = async () => {
    setQueuedJobs(ServerBridge.getQueuedJobs());
    try {
      const res = await ServerBridge.fetchTable('queue_dlq');
      setDlqItems(res);
    } catch {}
  };

  useEffect(() => {
    refreshQueues();
    const interval = setInterval(refreshQueues, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessQueues = async () => {
    setLoading(true);
    try {
      const res = await ServerBridge.processQueues();
      setLastAction(`Processed ${res.processedCount} background queue jobs through Queue Processor`);
      refreshQueues();
    } catch (err: any) {
      setLastAction(`Error processing queue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnqueueSample = async (type: 'bank_sync' | 'bot_broadcast' | 'ota_build') => {
    if (type === 'bank_sync') {
      await ServerBridge.callPlatformApi('POST', '/api/webhooks/bank', {
        amount: 200000,
        content: 'HD12347712 Auto Top-up',
        referenceNumber: `BANK_${Date.now()}`,
      });
    } else if (type === 'bot_broadcast') {
      await ServerBridge.callPlatformApi('POST', '/api/admin/broadcast', {
        message: '📢 System Update: All workers upgraded to v1.0.0!',
        filterRole: 'all',
      }, { 'x-admin-key': 'hendy_admin_secret_key_2026' });
    }
    refreshQueues();
  };

  const retryDlqItem = async (dlqId: string) => {
    await ServerBridge.queryDatabase('UPDATE queue_dlq SET status = "resolved", last_retried_at = datetime("now") WHERE id = ?', [dlqId]);
    refreshQueues();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[750px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-400" />
            Cloudflare Queues & Queue Processor Worker
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Asynchronous bank webhook reconciliation, rate-limited bot broadcasts, and DLQ handling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEnqueueSample('bank_sync')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            + Test Bank Job
          </button>
          <button
            onClick={() => handleEnqueueSample('bot_broadcast')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            + Test Broadcast Job
          </button>
          <button
            onClick={handleProcessQueues}
            disabled={loading}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Process Queue ({queuedJobs.length})</span>
          </button>
        </div>
      </div>

      {lastAction && (
        <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-800/80 text-xs text-purple-300 font-mono">
          {lastAction}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Pending Queues */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Pending Queue Ingestion ({queuedJobs.length})
            </h4>
            <span className="text-[11px] font-mono text-slate-500">Auto-polls every 3s</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {queuedJobs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                Queue is currently empty. Use the buttons above to enqueue sample background jobs.
              </div>
            ) : (
              queuedJobs.map((job) => (
                <div key={job.jobId} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-purple-400 font-bold mb-1">
                    <span>{job.type}</span>
                    <span className="text-[10px] text-slate-500">ID: {job.jobId}</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto bg-slate-950 p-2 rounded">
                    {JSON.stringify(job.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dead-Letter Queue (DLQ) */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Dead-Letter Queue / Failures ({dlqItems.length})
            </h4>
            <span className="text-[11px] font-mono text-slate-500">D1 `queue_dlq` Table</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {dlqItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                Zero Dead-Letter Queue failures. All queue workers operating with 100% success rate.
              </div>
            ) : (
              dlqItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-rose-400 font-bold">{item.job_type}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] uppercase">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-300 mb-2">{item.error_message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Retries: {item.retry_count}/{item.max_retries}</span>
                    {item.status !== 'resolved' && (
                      <button
                        onClick={() => retryDlqItem(item.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
