import React, { useState } from 'react';
import { Power, PowerOff, Wrench, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, HardDrive, Database, Clock } from 'lucide-react';
import { useSystemStatus } from '../hooks/useSystemStatus';

export const SystemStatusPanel: React.FC = () => {
  const { status, loading, error, fetchStatus, boot, stop, repair, toggleModule } = useSystemStatus(8000);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function runAction(fn: () => Promise<any>, label: string) {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const r = await fn();
      setActionMsg(r.message ?? label);
    } catch {
      setActionMsg('❌ 操作失敗，請確認後端連線');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-3 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin" /> 載入系統狀態...
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-5 flex items-center gap-3 text-red-700">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="font-medium">{error ?? '無法取得系統狀態'}</span>
        <button onClick={fetchStatus} className="ml-auto text-xs px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg transition">重試</button>
      </div>
    );
  }

  const { engine, modules, storage, database, alerts } = status;

  return (
    <div className="space-y-4">
      {/* 警示橫幅 */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          {alerts.map((a, i) => (
            <p key={i} className="text-sm text-amber-800">{a}</p>
          ))}
        </div>
      )}

      {/* 行動回饋 */}
      {actionMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 font-medium">
          {actionMsg}
        </div>
      )}

      {/* 引擎控制 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Power className="w-4 h-4 text-indigo-500" /> AI 全域引擎
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${engine.running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {engine.running ? '運行中' : '已停止'}
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">當前時間（台灣）</p>
              <p className="font-mono text-gray-800 text-xs">{engine.currentTime.replace('T', ' ').split('.')[0]}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">啟動時間</p>
              <p className="font-mono text-gray-800 text-xs">{engine.startedAt ? engine.startedAt.replace('T', ' ').split('.')[0] : '—'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              disabled={engine.running || actionLoading}
              onClick={() => runAction(boot, '引擎啟動')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              <Power className="w-4 h-4" /> 啟動引擎
            </button>
            <button
              disabled={!engine.running || actionLoading}
              onClick={() => runAction(stop, '引擎停止')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              <PowerOff className="w-4 h-4" /> 停止引擎
            </button>
            <button
              disabled={actionLoading}
              onClick={() => runAction(repair, '系統修復')}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40">
              <Wrench className="w-4 h-4" /> 系統修復
            </button>
          </div>
        </div>
      </div>

      {/* 模組開關 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">功能模組狀態</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {modules.map((m) => (
            <div key={m.key} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
              </div>
              <button
                disabled={m.locked || actionLoading}
                onClick={() => runAction(() => toggleModule(m.key), `切換 ${m.label}`)}
                title={m.locked ? '核心模組 — 禁止關閉' : m.enabled ? '點擊停用' : '點擊啟用'}
                className="shrink-0 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {m.enabled
                  ? <ToggleRight className="w-7 h-7 text-green-500" />
                  : <ToggleLeft className="w-7 h-7 text-gray-300" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 存檔 & 資料庫狀態 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800 text-sm">存檔狀態</h2>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <StorageRow label="今日存檔資料夾" ok={storage.todayDir} />
            <StorageRow label="最新報表檔" ok={storage.latestFile} />
            <StorageRow label="今日日誌" ok={storage.logFile} extra={storage.logFile ? `${storage.logSize} bytes` : undefined} />
            <StorageRow label={`備份數量`} ok={storage.backupCount > 0} extra={`${storage.backupCount} 個`} />
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-gray-800 text-sm">資料庫狀態</h2>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">今日報表數</span>
              <span className="font-semibold text-gray-800">{database.todayReportCount} 筆</span>
            </div>
            {database.latestSnapshot ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">最新快照版本</span>
                  <span className="font-mono text-xs text-gray-700">{database.latestSnapshot.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">快照日期</span>
                  <span className="font-medium text-gray-800">{database.latestSnapshot.reportDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">審計結果</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${database.latestSnapshot.auditResult === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {database.latestSnapshot.auditResult}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-xs">尚無派單快照</p>
            )}
          </div>
        </div>
      </div>

      {/* 更新時間 */}
      <div className="flex items-center gap-2 text-xs text-gray-400 justify-end">
        <Clock className="w-3 h-3" />
        每 8 秒自動更新
        <button onClick={fetchStatus} className="ml-1 text-blue-400 hover:text-blue-600 transition flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> 立即更新
        </button>
      </div>
    </div>
  );
};

const StorageRow = ({ label, ok, extra }: { label: string; ok: boolean; extra?: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500">{label}</span>
    <span className={`flex items-center gap-1 text-xs font-medium ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      {extra ?? (ok ? '正常' : '缺少')}
    </span>
  </div>
);
