// ==========================================
// 員工個人頁 (My Dashboard)
// ==========================================
import React from 'react';
import { Award, TrendingUp, Target, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardContent, MetricCard, ProgressBar } from './ui';
import { type Employee } from '../data/mockData';
import { getGroupColor } from '../engine/aiEngine';

interface Props { employees: Employee[] }

export default function MyDashboard({ employees }: Props) {
  // 模擬：預設顯示第一名的個人頁（未來由登入 Token 決定）
  const me = employees[0];
  if (!me) return <p>無資料</p>;

  const gc = getGroupColor(me.group);
  const avgTotal = employees.reduce((s, e) => s + e.total, 0) / employees.length;
  const goalProgress = Math.min(Math.round((me.total / avgTotal) * 100), 150);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">💼 {me.name} 的工作區</h2>
          <p className="text-slate-500 mt-1">今日即時業績與 AI 建議</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${gc.light} ${gc.text} border ${gc.border}`}>
          {gc.label}
        </div>
      </div>

      {/* 個人指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="目前名次" value={`第 ${me.rank} 名`} icon={Award} color="indigo" />
        <MetricCard label="追單數" value={me.followUps} icon={Target} color="blue" />
        <MetricCard label="續單額" value={`$${me.renewals.toLocaleString()}`} icon={TrendingUp} color="emerald" />
        <MetricCard label="總業績" value={`$${me.total.toLocaleString()}`} icon={TrendingUp} color="purple" />
      </div>

      {/* 目標達成 */}
      <Card>
        <CardHeader title="今日目標進度" icon={Target} />
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">平均業績目標：${Math.round(avgTotal).toLocaleString()}</span>
            <span className="font-bold text-slate-800">{goalProgress}%</span>
          </div>
          <ProgressBar value={goalProgress} color={goalProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} />
        </CardContent>
      </Card>

      {/* AI 戰力雷達 */}
      <Card>
        <CardHeader title="AI 戰力分析" icon={Target} />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: '成交能力', value: me.closeRate ?? 0, max: 100 },
              { label: '續單能力', value: me.renewalRate ?? 0, max: 100 },
              { label: '追單能力', value: me.followUpRate ?? 0, max: 100 },
              { label: '客單價', value: me.avgOrderValue ?? 0, max: 50000, display: `$${(me.avgOrderValue ?? 0).toLocaleString()}` },
              { label: '穩定度', value: me.stability ?? 0, max: 100 },
              { label: '戰力總分', value: me.aiScore ?? 0, max: 100 },
            ].map(s => (
              <div key={s.label} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{s.label}</span>
                  <span className="font-bold text-slate-800">{s.display ?? s.value}</span>
                </div>
                <ProgressBar value={s.value} max={s.max} color={s.value / s.max > 0.7 ? 'bg-emerald-500' : s.value / s.max > 0.4 ? 'bg-amber-500' : 'bg-red-400'} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI 建議 */}
      <Card className="border-indigo-200">
        <CardHeader title="🤖 AI 個人建議" className="bg-indigo-50" />
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">{me.suggestion}</p>
        </CardContent>
      </Card>
    </div>
  );
}
