import React, { useState } from 'react';
import {
  Layers,
  Bot,
  Cpu,
  Database,
  RefreshCw,
  Zap,
  GitBranch,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Github,
  CheckCircle2,
} from 'lucide-react';
import { ArchitectureTopology } from './components/ArchitectureTopology';
import { TelegramBotEmulator } from './components/TelegramBotEmulator';
import { ApiExplorer } from './components/ApiExplorer';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { QueueManager } from './components/QueueManager';
import { FeatureFlagManager } from './components/FeatureFlagManager';
import { SelfHealingConsole } from './components/SelfHealingConsole';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('topology');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">HendyAppStore Server Engine</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Workers Monorepo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise Cloudflare Workers • D1 Database • CF Queues • KV • Telegram Bot Server
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>5 Workers Live</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
              <Database className="w-3.5 h-3.5" />
              <span>D1 SQL Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'topology'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            System Architecture
          </button>

          <button
            onClick={() => setActiveTab('telegram-bot')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'telegram-bot'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            Telegram Bot Worker
          </button>

          <button
            onClick={() => setActiveTab('platform-api')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'platform-api'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Platform REST API
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'database'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            D1 Database (SQL)
          </button>

          <button
            onClick={() => setActiveTab('queues')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'queues'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Cloudflare Queues
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'features'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Feature Flags (KV)
          </button>

          <button
            onClick={() => setActiveTab('self-healing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'self-healing'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Self-Healing Watchdog
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'topology' && (
          <ArchitectureTopology
            activeComponent={activeTab}
            onSelectComponent={(cId) => setActiveTab(cId)}
          />
        )}

        {activeTab === 'telegram-bot' && <TelegramBotEmulator />}
        {activeTab === 'platform-api' && <ApiExplorer />}
        {activeTab === 'database' && <DatabaseExplorer />}
        {activeTab === 'queues' && <QueueManager />}
        {activeTab === 'features' && <FeatureFlagManager />}
        {activeTab === 'self-healing' && <SelfHealingConsole />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Built strictly to system architecture and directory structure specifications.
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Edge Router • Platform API • Telegram Bot • Queue Processor • Self-Healing Bot</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
