import React, { useState, useEffect } from 'react';
import { Zap, ShieldAlert, ToggleLeft, ToggleRight, Check, AlertTriangle } from 'lucide-react';
import { ServerBridge } from '../server-bridge';

export const FeatureFlagManager: React.FC = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [maintStatus, setMaintStatus] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');

  const loadFlags = async () => {
    try {
      const res = await ServerBridge.queryDatabase('SELECT * FROM feature_flags ORDER BY key ASC');
      setFlags(res);
      const maint = res.find((f: any) => f.key === 'maintenance_mode');
      setMaintStatus(maint?.enabled === 1);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleFlag = async (key: string, currentEnabled: number) => {
    setLoading(true);
    const newEnabled = currentEnabled === 1 ? 0 : 1;
    try {
      await ServerBridge.callPlatformApi('POST', '/api/features/toggle', {
        key,
        enabled: newEnabled === 1,
      }, { 'x-admin-key': 'hendy_admin_secret_key_2026' });

      setNotice(`Feature flag "${key}" set to ${newEnabled === 1 ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setNotice(''), 3000);
      loadFlags();
    } catch (err: any) {
      setNotice(`Error toggling flag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[750px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Cloudflare KV Feature Flags & Perimeter Maintenance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time toggles evaluated at the edge with zero redeployments needed
          </p>
        </div>

        {maintStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-mono font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            MAINTENANCE KILL-SWITCH ACTIVE
          </div>
        )}
      </div>

      {notice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 font-mono">
          {notice}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {flags.map((flag) => {
          const isEnabled = flag.enabled === 1;
          const isMaint = flag.key === 'maintenance_mode';

          return (
            <div
              key={flag.key}
              className={`p-5 rounded-xl border transition-all ${
                isMaint && isEnabled
                  ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{flag.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {flag.key}
                    </span>
                    {isMaint && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        PERIMETER GUARD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{flag.description}</p>
                </div>

                <button
                  onClick={() => toggleFlag(flag.key, flag.enabled)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                    isEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  {isEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-white" />
                      ENABLED
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" />
                      DISABLED
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-600 block">Rollout:</span>
                  <span className="text-slate-300">{flag.rollout_percentage}%</span>
                </div>
                <div>
                  <span className="text-slate-600 block">Environment:</span>
                  <span className="text-slate-300">{flag.environment}</span>
                </div>
                <div>
                  <span className="text-slate-600 block">Allowed Roles:</span>
                  <span className="text-slate-300">{flag.allowed_roles || 'All'}</span>
                </div>
                <div>
                  <span className="text-slate-600 block">Updated:</span>
                  <span className="text-slate-300">{flag.updated_at}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
