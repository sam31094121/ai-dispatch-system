import React, { useState } from 'react';
import { History, Search, Calendar, User, Filter } from 'lucide-react';

// Demo history data
const demoHistory = [
  { date: '2026-03-07', platform: '奕心', employees: 15, revenue: 850000, status: 'PASS', auditAt: '2026-03-07 18:30' },
  { date: '2026-03-06', platform: '奕心', employees: 14, revenue: 720000, status: 'WARNING', auditAt: '2026-03-06 17:45' },
  { date: '2026-03-06', platform: '民視', employees: 10, revenue: 430000, status: 'PASS', auditAt: '2026-03-06 18:10' },
  { date: '2026-03-05', platform: '公司產品', employees: 8, revenue: 210000, status: 'FAIL', auditAt: '2026-03-05 19:00' },
  { date: '2026-03-05', platform: '奕心', employees: 15, revenue: 910000, status: 'PASS', auditAt: '2026-03-05 17:30' },
  { date: '2026-03-04', platform: '奕心', employees: 15, revenue: 780000, status: 'PASS', auditAt: '2026-03-04 18:00' },
  { date: '2026-03-04', platform: '民視', employees: 11, revenue: 510000, status: 'PASS', auditAt: '2026-03-04 18:20' },
];

const statusBadge: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  FAIL: 'bg-red-100 text-red-700',
};

export const HistoryPage: React.FC = () => {
  const [dateFilter, setDateFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const filtered = demoHistory.filter(h => {
    if (dateFilter && h.date !== dateFilter) return false;
    if (platformFilter && h.platform !== platformFilter) return false;
    if (statusFilter && h.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3"><History className="w-7 h-7 text-indigo-500" /> 歷史資料查詢</h1>
        <p className="text-gray-500 mt-1">查看過去各日、各平台的業績與審計紀錄</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-600 font-medium"><Filter className="w-5 h-5" /> 篩選條件</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> 日期</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">平台</label>
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">全部</option>
              <option>奕心</option>
              <option>民視</option>
              <option>公司產品</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">審計狀態</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">全部</option>
              <option value="PASS">PASS</option>
              <option value="WARNING">WARNING</option>
              <option value="FAIL">FAIL</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> 姓名</label>
            <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="搜尋姓名..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Search className="w-5 h-5 text-blue-500" /> 查詢結果</h2>
          <span className="text-xs text-gray-500">{filtered.length} 筆紀錄</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50/80 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3 text-left border-b">日期</th>
                <th className="px-4 py-3 text-left border-b">平台</th>
                <th className="px-4 py-3 text-right border-b">人數</th>
                <th className="px-4 py-3 text-right border-b">總業績</th>
                <th className="px-4 py-3 text-center border-b">審計</th>
                <th className="px-4 py-3 text-left border-b">審計時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-800">{h.date}</td>
                  <td className="px-4 py-3 text-gray-600">{h.platform}</td>
                  <td className="px-4 py-3 text-right">{h.employees}</td>
                  <td className="px-4 py-3 text-right font-semibold">${h.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge[h.status]}`}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{h.auditAt}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">沒有符合條件的紀錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
