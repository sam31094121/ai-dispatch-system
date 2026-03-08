// ==========================================
// 高價成交工具頁：話術/攻單/訓練/喊話
// ==========================================
import React, { useState } from 'react';
import { BookOpen, Users, Clipboard, Copy, Megaphone, Search, Target, Zap } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, ProgressBar } from './ui';
import { scriptLibrary, mockCustomerOpportunities, trainingTemplates, type ScriptTemplate } from '../data/highValueMock';
import type { HighValueProfile } from '../engine/highValueEngine';
import { generateTeamRally } from '../engine/highValueEngine';

// ─── 話術素材頁 ───
export function ScriptLibraryPage() {
  const types = [...new Set(scriptLibrary.map(s => s.type))];
  const [activeType, setActiveType] = useState(types[0]);
  const filtered = scriptLibrary.filter(s => s.type === activeType && s.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">📚 高價話術素材庫</h2>
        <p className="text-slate-500 mt-1">5 大類型 · {scriptLibrary.filter(s => s.enabled).length} 條啟用中</p>
      </div>

      {/* 類型篩選 */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${t === activeType ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* 話術卡片 */}
      <div className="space-y-3">
        {filtered.map(s => (
          <Card key={s.id}>
            <CardContent>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{s.title}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge text={s.clientType} color="purple" />
                    <Badge text={s.scenario} color="blue" />
                    <Badge text={`強度：${s.strength}`} color={s.strength === '高' ? 'red' : s.strength === '中' ? 'orange' : 'green'} />
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mt-2">
                <p className="text-sm text-slate-700 leading-relaxed">「{s.content}」</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── 客戶攻單頁 ───
export function CustomerTargetPage() {
  const opportunities = mockCustomerOpportunities;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🎯 高價客戶攻單名單</h2>
        <p className="text-slate-500 mt-1">今日爆發大單機會客戶 · {opportunities.filter(o => o.isBigDealChance).length} 筆爆發機會</p>
      </div>

      <div className="space-y-3">
        {opportunities.map((o, i) => (
          <Card key={i} className={o.isBigDealChance ? 'border-purple-200' : ''}>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${o.isBigDealChance ? 'bg-purple-600' : 'bg-slate-400'}`}>
                    {o.isBigDealChance ? '💎' : (i + 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{o.clientName}</p>
                    {o.isBigDealChance && <Badge text="爆發大單機會" color="purple" />}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">${o.predictedOrderValue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">預測客單價</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-[10px] text-slate-400">成交機率</p>
                  <p className="font-bold text-emerald-600">{(o.closeProbability * 100).toFixed(0)}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-[10px] text-slate-400">回購機率</p>
                  <p className="font-bold text-blue-600">{(o.repurchaseProbability * 100).toFixed(0)}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-[10px] text-slate-400">最佳對接</p>
                  <p className="font-bold text-purple-600">{o.bestEmployee}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-[10px] text-slate-400">最佳時段</p>
                  <p className="font-bold text-slate-700 text-xs">{o.bestTimeSlot}</p>
                </div>
              </div>

              <div className="mt-3 p-2 bg-indigo-50 rounded border border-indigo-100">
                <p className="text-xs text-indigo-700"><span className="font-bold">主攻建議：</span>{o.suggestion}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── 訓練頁 ───
interface TrainingProps { profiles: HighValueProfile[] }

export function HighValueTrainingPage({ profiles }: TrainingProps) {
  // 找出需要訓練的人（總分 < 60）
  const needTraining = profiles.filter(p => p.totalScore < 60);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🎓 高價成交訓練中心</h2>
        <p className="text-slate-500 mt-1">針對弱點自動生成訓練任務 · {needTraining.length} 人待訓練</p>
      </div>

      {needTraining.length === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="text-center py-8">
            <p className="text-lg font-bold text-emerald-700">全員能力達標 ✅</p>
            <p className="text-sm text-emerald-500">目前無人需要緊急訓練</p>
          </CardContent>
        </Card>
      )}

      {needTraining.map(p => {
        // 找出最弱的兩項
        const weakItems = Object.entries(p.scores).sort((a, b) => a[1] - b[1]).slice(0, 2);
        return (
          <Card key={p.name} className="border-amber-200">
            <CardHeader title={`${p.name}（總分 ${p.totalScore}）`} className="bg-amber-50" />
            <CardContent className="space-y-3">
              {weakItems.map(([key, val]) => {
                const label = key === 'opening' ? '大單開口能力不足' : key === 'closing' ? '收口強度不足' : key === 'courage' ? '高價膽量偏低' : key === 'priceEndure' ? '價格承壓能力不足' : '拒絕處理能力不足';
                const tmpl = trainingTemplates.find(t => t.weaknessType === label) ?? trainingTemplates[0];
                return (
                  <div key={key} className="p-3 bg-white rounded-lg border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge text={label} color="red" />
                        <span className="text-xs text-slate-500">分數：{val}</span>
                      </div>
                      <Badge text="待執行" color="orange" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{tmpl.subject}</p>
                    <p className="text-xs text-slate-600">{tmpl.content}</p>
                    <div className="p-2 bg-amber-50 rounded border border-amber-100">
                      <p className="text-xs text-amber-700">🎭 {tmpl.simulation}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* 全員訓練模板 */}
      <Card>
        <CardHeader title="📋 訓練任務模板庫" icon={Clipboard} />
        <CardContent className="space-y-2">
          {trainingTemplates.map((t, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Badge text={t.weaknessType} color="blue" />
                <Badge text={t.clientType} color="purple" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{t.subject}</p>
              <p className="text-xs text-slate-500 mt-1">{t.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 喊話公告頁 ───
interface RallyProps { profiles: HighValueProfile[] }

export function RallyAnnouncementPage({ profiles }: RallyProps) {
  const [version, setVersion] = useState<'主管版' | '精簡版'>('主管版');
  const [copied, setCopied] = useState(false);
  const rally = generateTeamRally(profiles, version);

  const handleCopy = () => {
    navigator.clipboard.writeText(rally);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📣 高價成交團隊喊話</h2>
          <p className="text-slate-500 mt-1">一鍵生成 · 一鍵複製 · 今日戰力激勵</p>
        </div>
        <button onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm transition-colors">
          <Copy className="w-4 h-4" /> {copied ? '已複製 ✓' : '一鍵複製'}
        </button>
      </div>

      {/* 版本切換 */}
      <div className="flex gap-2">
        {(['主管版', '精簡版'] as const).map(v => (
          <button key={v} onClick={() => setVersion(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${v === version ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* 喊話內容 */}
      <Card className="border-purple-200">
        <CardContent>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{rally}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
