// ==========================================
// 老闆總控台 (CEO Dashboard)
// ==========================================
import React from 'react';
import { TrendingUp, AlertTriangle, Zap, Shield, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardContent, MetricCard } from './ui';
import { type Employee, type Platform } from '../data/mockData';
import { calcHealthScore, getGroupColor } from '../engine/aiEngine';
import type { TrendAnalysis } from '../engine/trendEngine';

interface Props {
  employees: Employee[];
  platforms: Platform[];
  trends?: TrendAnalysis[];
}

export default function CeoDashboard({ employees, platforms, trends }: Props) {
  const totalRevenue = platforms.reduce((s, p) => s + p.revenue, 0);
  const totalEmpRevenue = employees.reduce((s, e) => s + e.total, 0);
  const healthScore = calcHealthScore(employees);
  const activeCount = employees.filter(e => e.followUps > 0).length;

  // 圖表數據
  const top10 = employees.slice(0, 10).map(e => ({
    name: e.name, total: e.total, renewals: e.renewals
  }));
  const groupData = ['A1', 'A2', 'B', 'C'].map(g => ({
    name: g,
    count: employees.filter(e => e.group === g).length,
    revenue: employees.filter(e => e.group === g).reduce((s, e) => s + e.total, 0),
  }));
  const pieColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  // AI 洞察
  const topEmployee = employees[0];
  const riskEmployees = employees.filter(e => e.total < 15000);
  const biggestProblem = riskEmployees.length > 3
    ? `${riskEmployees.length} 名員工業績低於 C 組門檻 $15,000`
    : '目前團隊運作穩定';
  const biggestOpportunity = `${topEmployee?.name} 今日戰力分數 ${topEmployee?.aiScore}，帶動 A1 組產能`;

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🏢 老闆總控台</h2>
        <p className="text-slate-500 mt-1">3/7 結算｜人工智慧商業帝國系統 V50</p>
      </div>

      {/* 頂部指標卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="三平台實收" value={`$${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="emerald" />
        <MetricCard label="員工總業績" value={`$${totalEmpRevenue.toLocaleString()}`} icon={BarChart3} color="indigo" />
        <MetricCard label="公司健康度" value={`${healthScore} 分`} icon={Shield} color={healthScore > 70 ? 'emerald' : 'orange'} />
        <MetricCard label="活躍人數" value={`${activeCount} / ${employees.length}`} icon={Users} color="purple" />
      </div>

      {/* AI 洞察區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase mb-1">今日最大問題</p>
              <p className="text-sm text-slate-700">{biggestProblem}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="flex gap-3">
            <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">今日最大機會</p>
              <p className="text-sm text-slate-700">{biggestOpportunity}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200">
          <CardContent className="flex gap-3">
            <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">AI 建議策略</p>
              <p className="text-sm text-slate-700">優先派續單收割組，加速實收落袋</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 平台業績分布 */}
        <Card>
          <CardHeader title="平台業績分布" icon={BarChart3} />
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platforms.map(p => ({ name: p.name, value: p.revenue }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {platforms.map((_, i) => <Cell key={i} fill={['#6366f1', '#8b5cf6', '#a78bfa'][i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TOP 10 業績 */}
        <Card className="lg:col-span-2">
          <CardHeader title="TOP 10 員工業績" icon={TrendingUp} />
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 10000).toFixed(0)}萬`} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} name="總業績" />
                <Bar dataKey="renewals" fill="#a5b4fc" radius={[0, 4, 4, 0]} name="續單額" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 分組概況 */}
      <Card>
        <CardHeader title="AI 派單分組概況" icon={Users} />
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {groupData.map((g, i) => {
              const gc = getGroupColor(g.name);
              return (
                <div key={g.name} className={`p-4 rounded-xl border ${gc.border} ${gc.light}`}>
                  <p className="text-sm font-bold mb-1">{gc.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{g.count} 人</p>
                  <p className="text-xs text-slate-500 mt-1">組業績 ${g.revenue.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* 趨勢比較 */}
      {trends && trends.length > 0 && (
        <Card>
          <CardHeader title="📈 2月 vs 3月 動能分析（TOP 10）" icon={TrendingUp} />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="text-left py-2 px-2">姓名</th>
                    <th className="text-right py-2 px-2">2月總額</th>
                    <th className="text-right py-2 px-2">3月累積</th>
                    <th className="text-right py-2 px-2">動能比</th>
                    <th className="text-left py-2 px-2">趨勢</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.slice(0, 10).map(t => (
                    <tr key={t.name} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-2 px-2 text-right text-slate-600">${t.febRevenue.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-800">${t.marRevenue.toLocaleString()}</td>
                      <td className={`py-2 px-2 text-right font-bold ${t.momentum >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(t.momentum * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-2">{t.trendLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
