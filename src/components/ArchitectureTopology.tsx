import React from 'react';
import { Server, Bot, Database, Cpu, ShieldCheck, Activity, Layers, ArrowDown, GitBranch, RefreshCw, Zap } from 'lucide-react';

export interface ArchitectureTopologyProps {
  onSelectComponent: (componentId: string) => void;
  activeComponent: string;
}

export const ArchitectureTopology: React.FC<ArchitectureTopologyProps> = ({
  onSelectComponent,
  activeComponent,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Live System Architecture & Worker Network
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time topology conforming to Cloudflare Workers enterprise monorepo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-medium text-emerald-400">All 5 Workers Operational</span>
        </div>
      </div>

      {/* Layer 1: Ingress Clients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Client Ingress</span>
            <h4 className="text-sm font-semibold text-sky-300">Telegram Commands & Chat</h4>
            <p className="text-xs text-slate-400">Users chatting via Telegram Bot API</p>
          </div>
          <Bot className="w-6 h-6 text-sky-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Web Ingress</span>
            <h4 className="text-sm font-semibold text-violet-300">Telegram Mini App</h4>
            <p className="text-xs text-slate-400">Shop, Tasks, Lucky Wheel & VIP</p>
          </div>
          <Activity className="w-6 h-6 text-violet-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Admin Ingress</span>
            <h4 className="text-sm font-semibold text-emerald-300">Web Admin CMS & CLI</h4>
            <p className="text-xs text-slate-400">Feature flags, broadcast & maintenance</p>
          </div>
          <Server className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Connection arrow */}
      <div className="flex justify-around text-slate-600 my-1">
        <ArrowDown className="w-4 h-4 animate-bounce" />
        <ArrowDown className="w-4 h-4 animate-bounce" />
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </div>

      {/* Layer 2: Frontend Workers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => onSelectComponent('telegram-bot')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeComponent === 'telegram-bot'
              ? 'bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/20'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-800">
              Worker #1
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> active
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-2 flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" /> Telegram Bot Worker
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fast command dispatch, inline buttons, state manager, and deep-link referral parser
          </p>
          <div className="flex gap-2 mt-3 text-[11px] font-mono text-slate-400">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">/start ref_123</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">/shop</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">/deposit</span>
          </div>
        </button>

        <button
          onClick={() => onSelectComponent('edge-router')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeComponent === 'edge-router'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-800">
              Worker #2
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> active
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Edge Router Worker
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Perimeter security, device detection, responsive layout resolver, and maintenance guard
          </p>
          <div className="flex gap-2 mt-3 text-[11px] font-mono text-slate-400">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">Device Detect</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">Pocket CMS</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded">Kill-Switch</span>
          </div>
        </button>
      </div>

      {/* Central Hub Worker */}
      <div className="flex justify-center my-1">
        <ArrowDown className="w-4 h-4 text-slate-600 animate-bounce" />
      </div>

      <button
        onClick={() => onSelectComponent('platform-api')}
        className={`w-full p-4 rounded-xl text-left border mb-4 transition-all ${
          activeComponent === 'platform-api'
            ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-800">
              Worker #3 (Central Hub)
            </span>
            <span className="text-xs font-semibold text-slate-300">platform-api</span>
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 12 Endpoints Active
          </span>
        </div>
        <h3 className="text-base font-bold text-white mt-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" /> Platform API Worker
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Auth verification, atomic digital code purchases, wallet deposits, tasks, and feature toggles
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-mono text-slate-300">
          <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">/api/shop/purchase</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">/api/wallet/deposit</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">/api/minigames/spin</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">/api/webhooks/bank</span>
        </div>
      </button>

      {/* Layer 3: Cloudflare Storage & Async Backing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <button
          onClick={() => onSelectComponent('database')}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            activeComponent === 'database'
              ? 'bg-blue-950/50 border-blue-500'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-blue-300 uppercase">Cloudflare D1</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-2">D1 Database (SQL)</h4>
          <p className="text-xs text-slate-400 mt-1">Users, Wallets, Codes & Audit Logs (8 Migrations)</p>
        </button>

        <button
          onClick={() => onSelectComponent('queues')}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            activeComponent === 'queues'
              ? 'bg-purple-950/50 border-purple-500'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-mono text-purple-300 uppercase">CF Queues</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-2">Cloudflare Queues</h4>
          <p className="text-xs text-slate-400 mt-1">Bank Sync, Bot Broadcast & OTA Build Jobs</p>
        </button>

        <button
          onClick={() => onSelectComponent('features')}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            activeComponent === 'features'
              ? 'bg-emerald-950/50 border-emerald-500'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-300 uppercase">Cloudflare KV</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-2">Cloudflare KV</h4>
          <p className="text-xs text-slate-400 mt-1">Dynamic Feature Flags & Maintenance State</p>
        </button>
      </div>

      {/* Layer 4: Background Workers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectComponent('queue-processor')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeComponent === 'queue-processor'
              ? 'bg-purple-950/50 border-purple-500'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-800">
              Worker #4
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Background Consumer</span>
          </div>
          <h4 className="text-base font-bold text-white mt-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" /> Queue Processor Worker
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Async bank webhook reconciliation, rate-limited Telegram mass broadcasts, and dead-letter queue (DLQ)
          </p>
        </button>

        <button
          onClick={() => onSelectComponent('self-healing')}
          className={`p-4 rounded-xl text-left border transition-all ${
            activeComponent === 'self-healing'
              ? 'bg-rose-950/50 border-rose-500'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-800">
              Worker #5
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Cron Watchdog</span>
          </div>
          <h4 className="text-base font-bold text-white mt-2 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-rose-400" /> Self-Healing Bot Worker
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Automatic failure detection, circuit breaker, GitHub workflow redeploy dispatch, and KV rollbacks
          </p>
        </button>
      </div>
    </div>
  );
};
