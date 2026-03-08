// ==========================================
// 招聘管理頁 + 訓練管理頁 (合併元件)
// ==========================================
import React from 'react';
import { UserPlus, Target, BookOpen, PlayCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, ProgressBar } from './ui';
import { type Employee } from '../data/mockData';
import { cn } from '../lib/utils';

// ─── 招聘管理頁 ───
const candidates = [
  { id: 'HC001', name: '張三', lang: 85, comm: 90, react: 78, learn: 88, stable: 72, sales: 88, m3: 180000, m6: 420000, rec: '建議錄取', role: '業務專員' },
  { id: 'HC002', name: '李四', lang: 70, comm: 65, react: 80, learn: 60, stable: 55, sales: 65, m3: 90000, m6: 200000, rec: '備取', role: '行銷助理' },
  { id: 'HC003', name: '王五', lang: 92, comm: 88, react: 95, learn: 90, stable: 85, sales: 92, m3: 250000, m6: 580000, rec: '強烈建議錄取', role: '業務經理' },
];

export function HiringDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">🎯 招聘智選中心</h2>
          <p className="text-slate-500 mt-1">AI 候選人潛力評估與招募管理</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          <UserPlus className="w-4 h-4" /> 新增候選人
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {candidates.map(c => {
          const totalScore = Math.round((c.lang + c.comm + c.react + c.learn + c.stable + c.sales) / 6);
          return (
            <Card key={c.id}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg">
                    {c.name[0]}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI 綜合評分</p>
                    <span className={cn("text-2xl font-black", totalScore >= 80 ? "text-emerald-600" : totalScore >= 65 ? "text-amber-500" : "text-slate-500")}>
                      {totalScore}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-800">{c.name}</h3>
                <p className="text-xs text-indigo-600 font-medium mb-3">應徵：{c.role}</p>
                <div className="space-y-2 mb-3">
                  {[['語言', c.lang], ['溝通', c.comm], ['反應', c.react], ['學習', c.learn], ['穩定', c.stable], ['成交潛力', c.sales]].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-500">{label as string}</span>
                        <span className="font-semibold text-slate-700">{val as number}</span>
                      </div>
                      <ProgressBar value={val as number} color={(val as number) >= 80 ? 'bg-emerald-400' : (val as number) >= 60 ? 'bg-amber-400' : 'bg-red-400'} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-slate-400">3 個月預測</p>
                    <p className="font-bold text-slate-800">${c.m3.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <p className="text-slate-400">6 個月預測</p>
                    <p className="font-bold text-slate-800">${c.m6.toLocaleString()}</p>
                  </div>
                </div>
                <Badge text={c.rec} color={c.rec.includes('強烈') ? 'emerald' : c.rec === '建議錄取' ? 'green' : 'orange'} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── 訓練管理頁 ───
export function TrainingDashboard({ employees }: { employees: Employee[] }) {
  // 找出弱點：續單率最低的 5 人
  const weak = [...employees]
    .sort((a, b) => (a.renewalRate ?? 0) - (b.renewalRate ?? 0))
    .slice(0, 5);

  const courses = [
    { id: 'c1', title: '高單價談判技巧實戰', duration: '2.5 小時', match: '95%', type: '成交速度' },
    { id: 'c2', title: 'AI 輔助話術進階班', duration: '1 小時', match: '88%', type: '追單訓練' },
    { id: 'c3', title: '抗拒處理與情緒穩定', duration: '1.5 小時', match: '82%', type: '抗拒處理' },
    { id: 'c4', title: '續單收口黃金話術', duration: '2 小時', match: '91%', type: '續單訓練' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🎓 培訓與賦能中心</h2>
        <p className="text-slate-500 mt-1">AI 精準弱點分析與訓練推薦</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 弱點分析 */}
        <Card>
          <CardHeader title="需加強人員（續單能力最低 5 名）" icon={Target} />
          <CardContent className="space-y-3">
            {weak.map(w => (
              <div key={w.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{w.name}</p>
                  <p className="text-xs text-slate-500">續單率 {w.renewalRate ?? 0}%｜戰力 {w.aiScore}</p>
                </div>
                <Badge text={`${w.group}`} color={w.group === 'C' ? 'green' : w.group === 'B' ? 'yellow' : 'orange'} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 推薦課程 */}
        <Card>
          <CardHeader title="AI 推薦訓練課程" icon={BookOpen} />
          <div className="divide-y divide-slate-100">
            {courses.map(c => (
              <div key={c.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <PlayCircle className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{c.title}</h4>
                    <Badge text={`匹配 ${c.match}`} color="emerald" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.type}｜{c.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
