// ==========================================
// AI 行銷建議頁（全員 + 加強底部 5 名）
// ==========================================
import React, { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Target, BookOpen, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, ProgressBar } from './ui';
import { getGroupColor } from '../engine/aiEngine';
import type { MarketingSuggestion } from '../engine/trendEngine';
import type { TrendAnalysis } from '../engine/trendEngine';

interface Props {
  suggestions: MarketingSuggestion[];
  trends: TrendAnalysis[];
}

export default function MarketingAIDashboard({ suggestions, trends }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const total = suggestions.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🎯 AI 行銷建議中心</h2>
        <p className="text-slate-500 mt-1">全員個人化建議 · 壓力 · 激勵 · 改進 · 話術 · 推薦課程</p>
      </div>

      {/* 底部 5 名警示 */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader title="⚠️ 重點加強名單（後 5 名）" className="bg-red-50" />
        <CardContent className="space-y-2">
          {suggestions.slice(-5).map(s => (
            <div key={s.name} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold text-sm">#{s.rank}</span>
                <span className="font-semibold text-slate-800">{s.name}</span>
                <Badge text={s.group} color="red" />
              </div>
              <p className="text-xs text-red-600 max-w-md truncate">{s.improvement}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 全員建議列表 */}
      <div className="space-y-3">
        {suggestions.map((s, idx) => {
          const gc = getGroupColor(s.group);
          const trend = trends.find(t => t.name === s.name);
          const isExpanded = expandedIdx === idx;
          const isBottom5 = s.rank >= total - 4;

          return (
            <Card key={s.name} className={isBottom5 ? 'border-red-200' : ''}>
              {/* 摘要行 */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${gc.bg} text-white flex items-center justify-center text-xs font-bold`}>
                    {s.rank}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="ml-2 text-xs text-slate-500">{trend?.trendLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isBottom5 && <Badge text="重點加強" color="red" />}
                  <Badge text={gc.label} color={s.group === 'A1' ? 'red' : s.group === 'A2' ? 'orange' : s.group === 'B' ? 'yellow' : 'green'} />
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* 展開詳情 */}
              {isExpanded && (
                <CardContent className="border-t border-slate-100 space-y-4">
                  {/* 趨勢 */}
                  {trend && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-2 bg-slate-50 rounded">
                        <p className="text-[10px] text-slate-400">2月總業績</p>
                        <p className="font-bold text-sm">${trend.febRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <p className="text-[10px] text-slate-400">3月累積</p>
                        <p className="font-bold text-sm">${trend.marRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <p className="text-[10px] text-slate-400">2月日均</p>
                        <p className="font-bold text-sm">${trend.febDailyAvg.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <p className="text-[10px] text-slate-400">動能比</p>
                        <p className={`font-bold text-sm ${trend.momentum >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {(trend.momentum * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 四大建議區塊 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-700">AI 建議</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{s.suggestion}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-bold text-red-700">壓力</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{s.pressure}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700">激勵</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{s.motivation}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">改進方向</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{s.improvement}</p>
                    </div>
                  </div>

                  {/* 話術 + 課程 */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-bold text-purple-700">AI 推薦話術</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{s.script}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">AI 推薦課程</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{s.course}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
