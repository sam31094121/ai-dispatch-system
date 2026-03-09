import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DailyReportWorkbenchPage } from './pages/DailyReportWorkbenchPage';
import OldDashboardPage from './pages/OldDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DailyReportWorkbenchPage />} />
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
        <Route path="/old" element={<OldDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
