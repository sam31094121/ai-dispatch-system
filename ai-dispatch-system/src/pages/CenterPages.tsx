import React, { useMemo, useState } from 'react';
import { 執行系統自動維修 } from '../服務/系統自動維修服務';

// 導入原始的各功能頁面
import { DailyReportWorkbenchPage } from './DailyReportWorkbenchPage';
import { DailyReportInputPage } from './DailyReportInputPage';
import { OneClickPipelinePage } from './OneClickPipelinePage';
import { RankingDispatchPage } from './RankingDispatchPage';
import { AnnouncementPage } from './AnnouncementPage';
import { BroadcastPage } from './BroadcastPage';
import { LineForwardPage } from './LineForwardPage';
import { SettingsPage } from './SettingsPage';
import { SystemStatusPanel } from '../components/SystemStatusPanel';

// 導入強大功能的資料引擎與面板 (恢復 V50 體驗)
import CeoDashboard from '../components/CeoDashboard';
import { rawEmployees, platforms } from '../data/mockData';
import { calculateAiScores, assignGroups } from '../engine/aiEngine';
import { analyzeTrends } from '../engine/trendEngine';

// ════════════════════════════════════════════════════
// 1. 每日業績核心樞紐（工作台）
// ════════════════════════════════════════════════════
export function WorkbenchCenterPage() {
  const 維修結果 = useMemo(() => 執行系統自動維修(), []);
  const [showRepairLog, setShowRepairLog] = useState(false);

  // 1. 還原強大的 AI 戰力引擎與分組
  const processedEmployees = useMemo(() => {
    const scored = calculateAiScores(rawEmployees);
    return assignGroups(scored);
  }, []);

  // 2. 還原強大的動能趨勢分析
  const trends = useMemo(() => analyzeTrends(processedEmployees), [processedEmployees]);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      
      {/* ── 自動維修狀態列 (預設收合細條，點擊可展開詳細資訊) ── */}
      <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between cursor-pointer shadow-sm z-50 relative" onClick={() => setShowRepairLog(!showRepairLog)}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-stone-800">✅ 系統自動維修引擎狀態</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">維修完成</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">保留核心 {維修結果.保留頁面.length} 模組</span>
          <span className="text-xs text-stone-500 ml-2">(點擊展開/收合詳細報告)</span>
        </div>
      </div>

      {showRepairLog && (
        <div className="bg-stone-50 p-6 border-b border-stone-200">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">維修摘要報告</h2>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-stone-700 mb-2">保留核心清單</h3>
                  <div className="space-y-2">
                    {維修結果.保留頁面.map(頁面 => (
                      <div key={頁面.代碼} className="p-3 bg-stone-50 rounded-lg text-sm border border-stone-100 flex justify-between">
                        <span className="font-medium">{頁面.名稱}</span>
                        <span className="text-stone-500">總分: {頁面.強度分數 + 頁面.優化分數}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-700 mb-2">衝突處理紀錄</h3>
                  {維修結果.衝突紀錄.length === 0 ? (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">目前無衝突模組，系統狀態完美。</div>
                  ) : (
                    <div className="space-y-2">
                       {維修結果.衝突紀錄.map((紀錄, i) => (
                        <div key={i} className="p-3 bg-rose-50 text-rose-800 rounded-lg text-sm border border-rose-100">
                          <span className="font-bold">{紀錄.衝突類型}</span> → 已保留「{紀錄.保留模組代碼}」
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-stone-700 mt-4 mb-2">合併與停用紀錄</h3>
                  {維修結果.停用功能紀錄.length === 0 ? (
                    <div className="text-sm text-stone-500">無紀錄</div>
                  ) : (
                    <div className="space-y-2">
                       {維修結果.停用功能紀錄.map((紀錄, i) => (
                        <div key={i} className="p-2 bg-stone-100 rounded text-xs text-stone-600">
                          停用: {紀錄.舊功能名稱} (已合併至 {紀錄.保留對象代碼})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 恢復的強大 AI 分析與總控面板 (V50 完整體驗) ── */}
      <div className="p-6">
        <CeoDashboard employees={processedEmployees} platforms={platforms} trends={trends} />
      </div>

      {/* ── 原始工作台介面 (這才是使用者要的 1️⃣ 輸入站, 2️⃣ 等功能) ── */}
      <div className="flex-1 relative">
        <DailyReportWorkbenchPage />
      </div>

    </div>
  );
}

// ════════════════════════════════════════════════════
// 其他中心元件 (對接回原本的獨立頁面)
// ════════════════════════════════════════════════════

// 2. 業績輸入與智能審計中心
export function ReportCenterPage() { 
  return <OneClickPipelinePage />; 
}

// 3. 主管派單台
export function DispatchCenterPage() {
  return <RankingDispatchPage />;
}

// 4. 播報總控台
export function AnnounceCenterPage() { 
  return <AnnouncementPage onNavigate={() => {}} />; 
}

// ============================================
// ── 新增 V50 功能 Stub 頁面 (由 Router 動態掛載) ──
// ============================================

export function MarketerPage() { return <div className="p-8 text-xl font-bold">👤 員工個人頁 (V50 模組準備中...)</div>; }
export function MarketingAIPage() { return <div className="p-8 text-xl font-bold">📣 AI 行銷建議 (V50 模組準備中...)</div>; }
export function HvCenterPage() { return <div className="p-8 text-xl font-bold">💎 高價總控台 (V50 模組準備中...)</div>; }
export function HvPersonalPage() { return <div className="p-8 text-xl font-bold">🎯 高價個人頁 (V50 模組準備中...)</div>; }
export function HvScriptsPage() { return <div className="p-8 text-xl font-bold">📚 話術素材庫 (V50 模組準備中...)</div>; }
export function HvTargetsPage() { return <div className="p-8 text-xl font-bold">🎯 攻單名單 (V50 模組準備中...)</div>; }
export function HvTrainingPage() { return <div className="p-8 text-xl font-bold">🎓 高價訓練 (V50 模組準備中...)</div>; }
export function HvRallyPage() { return <div className="p-8 text-xl font-bold">📣 團隊喊話 (V50 模組準備中...)</div>; }
export function BcScriptsPage() { return <BroadcastPage />; }
export function BcStylesPage() { return <div className="p-8 text-xl font-bold">⚙️ 播報風格 (V50 模組準備中...)</div>; }
export function BcPlaybackPage() { return <BroadcastPage />; }
export function LineCenterPage() { return <LineForwardPage />; }
export function LineRulesPage() { return <div className="p-8 text-xl font-bold">📖 轉傳規則 (V50 模組準備中...)</div>; }
export function RecruiterPage() { return <div className="p-8 text-xl font-bold">🎯 招聘管理 (V50 模組準備中...)</div>; }
export function TrainerPage() { return <div className="p-8 text-xl font-bold">🎓 訓練管理 (V50 模組準備中...)</div>; }
export function SystemCenterPage() {
  return (
    <div className="p-6 bg-stone-50 min-h-screen space-y-8 max-w-4xl mx-auto">
      <SystemStatusPanel />
      <SettingsPage />
    </div>
  );
}
