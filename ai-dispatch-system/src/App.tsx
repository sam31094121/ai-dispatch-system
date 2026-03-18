import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

import { DailyReportWorkbenchPage } from './pages/DailyReportWorkbenchPage';
import { OneClickPipelinePage } from './pages/OneClickPipelinePage';
import { HealingCashFlowPage } from './pages/HealingCashFlowPage';
import OldDashboardPage from './pages/OldDashboardPage';
import BigDataCorePage from './pages/BigDataCorePage';
import SoulCorePage from './pages/SoulCorePage';
import RankingPage from './pages/RankingPage'; // ⬇️ 新增：大數據雷達分析頁


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

          {/* 首頁：每日業績工作台（輸入→排名→派單→公告 一條龍） */}
          <Route index element={<DailyReportWorkbenchPage />} />
          {/* 一鍵直通管道 */}
          <Route path="pipeline" element={<OneClickPipelinePage />} />
          {/* 舊版動態儀表板（保留備用） */}
          <Route path="dashboard" element={<OldDashboardPage />} />
          
          {/* 療癒金流：立體景深特效 */}
          <Route path="healing" element={<HealingCashFlowPage />} />

          {/* 大數據核心：立體全息自癒控制台 */}
          <Route path="core" element={<BigDataCorePage />} />
          
          {/* 靈魂核心：虛空數據導入控制台 */}
          <Route path="soul" element={<SoulCorePage />} />
          
          {/* ⬇️ AI 加強：大數據戰力分析與雷達圖 */}
          <Route path="ranking" element={<RankingPage />} />
          
          <Route path="boss"       element={<BossPage />} />
          <Route path="dispatch"   element={<DispatchPage />} />
          <Route path="member"     element={<MemberPage />} />
          <Route path="marketing"  element={<MarketingPage />} />

          {/* 高價成交爆發 */}
          <Route path="hv-command"  element={<HvCommandPage />} />
          <Route path="hv-personal" element={<HvPersonalPage />} />
          <Route path="hv-scripts"  element={<HvScriptsPage />} />
          <Route path="hv-targets"  element={<HvTargetsPage />} />
          <Route path="hv-training" element={<HvTrainingPage />} />
          <Route path="hv-rally"    element={<HvRallyPage />} />

          {/* 女聲智慧播報 */}
          <Route path="bc-command"  element={<BcCommandPage />} />
          <Route path="bc-scripts"  element={<BcScriptsPage />} />
          <Route path="bc-style"    element={<BcStylePage />} />
          <Route path="bc-playback" element={<BcPlaybackPage />} />

          {/* LINE 群組轉傳 */}
          <Route path="line-convert" element={<LineConvertPage />} />
          <Route path="line-rules"   element={<LineRulesPage />} />

          {/* 系統管理 */}
          <Route path="hiring"   element={<HiringPage />} />
          <Route path="training" element={<TrainingPage />} />

        </Route>

        {/* 舊版總控台備用路由 */}
        <Route path="/old" element={<OldDashboardPage />} />

        {/* 所有未知路由導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
