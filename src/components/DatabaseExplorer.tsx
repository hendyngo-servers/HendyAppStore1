import React, { useState, useEffect } from 'react';
import { Database, Play, RefreshCw, Terminal, Table } from 'lucide-react';
import { ServerBridge } from '../server-bridge';

const TABLES = [
  'users',
  'wallets',
  'products',
  'code_inventory',
  'transactions',
  'tasks',
  'minigame_history',
  'app_releases',
  'queue_dlq',
  'feature_flags',
  'audit_logs',
  'broadcast_history',
];

export const DatabaseExplorer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('products');
  const [tableData, setTableData] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM products ORDER BY price ASC LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'sql'>('tables');

  const loadTable = async (table: string) => {
    setLoading(true);
    try {
      const data = await ServerBridge.fetchTable(table);
      setTableData(data);
      setSelectedTable(table);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTable(selectedTable);
  }, [selectedTable]);

  const executeSql = async () => {
    if (!sqlQuery.trim()) return;
    setLoading(true);
    const start = Date.now();
    try {
      const res = await ServerBridge.queryDatabase(sqlQuery);
      setQueryResult({
        success: true,
        durationMs: Date.now() - start,
        data: res,
      });
    } catch (err: any) {
      setQueryResult({
        success: false,
        durationMs: Date.now() - start,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[750px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Cloudflare D1 SQL Database Explorer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real SQLite D1 engine executing migrations 0001 through 0008 & active seed data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'tables'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Table View
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'sql'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            SQL Query Runner
          </button>
        </div>
      </div>

      {activeTab === 'tables' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Table Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-slate-800/60 no-scrollbar">
            {TABLES.map((t) => (
              <button
                key={t}
                onClick={() => loadTable(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap border transition-all ${
                  selectedTable === t
                    ? 'bg-blue-950 text-blue-300 border-blue-600 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Table Results */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                Querying D1 database...
              </div>
            ) : tableData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                No rows found in table `{selectedTable}`
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 text-slate-300 font-mono">
                  <tr>
                    {Object.keys(tableData[0]).map((col) => (
                      <th key={col} className="p-3 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="p-3 whitespace-nowrap max-w-xs truncate text-slate-200">
                          {val === null || val === undefined ? (
                            <span className="text-slate-600 italic">null</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-2 text-right text-[11px] font-mono text-slate-500">
            Displaying {tableData.length} records from D1 `{selectedTable}` table
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400">SQL Query:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSqlQuery('SELECT u.username, u.role, w.balance FROM users u JOIN wallets w ON u.telegram_id = w.user_telegram_id;')}
                  className="text-[11px] font-mono text-blue-400 hover:underline"
                >
                  Join Users & Wallets
                </button>
                <button
                  onClick={() => setSqlQuery('SELECT * FROM code_inventory WHERE is_redeemed = 0;')}
                  className="text-[11px] font-mono text-blue-400 hover:underline"
                >
                  Unredeemed Codes
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={4}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                onClick={executeSql}
                disabled={loading}
                className="px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Play className="w-4 h-4 fill-white" />
                Run
              </button>
            </div>
          </div>

          {/* SQL Output */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-auto p-4 font-mono text-xs">
            {queryResult ? (
              queryResult.success ? (
                <div>
                  <div className="text-[11px] text-emerald-400 mb-2 font-mono">
                    Query succeeded in {queryResult.durationMs}ms
                  </div>
                  {Array.isArray(queryResult.data) ? (
                    <pre className="text-emerald-300 whitespace-pre-wrap">
                      {JSON.stringify(queryResult.data, null, 2)}
                    </pre>
                  ) : (
                    <pre className="text-emerald-300">{JSON.stringify(queryResult.data, null, 2)}</pre>
                  )}
                </div>
              ) : (
                <div className="text-rose-400">
                  <div className="font-bold mb-1">SQL Execution Error:</div>
                  <pre className="whitespace-pre-wrap">{queryResult.error}</pre>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                Write a SQL query above and click "Run"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
