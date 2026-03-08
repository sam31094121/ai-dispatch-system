// ==========================================
// LINE 群組轉傳系統 - 前端頁面
// 轉換台 + 系統內容直轉 + 一鍵複製
// ==========================================
import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle, MessageCircle, Send, FileText, Zap, Shield, Volume2, Megaphone } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, MetricCard } from './ui';
import { convertToLineFormats, lineScenarios, type LineFormatResult, type LineConvertInput, type LineVersion } from '../engine/lineFormatEngine';

// ─── 預設系統內容（自動帶入各模組輸出） ───
const presetContents: LineConvertInput[] = [
  {
    title: 'AI 派單公告 3/8',
    type: '派單公告',
    rawContent: `📣 AI 派單公告｜3/7 結算 → 3/8 派單順序
審計結果：PASS。
今日三平台整合實收：$2,428,366

1. 王珍珠｜追單 11｜續單 157,860｜總業績 331,930｜實收 331,930
2. 王梅慧｜追單 7｜續單 121,760｜總業績 318,320｜實收 318,320
3. 馬秋香｜追單 8｜續單 184,700｜總業績 296,500｜實收 296,500
4. 林沛昕｜追單 4｜續單 112,960｜總業績 243,340｜實收 243,340
5. 李玲玲｜追單 6｜續單 24,050｜總業績 203,350｜實收 203,350

派單規則：依名次順序派單，不得跳位。
禁止自行更改派單順序。
今日起照表執行。`,
  },
  {
    title: '今日高價成交團隊喊話',
    type: '主管喊話',
    rawContent: `今天不是比誰講得多，今天是比誰敢拿大單。
全隊 21 人，6 人已具備主攻大單能力。
今日最強主攻手：王珍珠（總分 96）

規則很簡單：
遇到高價客戶，價值先講滿，價格後面談。
報價後不要自己先退，停三秒讓客戶思考。
收口要穩，不膽怯、不退縮、不虛弱。

今天誰收到高價客戶，誰就必須執行這三步。
不打折、不降價、不主動讓步。
直接報、穩定講、收口收到底。`,
  },
  {
    title: '高價收口強化訓練通知',
    type: '訓練通知',
    rawContent: `今日訓練重點：高價收口強化。

話術練習：
「這不是單純多花錢，而是一次把效果、品質、穩定度直接拉上來。」

模擬情境：
報完價格後客戶沉默，你必須等待不主動降價。
練習開口：「真正差距不是差幾千，而是最後效果能不能一次做到位。」

訓練時間：今日下午 2:00
訓練地點：會議室 A
全員必須參加，不得請假。`,
  },
];

// ─── 版本 icon 對應 ───
const versionIcons: Record<LineVersion, any> = {
  full: FileText, concise: MessageCircle, ultra: Zap, manager: Shield, broadcast: Volume2,
};

const versionColors: Record<LineVersion, string> = {
  full: 'bg-blue-50 border-blue-200 text-blue-700',
  concise: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  ultra: 'bg-amber-50 border-amber-200 text-amber-700',
  manager: 'bg-red-50 border-red-200 text-red-700',
  broadcast: 'bg-purple-50 border-purple-200 text-purple-700',
};

// ═══════════════════════════════════════
// 頁面一：LINE 轉傳總控台
// ═══════════════════════════════════════
export function LineGroupDashboard() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState('派單公告');
  const [customContent, setCustomContent] = useState('');
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);

  // 決定來源
  const input: LineConvertInput = customMode
    ? { title: customTitle || '自訂公告', type: customType, rawContent: customContent }
    : presetContents[selectedPreset];

  // 自動轉換（只在有內容時）
  const results = useMemo(() => {
    if (!input.rawContent.trim()) return [];
    return convertToLineFormats(input);
  }, [input.rawContent, input.title, input.type]);

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopiedVersion(label);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">💬 LINE 群組轉傳系統</h2>
        <p className="text-slate-500 mt-1">任何內容 → 5 版 LINE 可貼格式 · 直接複製 · 直接轉傳</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="輸出版本" value="5 版" icon={Send} color="emerald" />
        <MetricCard label="結尾鎖死" value="回 +1" icon={CheckCircle} color="purple" />
        <MetricCard label="支援場景" value={`${lineScenarios.length} 種`} icon={Megaphone} color="indigo" />
        <MetricCard label="轉傳規則" value="已鎖死" icon={Shield} color="pink" />
      </div>

      {/* 來源切換 */}
      <Card>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setCustomMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!customMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              📦 系統內容直轉
            </button>
            <button onClick={() => setCustomMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${customMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              ✏️ 自訂內容輸入
            </button>
          </div>

          {!customMode ? (
            <div className="flex gap-2 flex-wrap">
              {presetContents.map((p, i) => (
                <button key={i} onClick={() => setSelectedPreset(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === selectedPreset ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                  placeholder="標題（例：今日派單公告）"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <select value={customType} onChange={e => setCustomType(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {lineScenarios.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea value={customContent} onChange={e => setCustomContent(e.target.value)}
                placeholder="貼上任何系統輸出的內容，系統會自動轉成 5 版 LINE 可貼格式..."
                rows={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5 版輸出 */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-700">📤 自動輸出 5 版（直接複製貼群）</h3>
          {results.map(r => {
            const Icon = versionIcons[r.version];
            const colorCls = versionColors[r.version];
            const isCopied = copiedVersion === r.label;
            return (
              <Card key={r.version} className={`border ${colorCls.split(' ')[1]}`}>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorCls.split(' ')[0]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{r.label}</p>
                        <p className="text-[10px] text-slate-400">{r.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => handleCopy(r.content, r.label)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                      {isCopied ? <><CheckCircle className="w-3.5 h-3.5" /> 已複製</> : <><Copy className="w-3.5 h-3.5" /> 複製</>}
                    </button>
                  </div>

                  {/* 內容預覽 */}
                  <div className={`p-3 rounded-lg border ${colorCls} max-h-48 overflow-y-auto`}>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
                  </div>

                  {/* 字數 */}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{r.content.length} 字</span>
                    <span className="text-[10px] text-slate-400">{r.content.split('\n').length} 行</span>
                    <span className="text-[10px] text-emerald-500">✓ 結尾已鎖死「+1」</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面二：LINE 轉傳規則與範本
// ═══════════════════════════════════════
export function LineGroupRules() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">📖 LINE 轉傳規則</h2>
        <p className="text-slate-500 mt-1">格式鎖死規則 · 5 版範本 · 結尾標準</p>
      </div>

      {/* 鎖死規則 */}
      <Card className="border-emerald-200 bg-emerald-50/20">
        <CardHeader title="🔒 LINE 群組轉傳鎖死規則（永久生效）" icon={Shield} className="bg-emerald-100" />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 mb-1.5">✅ 必要規則</p>
              <div className="space-y-0.5">
                {['分段清楚', '標題獨立', '重點前置', '數字清楚', '名單分行', '執行規則獨立', '適合主管轉傳', '適合群組閱讀', '語氣專業', '結尾有執行感'].map(r => (
                  <p key={r} className="text-xs text-slate-600">✓ {r}</p>
                ))}
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-[10px] font-bold text-red-700 mb-1.5">🚫 禁止問題</p>
              <div className="space-y-0.5">
                {['大段不分行', '文字一整坨', '重點埋在中間', '數字不清楚', '段落太亂', '看完不知做什麼', '沒有執行感', '語氣太空泛', '內容像作文', '不能直接轉傳'].map(f => (
                  <p key={f} className="text-xs text-slate-600 line-through text-red-400">✗ {f}</p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5 版說明 */}
      <Card>
        <CardHeader title="📤 5 版輸出說明" />
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: '📋', name: '完整版', use: '完整公告、主管正式轉傳、公司群組正式公告' },
              { icon: '💬', name: '群組精簡版', use: 'LINE 群組快速閱讀、保留重點、縮短篇幅' },
              { icon: '⚡', name: '超短版', use: '20 秒內看完、快速通知、快速執行' },
              { icon: '👊', name: '主管威壓版', use: '主管轉傳、加強執行力、加強壓力感' },
              { icon: '🎙️', name: '朗讀播放版', use: '直接大聲播放、直接開會唸、直接女聲播報' },
            ].map(v => (
              <div key={v.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-xl">{v.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{v.name}</p>
                  <p className="text-xs text-slate-500">{v.use}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 結尾固定格式 */}
      <Card className="border-purple-200">
        <CardHeader title="🔒 結尾鎖死格式" />
        <CardContent className="space-y-2">
          {[
            '以上為今日統一執行內容，請全員確認。\n看完請回 +1。',
            '今天照此執行。\n看完請回 +1。',
            '看完請回 +1。',
            '今日起照表執行，不得跳位，不得自行更改。\n看完請回 +1。',
            '以上為今日正式執行內容。\n請全員確認。\n看完請回，加一。',
          ].map((e, i) => (
            <div key={i} className="p-2 bg-purple-50 rounded border border-purple-100">
              <pre className="text-xs text-purple-700 whitespace-pre-wrap font-sans">{e}</pre>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* LINE 內容結構 */}
      <Card>
        <CardHeader title="📐 LINE 群組內容結構" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">完整版結構</p>
              <div className="space-y-1">
                {['標題', '一句結論', '重點數據', '名單/順序', '執行規則', '提醒事項', '結尾確認'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-xs text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">超短版結構</p>
              <div className="space-y-1">
                {['標題', '一句結論', '執行重點（3條）', '結尾提醒'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-xs text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
