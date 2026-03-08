// ==========================================
// 高價成交總控台 + 員工個人頁
// ==========================================
import React, { useState } from 'react';
import { Crown, AlertTriangle, TrendingUp, Target, Shield, Zap } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, MetricCard, ProgressBar } from './ui';
import type { HighValueProfile, HighValueSuggestion, HighValueAlert } from '../engine/highValueEngine';

// ─── 高價成交總控台 ───
interface CommandProps {
  profiles: HighValueProfile[];
  suggestions: HighValueSuggestion[];
  alerts: HighValueAlert[];
  teamRally: string;
}

export function HighValueCommandCenter({ profiles, suggestions, alerts, teamRally }: CommandProps) {
  const bigDealReady = profiles.filter(p => p.canLeadBigDeal);
  const topProfile = profiles[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">💎 高價成交總控台</h2>
        <p className="text-slate-500 mt-1">今日爆發大單機會 · 能力排行 · 異常告警</p>
      </div>

      {/* 頂部指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="可主攻大單" value={`${bigDealReady.length} 人`} icon={Crown} color="purple" />
        <MetricCard label="最強主攻手" value={topProfile?.name ?? '-'} icon={Zap} color="emerald" />
        <MetricCard label="異常告警" value={`${alerts.length} 條`} icon={AlertTriangle} color={alerts.length > 0 ? 'red' : 'emerald'} />
        <MetricCard label="團隊平均分" value={`${Math.round(profiles.reduce((s, p) => s + p.totalScore, 0) / profiles.length)}`} icon={Target} color="indigo" />
      </div>

      {/* 排行榜 */}
      <Card>
        <CardHeader title="🏆 高價成交能力排行" icon={TrendingUp} />
        <div className="divide-y divide-slate-100">
          {profiles.map((p, i) => {
            const levelColor = p.level === '爆發大單主攻手' ? 'text-purple-600 bg-purple-50' : p.level === '高價穩定手' ? 'text-blue-600 bg-blue-50' : p.level === '潛力培養中' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50';
            return (
              <div key={p.name} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-purple-600 text-white' : i < 8 ? 'bg-blue-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${levelColor} font-medium`}>{p.level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">{p.totalScore}</p>
                    <p className="text-[10px] text-slate-400">總分</p>
                  </div>
                  <div className="hidden md:flex gap-1">
                    {Object.entries(p.scores).slice(0, 5).map(([k, v]) => (
                      <div key={k} className={`w-6 h-6 rounded text-[8px] flex items-center justify-center font-bold ${v >= 70 ? 'bg-emerald-100 text-emerald-700' : v >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 異常告警 */}
      {alerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader title="🚨 高價成交異常告警" icon={AlertTriangle} className="bg-red-50" />
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-red-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-red-700">{a.name}</span>
                    <Badge text={a.alertType} color="red" />
                    <Badge text={a.severity} color={a.severity === '高' ? 'red' : 'orange'} />
                  </div>
                  <p className="text-xs text-slate-600">{a.content}</p>
                </div>
                <p className="text-xs text-red-600 font-medium whitespace-nowrap ml-3">{a.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 團隊喊話 */}
      <Card className="border-purple-200 bg-purple-50/20">
        <CardHeader title="📣 今日團隊喊話" icon={Shield} />
        <CardContent>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{teamRally}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 員工高價成交個人頁 ───
interface PersonalProps {
  profiles: HighValueProfile[];
  suggestions: HighValueSuggestion[];
}

const SCORE_LABELS: Record<string, string> = {
  opening: '大單開口', courage: '高價膽量', closing: '收口強度',
  valueExpr: '價值表達', priceEndure: '價格承壓', rejection: '拒絕處理',
  leadDialog: '主導對話', burstPotential: '爆發潛力', bigClient: '大客戶', stability: '穩定度',
};

export function HighValuePersonalPage({ profiles, suggestions }: PersonalProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const profile = profiles[selectedIdx];
  const sugg = suggestions.find(s => s.name === profile?.name);
  if (!profile || !sugg) return null;

  const levelColor = profile.level === '爆發大單主攻手' ? 'bg-purple-100 text-purple-700 border-purple-200' : profile.level === '高價穩定手' ? 'bg-blue-100 text-blue-700 border-blue-200' : profile.level === '潛力培養中' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">💎 {profile.name} 的高價成交分析</h2>
          <p className="text-slate-500 mt-1">今日大單狀態：{sugg.status} ·膽量：{sugg.courageLevel}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border font-bold text-sm ${levelColor}`}>
          {profile.level}
        </div>
      </div>

      {/* 員工切換 */}
      <div className="flex gap-1 flex-wrap">
        {profiles.map((p, i) => (
          <button key={p.name} onClick={() => setSelectedIdx(i)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${i === selectedIdx ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* 10 維能力 */}
      <Card>
        <CardHeader title="🎯 10 維高價成交能力" />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(profile.scores).map(([key, val]) => (
              <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-400 mb-1">{SCORE_LABELS[key] ?? key}</p>
                <p className={`text-xl font-bold ${val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{val}</p>
                <ProgressBar value={val} max={100} color={val >= 70 ? 'emerald' : val >= 40 ? 'amber' : 'red'} />
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">高價成交總分</p>
            <p className="text-4xl font-black text-purple-600">{profile.totalScore}</p>
          </div>
        </CardContent>
      </Card>

      {/* 建議區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-indigo-200">
          <CardContent>
            <p className="text-xs font-bold text-indigo-600 mb-2">💡 今日建議</p>
            <p className="text-sm text-slate-700">{sugg.suggestion}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent>
            <p className="text-xs font-bold text-red-600 mb-2">⚠️ 壓力提醒</p>
            <p className="text-sm text-slate-700">{sugg.pressure}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent>
            <p className="text-xs font-bold text-emerald-600 mb-2">🔥 激勵</p>
            <p className="text-sm text-slate-700">{sugg.motivation}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent>
            <p className="text-xs font-bold text-purple-600 mb-2">🎯 收單要求</p>
            <p className="text-sm text-slate-700">{sugg.closeRequirement}</p>
          </CardContent>
        </Card>
      </div>

      {/* 主攻方向 */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">今日最適合攻的客戶類型</p>
            <p className="text-sm font-semibold text-slate-800">{sugg.bestClientType}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">今日最適合講的高價方向</p>
            <p className="text-sm font-semibold text-slate-800">{sugg.bestPriceDirection}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
