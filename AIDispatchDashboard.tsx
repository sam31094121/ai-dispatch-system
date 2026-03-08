import React, { useState } from 'react';

// ==========================================
// 1. 型別與角色定義 (未來可移至獨立 types.ts)
// ==========================================
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  MARKETER = 'MARKETER',
  RECRUITER = 'RECRUITER',
  TRAINER = 'TRAINER'
}

// ==========================================
// 2. 測試用 Mock Data (未來替換為資料庫 API)
// ==========================================
const mockData = {
  systemOverview: { totalRevenue: 1520000, activeTasks: 120, aiAccuracy: '92.4%' },
  teamStats: { teamName: 'A組', teamRevenue: 450000, members: 5 },
  personalStats: { rank: 3, followUps: 15, renewals: 8, totalRevenue: 120000 },
  todayDispatch: [
    { id: 'D001', customer: '王老闆', intentScore: 95, recommendedAction: '優先推銷續約方案' },
    { id: 'D002', customer: '李小姐', intentScore: 82, recommendedAction: '提供折扣優惠' }
  ],
  recruitCandidates: [
    { id: 'C001', name: '張三', aiScore: 88, suggestion: '極具潛力，建議錄取' },
    { id: 'C002', name: '李四', aiScore: 65, suggestion: '需加強溝通技巧' }
  ],
  trainingData: {
    weaknesses: ['陌生開發', '異議處理'],
    recommendedCourses: ['高單價談判技巧', 'AI 輔助話術進階']
  }
};

// ==========================================
// 3. 各角色專屬 Widget 元件
// ==========================================

// 最高管理者 Widget
const SuperAdminWidget = () => (
  <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
    <h3 className="text-lg font-bold text-red-700 mb-3">👑 最高管理者視角 (全部數據)</h3>
    <div className="grid grid-cols-3 gap-4">
      <div className="p-3 bg-white rounded shadow">全系統總營收: ${mockData.systemOverview.totalRevenue.toLocaleString()}</div>
      <div className="p-3 bg-white rounded shadow">執行中派單: {mockData.systemOverview.activeTasks} 件</div>
      <div className="p-3 bg-white rounded shadow">AI 預測準確率: {mockData.systemOverview.aiAccuracy}</div>
    </div>
    <div className="mt-4 flex gap-2">
      <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">修改全系統參數</button>
      <button className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">檢視全部派單</button>
    </div>
  </div>
);

// 主管 Widget
const ManagerWidget = () => (
  <div className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
    <h3 className="text-lg font-bold text-blue-700 mb-3">👥 主管視角 (團隊數據)</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 bg-white rounded shadow">團隊名稱: {mockData.teamStats.teamName}</div>
      <div className="p-3 bg-white rounded shadow">團隊總業績: ${mockData.teamStats.teamRevenue.toLocaleString()}</div>
    </div>
    <button className="mt-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">查看人員分析</button>
  </div>
);

// 行銷人員 Widget
const MarketerWidget = () => (
  <div className="p-4 bg-green-50 rounded-lg shadow-sm border border-green-200">
    <h3 className="text-lg font-bold text-green-700 mb-3">💼 行銷人員視角 (個人業績與派單)</h3>
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="p-3 bg-white rounded shadow">目前排名: 第 {mockData.personalStats.rank} 名</div>
      <div className="p-3 bg-white rounded shadow">追單數: {mockData.personalStats.followUps}</div>
      <div className="p-3 bg-white rounded shadow">續單數: {mockData.personalStats.renewals}</div>
      <div className="p-3 bg-white rounded shadow">總業績: ${mockData.personalStats.totalRevenue.toLocaleString()}</div>
    </div>
    <h4 className="font-semibold mb-2">🤖 AI 今日派單順序</h4>
    <ul className="space-y-2">
      {mockData.todayDispatch.map(task => (
        <li key={task.id} className="p-2 bg-white rounded border border-green-100 flex justify-between items-center">
          <span>{task.customer} (意向分數: {task.intentScore})</span>
          <span className="text-sm text-gray-500">AI 建議: {task.recommendedAction}</span>
        </li>
      ))}
    </ul>
  </div>
);

// 招聘管理者 Widget
const RecruiterWidget = () => (
  <div className="p-4 bg-purple-50 rounded-lg shadow-sm border border-purple-200">
    <h3 className="text-lg font-bold text-purple-700 mb-3">🎯 招聘管理者視角</h3>
    <div className="space-y-3">
      {mockData.recruitCandidates.map(c => (
        <div key={c.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
          <div>
            <span className="font-bold">{c.name}</span> 
            <span className="ml-2 text-sm text-purple-600">AI 評分: {c.aiScore}</span>
          </div>
          <span className="text-sm text-gray-600">{c.suggestion}</span>
        </div>
      ))}
    </div>
    <button className="mt-4 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">管理招聘流程</button>
  </div>
);

// 訓練管理者 Widget
const TrainerWidget = () => (
  <div className="p-4 bg-orange-50 rounded-lg shadow-sm border border-orange-200">
    <h3 className="text-lg font-bold text-orange-700 mb-3">🎓 訓練管理者視角</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 bg-white rounded shadow">
        <h4 className="font-semibold mb-2 text-orange-800">行銷團隊常見弱點</h4>
        <ul className="list-disc pl-5">
          {mockData.trainingData.weaknesses.map(w => <li key={w}>{w}</li>)}
        </ul>
      </div>
      <div className="p-3 bg-white rounded shadow">
        <h4 className="font-semibold mb-2 text-orange-800">AI 推薦訓練課程</h4>
        <ul className="list-disc pl-5">
          {mockData.trainingData.recommendedCourses.map(c => <li key={c}>{c}</li>)}
        </ul>
      </div>
    </div>
    <button className="mt-4 px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700">管理訓練任務</button>
  </div>
);

// ==========================================
// 4. 主儀表板入口元件 (Dashboard)
// ==========================================
export default function AIDispatchDashboard() {
  // 測試用的狀態：用下拉選單快速切換角色來預覽不同視角
  const [currentRole, setCurrentRole] = useState<SystemRole>(SystemRole.MARKETER);

  // 根據角色渲染對應的 Widget
  const renderDashboardContent = () => {
    switch (currentRole) {
      case SystemRole.SUPER_ADMIN: return <SuperAdminWidget />;
      case SystemRole.MANAGER: return <ManagerWidget />;
      case SystemRole.MARKETER: return <MarketerWidget />;
      case SystemRole.RECRUITER: return <RecruiterWidget />;
      case SystemRole.TRAINER: return <TrainerWidget />;
      default: return <div>沒有權限</div>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <div className="mb-6 flex justify-between items-center bg-gray-800 text-white p-4 rounded-lg shadow-md">
        <div>
          <h1 className="text-2xl font-bold">網頁人工智慧派單系統 (測試版)</h1>
          <p className="text-sm text-gray-300 mt-1">未來這裡將串接資料庫與真實 Auth Token</p>
        </div>
        
        {/* 開發測試用：角色切換器 */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">模擬登入角色：</label>
          <select 
            className="p-2 border rounded text-black font-semibold"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as SystemRole)}
          >
            <option value={SystemRole.SUPER_ADMIN}>最高管理者 (Super Admin)</option>
            <option value={SystemRole.MANAGER}>主管 (Manager)</option>
            <option value={SystemRole.MARKETER}>行銷人員 (Marketer)</option>
            <option value={SystemRole.RECRUITER}>招聘管理者 (Recruiter)</option>
            <option value={SystemRole.TRAINER}>訓練管理者 (Trainer)</option>
          </select>
        </div>
      </div>

      {/* 儀表板主要內容區塊 */}
      <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
        {renderDashboardContent()}
      </div>
    </div>
  );
}
