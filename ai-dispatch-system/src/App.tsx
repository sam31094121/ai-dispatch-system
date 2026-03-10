// HMR: 自動維修動態路由版
import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { 取得保留中心設定 } from './服務/系統自動維修服務';
import {
  WorkbenchCenterPage,
  ReportCenterPage,
  DispatchCenterPage,
  MarketerPage,
  MarketingAIPage,
  HvCenterPage,
  HvPersonalPage,
  HvScriptsPage,
  HvTargetsPage,
  HvTrainingPage,
  HvRallyPage,
  AnnounceCenterPage,
  BcScriptsPage,
  BcStylesPage,
  BcPlaybackPage,
  LineCenterPage,
  LineRulesPage,
  RecruiterPage,
  TrainerPage,
  SystemCenterPage,
} from './pages/CenterPages';
import OldDashboardPage from './pages/OldDashboardPage';

// ── 中心 key → 元件對照表 ──
const CENTER_COMPONENT_MAP: Record<string, React.ComponentType> = {
  '老闆總控台':        WorkbenchCenterPage,
  '業績輸入與智能審計中心': ReportCenterPage,
  '主管派單台':        DispatchCenterPage,
  '員工個人頁':        MarketerPage,
  'AI行銷建議':        MarketingAIPage,
  '高價總控台':        HvCenterPage,
  '高價個人頁':        HvPersonalPage,
  '話術素材庫':        HvScriptsPage,
  '攻單名單':          HvTargetsPage,
  '高價訓練':          HvTrainingPage,
  '團隊喊話':          HvRallyPage,
  '播報總控台':        AnnounceCenterPage,
  '播報稿管理':        BcScriptsPage,
  '播報風格':          BcStylesPage,
  '播放控制':          BcPlaybackPage,
  'LINE轉傳台':        LineCenterPage,
  '轉傳規則':          LineRulesPage,
  '招聘管理':          RecruiterPage,
  '訓練管理':          TrainerPage,
  '系統設定中心':      SystemCenterPage,
};

function App() {
  // 取得維修後保留的中心清單 → 動態生成路由
  const activeCenters = useMemo(() => 取得保留中心設定(), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>

          {/* 動態生成路由：只掛載保留中心 */}
          {activeCenters.map((center) => {
            const Component = CENTER_COMPONENT_MAP[center.代碼];
            if (!Component) return null;

            // 每日業績核心樞紐 / 老闆總控台 是首頁 (index route, path = "/")
            if (center.代碼 === '老闆總控台') {
              return <Route key={center.代碼} index element={<Component />} />;
            }

            // 其他中心依 path 註冊（去掉前面的 /）
            const routePath = center.路徑.startsWith('/')
              ? center.路徑.slice(1)
              : center.路徑;
            return <Route key={center.代碼} path={routePath} element={<Component />} />;
          })}

          {/* ── 恢復被刪除的靜態路由 ── */}
          <Route path="history" element={
            <div style={{ padding: 40, color: '#64748b', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>🗂️</span> 歷史報表查詢頁 (建置中...)
            </div>
          } />
          <Route path="settings" element={
            <div style={{ padding: 40, color: '#64748b', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>⚙️</span> 系統常數設定頁 (建置中...)
            </div>
          } />

        </Route>

        {/* ── 恢復被刪除的舊版總控台路由 ── */}
        <Route path="/old" element={<OldDashboardPage />} />

        {/* 所有未知路由（含被停用中心的路徑）導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
