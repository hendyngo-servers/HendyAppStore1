import React, { useState } from 'react';
import { Play, Code2, Clock, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { ServerBridge } from '../server-bridge';

interface EndpointPreset {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  category: string;
  defaultBody?: any;
  headers?: Record<string, string>;
  description: string;
}

const ENDPOINTS: EndpointPreset[] = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    category: 'System',
    description: 'Validates D1 database connectivity, KV namespaces, and worker latency',
  },
  {
    name: 'Browse Product Catalog',
    method: 'GET',
    path: '/api/shop/items',
    category: 'Shop',
    description: 'Retrieves active inventory products, categories, and stock numbers',
  },
  {
    name: 'Purchase Code',
    method: 'POST',
    path: '/api/shop/purchase',
    category: 'Shop',
    defaultBody: { productId: 'prod_spotify_1m' },
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Atomically deducts wallet balance and assigns unredeemed license key',
  },
  {
    name: 'User Purchased Inventory',
    method: 'GET',
    path: '/api/shop/inventory',
    category: 'Shop',
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Fetches historical redeemed codes for authenticated user',
  },
  {
    name: 'Get User Wallet',
    method: 'GET',
    path: '/api/wallet',
    category: 'Wallet',
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Fetches user balance, spin credits, and VIP membership expiration',
  },
  {
    name: 'Initiate Bank Deposit QR',
    method: 'POST',
    path: '/api/wallet/deposit',
    category: 'Wallet',
    defaultBody: { amount: 100000 },
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Generates pending deposit transaction and unique VietQR memo string',
  },
  {
    name: 'Spin Lucky Wheel',
    method: 'POST',
    path: '/api/minigames/spin',
    category: 'Minigames',
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Deducts 1 spin credit and evaluates weighted random prize payout',
  },
  {
    name: 'Simulate Bank Deposit Webhook',
    method: 'POST',
    path: '/api/webhooks/bank',
    category: 'Webhooks',
    defaultBody: {
      gateway: 'VietQR-Auto',
      amount: 100000,
      content: 'HD67894521 Deposit transfer',
      referenceNumber: 'FT26102799812',
    },
    description: 'Ingests external banking transfer and enqueues to Queue Processor',
  },
  {
    name: 'Feature Flags Matrix',
    method: 'GET',
    path: '/api/features',
    category: 'Features',
    headers: { 'x-user-telegram-id': '123456789' },
    description: 'Resolves client feature flag toggles against environment and roles',
  },
  {
    name: 'Admin Overview Metrics',
    method: 'GET',
    path: '/api/admin/overview',
    category: 'Admin',
    headers: { 'x-admin-key': 'hendy_admin_secret_key_2026' },
    description: 'Aggregates platform statistics: total users, wallet balances, sales, and stock',
  },
  {
    name: 'Queue Telegram Broadcast',
    method: 'POST',
    path: '/api/admin/broadcast',
    category: 'Admin',
    defaultBody: {
      message: '🚨 Special Weekend Flash Sale: 20% OFF all Spotify & Steam vouchers!',
      filterRole: 'all',
    },
    headers: { 'x-admin-key': 'hendy_admin_secret_key_2026' },
    description: 'Enqueues rate-limited announcement across Telegram bot users',
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointPreset>(ENDPOINTS[0]);
  const [method, setMethod] = useState<'GET' | 'POST'>(selectedEndpoint.method);
  const [path, setPath] = useState<string>(selectedEndpoint.path);
  const [bodyText, setBodyText] = useState<string>(
    selectedEndpoint.defaultBody ? JSON.stringify(selectedEndpoint.defaultBody, null, 2) : ''
  );
  const [headersText, setHeadersText] = useState<string>(
    selectedEndpoint.headers ? JSON.stringify(selectedEndpoint.headers, null, 2) : '{\n  "x-user-telegram-id": "123456789"\n}'
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSelect = (ep: EndpointPreset) => {
    setSelectedEndpoint(ep);
    setMethod(ep.method);
    setPath(ep.path);
    setBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setHeadersText(ep.headers ? JSON.stringify(ep.headers, null, 2) : '{\n  "x-user-telegram-id": "123456789"\n}');
  };

  const handleExecute = async () => {
    setLoading(true);
    let parsedBody: any = undefined;
    let parsedHeaders: Record<string, string> = {};

    try {
      if (bodyText.trim() && method === 'POST') {
        parsedBody = JSON.parse(bodyText);
      }
      if (headersText.trim()) {
        parsedHeaders = JSON.parse(headersText);
      }
    } catch (e: any) {
      setResponse({ status: 400, durationMs: 0, data: { error: 'Invalid JSON in request body or headers', details: e.message } });
      setLoading(false);
      return;
    }

    try {
      const res = await ServerBridge.callPlatformApi(method, path, parsedBody, parsedHeaders);
      setResponse(res);
    } catch (err: any) {
      setResponse({ status: 500, durationMs: 0, data: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Endpoints Sidebar */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl h-[750px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          Platform API Endpoints ({ENDPOINTS.length})
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {ENDPOINTS.map((ep, i) => (
            <button
              key={i}
              onClick={() => handleSelect(ep)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                selectedEndpoint.name === ep.name
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-100">{ep.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    ep.method === 'GET' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {ep.method}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 truncate">{ep.path}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Request & Response Runner */}
      <div className="lg:col-span-8 flex flex-col gap-4 h-[750px]">
        {/* URL Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                method === 'GET' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {method}
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{loading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">{selectedEndpoint.description}</p>
        </div>

        {/* Request & Response Body Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Request Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-0 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Request Payload & Headers
            </h4>
            <div className="text-[11px] font-mono text-slate-400 mb-1">Custom Headers (JSON):</div>
            <textarea
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none mb-3"
            />

            {method === 'POST' && (
              <>
                <div className="text-[11px] font-mono text-slate-400 mb-1">JSON Body:</div>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </>
            )}
          </div>

          {/* Response Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-0 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Response
                </h4>
                {response && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {response.status >= 200 && response.status < 300 ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {response.status}
                  </span>
                )}
              </div>

              {response && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {response.durationMs}ms
                  </span>
                  <button
                    onClick={copyResponse}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy response JSON"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto font-mono text-xs text-emerald-300">
              {response ? (
                <pre>{JSON.stringify(response.data, null, 2)}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                  Click "Send Request" to test endpoint live
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
