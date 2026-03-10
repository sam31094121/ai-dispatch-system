import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

// ── 核心工作台（新架構） ──
import { DailyReportWorkbenchPage } from './pages/DailyReportWorkbenchPage';

// ── 各模組路由頁（舊元件包裝） ──
import {
  BossPage,
  DispatchPage,
  MemberPage,
  MarketingPage,
  HvCommandPage,
  HvPersonalPage,
  HvScriptsPage,
  HvTargetsPage,
  HvTrainingPage,
  HvRallyPage,
  BcCommandPage,
  BcScriptsPage,
  BcStylePage,
  BcPlaybackPage,
  LineConvertPage,
  LineRulesPage,
  HiringPage,
  TrainingPage,
} from './pages/ModuleRoutePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>

          {/* ── 每日業績核心樞紐 ── */}
          <Route index element={<DailyReportWorkbenchPage />} />
          <Route path="boss"       element={<BossPage />} />
          <Route path="dispatch"   element={<DispatchPage />} />
          <Route path="member"     element={<MemberPage />} />
          <Route path="marketing"  element={<MarketingPage />} />

          {/* ── 高價成交爆發 ── */}
          <Route path="hv-command"  element={<HvCommandPage />} />
          <Route path="hv-personal" element={<HvPersonalPage />} />
          <Route path="hv-scripts"  element={<HvScriptsPage />} />
          <Route path="hv-targets"  element={<HvTargetsPage />} />
          <Route path="hv-training" element={<HvTrainingPage />} />
          <Route path="hv-rally"    element={<HvRallyPage />} />

          {/* ── 女聲智慧播報 ── */}
          <Route path="bc-command"  element={<BcCommandPage />} />
          <Route path="bc-scripts"  element={<BcScriptsPage />} />
          <Route path="bc-style"    element={<BcStylePage />} />
          <Route path="bc-playback" element={<BcPlaybackPage />} />

          {/* ── LINE 群組轉傳 ── */}
          <Route path="line-convert" element={<LineConvertPage />} />
          <Route path="line-rules"   element={<LineRulesPage />} />

          {/* ── 系統管理 ── */}
          <Route path="hiring"   element={<HiringPage />} />
          <Route path="training" element={<TrainingPage />} />

        </Route>

        {/* 所有未知路由導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
