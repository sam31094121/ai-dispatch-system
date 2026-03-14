import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

import { DailyReportWorkbenchPage } from './pages/DailyReportWorkbenchPage';
import { OneClickPipelinePage } from './pages/OneClickPipelinePage';
import OldDashboardPage from './pages/OldDashboardPage';

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

          {/* 首頁：每日業績極速直通樞紐 */}
          <Route index element={<OneClickPipelinePage />} />
          {/* 進階工作台：舊版多步驟工作台 */}
          <Route path="workbench-advanced" element={<DailyReportWorkbenchPage />} />
          
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

        {/* 恢復被刪除的舊版總控台路由 */}
        <Route path="/old" element={<OldDashboardPage />} />

        {/* 所有未知路由導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
