// ==========================================
// 女聲智慧播報系統 - 前端頁面（強化升級版）
// 專業女聲穿透力 + 品質檢查 + 聲音規則面板
// ==========================================
import React, { useState, useMemo } from 'react';
import { Volume2, VolumeX, Play, Square, Copy, Mic, Settings, FileText, Radio, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, MetricCard } from './ui';
import {
  broadcastStyles, generateBroadcastScript, speakText, stopSpeaking,
  getPlaybackSuggestion, VOICE_RULES,
  type BroadcastScript, type BroadcastStyle, type PlaybackScene,
} from '../engine/broadcastEngine';

// ─── 預設播報稿 ───
function getDefaultScripts(): BroadcastScript[] {
  return [
    generateBroadcastScript(
      '📣【AI 派單公告｜3/7 結算 → 3/8 派單順序】\n審計結果：PASS。\n今日三平台整合實收：$2,428,366\n\n1. 王珍珠｜【追單】11｜【續單】157,860｜【總業績】331,930\n2. 王梅慧｜【追單】7｜【續單】121,760｜【總業績】318,320\n3. 馬秋香｜【追單】8｜【續單】184,700｜【總業績】296,500',
      '派單公告', '今日 AI 派單公告', '3/8'
    ),
    generateBroadcastScript(
      '今天不是比誰講得多，今天是比誰敢拿大單。\n全隊 21 人，6 人已具備主攻大單能力。\n今日最強主攻手：王珍珠（總分 96）\n\n規則很簡單：\n遇到高價客戶，價值先講滿，價格後面談。\n報價後不要自己先退，停三秒讓客戶思考。\n收口要穩，不膽怯、不退縮、不虛弱。',
      '主管喊話', '今日高價成交團隊喊話', '3/8'
    ),
    generateBroadcastScript(
      '今日訓練重點：高價收口強化。\n\n話術練習：\n「這不是單純多花錢，而是一次把效果、品質、穩定度直接拉上來。」\n\n模擬情境：\n報完價格後客戶沉默，你必須等待不主動降價。\n練習開口：「真正差距不是差幾千，而是最後效果能不能一次做到位。」',
      '話術訓練', '高價收口強化訓練稿', '3/8'
    ),
  ];
}

// ═══════════════════════════════════════
// 頁面一：女聲播報總控台
// ═══════════════════════════════════════
export function BroadcastCommandCenter() {
  const scripts = useMemo(getDefaultScripts, []);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showTts, setShowTts] = useState<number | null>(null);

  const handlePlay = (script: BroadcastScript) => {
    if (playing === script.id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(script.id);
    speakText(script.ttsContent, script.style, () => setPlaying(null));
  };

  const allChecksPass = scripts.every(s => s.qualityChecks.every(c => c.pass));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🎙️ 女聲播報總控台</h2>
        <p className="text-slate-500 mt-1">專業管理型女聲 · 女性行銷團隊專用 · 穿透力強化版</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="今日播報稿" value={`${scripts.length} 份`} icon={FileText} color="purple" />
        <MetricCard label="聲音定位" value="專業管理型" icon={Mic} color="indigo" />
        <MetricCard label="品質檢查" value={allChecksPass ? 'PASS' : '待修正'} icon={Shield} color={allChecksPass ? 'emerald' : 'red'} />
        <MetricCard label="穿透力" value="已鎖死" icon={Volume2} color="pink" />
      </div>

      {/* 聲音規則快覽 */}
      <Card className="border-purple-200 bg-purple-50/20">
        <CardContent className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-purple-400 font-bold mr-1">鎖死特質：</span>
          {VOICE_RULES.required.map(r => (
            <span key={r} className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">{r}</span>
          ))}
        </CardContent>
      </Card>

      {/* 播報稿列表 */}
      {scripts.map(script => (
        <Card key={script.id} className={playing === script.id ? 'border-purple-400 ring-2 ring-purple-200' : ''}>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{script.title}</p>
                  <Badge text={script.type} color="purple" />
                  <Badge text={script.style.name} color="blue" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  語速 {script.style.rate} · 音調 {script.style.pitch} · 段落停頓 {script.style.pauseMs}ms · 數字停頓 {script.style.numberPauseMs}ms
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePlay(script)}
                  className={`p-2.5 rounded-lg transition-colors ${playing === script.id ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}>
                  {playing === script.id ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => navigator.clipboard.writeText(script.reformattedContent)}
                  className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 重排預覽 */}
            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 max-h-28 overflow-y-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{script.reformattedContent}</pre>
            </div>

            {/* TTS 版展開 */}
            <button onClick={() => setShowTts(showTts === script.id ? null : script.id)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium">
              {showTts === script.id ? '▼ 收起 TTS 朗讀版' : '▶ 查看 TTS 朗讀版（數字轉中文）'}
            </button>
            {showTts === script.id && (
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{script.ttsContent}</pre>
              </div>
            )}

            {/* 品質檢查 */}
            <div className="flex gap-1.5 flex-wrap">
              {script.qualityChecks.map((c, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${c.pass ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {c.pass ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                  {c.item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面二：播報稿管理頁
// ═══════════════════════════════════════
export function BroadcastScriptManager() {
  const scripts = useMemo(getDefaultScripts, []);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const script = scripts[selected];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">📝 播報稿管理</h2>
        <p className="text-slate-500 mt-1">原始 → 重排 → TTS 朗讀版 · 三段對比</p>
      </div>

      <div className="flex gap-2">
        {scripts.map((s, i) => (
          <button key={s.id} onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === selected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s.title}
          </button>
        ))}
      </div>

      {script && (
        <>
          {/* 三段對比 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="📄 原始內容" />
              <CardContent>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{script.originalContent}</pre>
                <button onClick={() => handleCopy(script.originalContent, '原始')}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-700">
                  {copied === '原始' ? '已複製 ✓' : '複製原始版'}
                </button>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader title="🎙️ 重排版" />
              <CardContent>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{script.reformattedContent}</pre>
                <button onClick={() => handleCopy(script.reformattedContent, '重排')}
                  className="mt-2 text-xs text-purple-500 hover:text-purple-700">
                  {copied === '重排' ? '已複製 ✓' : '複製重排版'}
                </button>
              </CardContent>
            </Card>

            <Card className="border-indigo-200">
              <CardHeader title="🔊 TTS 朗讀版" />
              <CardContent>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{script.ttsContent}</pre>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleCopy(script.ttsContent, 'TTS')}
                    className="text-xs text-indigo-500 hover:text-indigo-700">
                    {copied === 'TTS' ? '已複製 ✓' : '複製 TTS 版'}
                  </button>
                  <button onClick={() => speakText(script.ttsContent, script.style)}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
                    <Play className="w-3 h-3" /> 播放
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 風格 + 品質 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-purple-50 rounded"><p className="text-[10px] text-purple-400">語氣</p><p className="text-xs font-bold">{script.style.toneDesc}</p></div>
                <div className="p-2 bg-indigo-50 rounded"><p className="text-[10px] text-indigo-400">節奏</p><p className="text-xs font-bold">{script.style.rhythmDesc}</p></div>
                <div className="p-2 bg-blue-50 rounded"><p className="text-[10px] text-blue-400">聲音</p><p className="text-xs font-bold">{script.style.voiceDesc}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1">
                <p className="text-xs font-bold text-slate-500 mb-2">品質檢查</p>
                {script.qualityChecks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      {c.pass ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                      {c.item}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.note}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面三：播報風格設定頁（含聲音規則面板）
// ═══════════════════════════════════════
export function BroadcastStyleSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">⚙️ 播報風格設定</h2>
        <p className="text-slate-500 mt-1">專業女聲鎖死規則 · 5 種場景風格 · 穿透力參數</p>
      </div>

      {/* 永久鎖死規則 */}
      <Card className="border-purple-300 bg-purple-50/30">
        <CardHeader title="🔒 專業女聲鎖死規則（永久生效）" icon={Shield} className="bg-purple-100" />
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-bold text-purple-700 mb-1">聲音身份定位</p>
            <p className="text-sm text-slate-700">{VOICE_RULES.identity}</p>
            <p className="text-xs text-slate-500 mt-0.5">收聽對象：{VOICE_RULES.target}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 mb-1.5">✅ 必要特質（鎖死）</p>
              <div className="flex flex-wrap gap-1">
                {VOICE_RULES.required.map(r => (
                  <span key={r} className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">{r}</span>
                ))}
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-[10px] font-bold text-red-700 mb-1.5">🚫 禁止風格（鎖死）</p>
              <div className="flex flex-wrap gap-1">
                {VOICE_RULES.forbidden.map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded line-through">{f}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 mb-1.5">🎯 穿透力要求</p>
              <div className="flex flex-wrap gap-1">
                {VOICE_RULES.penetration.map(p => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">{p}</span>
                ))}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 mb-1.5">🗣️ 語氣鎖死</p>
              <div className="flex flex-wrap gap-1">
                {VOICE_RULES.tone.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5 種風格 */}
      {broadcastStyles.map(style => (
        <Card key={style.id}>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{style.name}</p>
                  <Badge text={style.scenario} color="purple" />
                </div>
              </div>
              <Badge text="啟用中" color="green" />
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center mb-3">
              <div className="p-2 bg-slate-50 rounded"><p className="text-[10px] text-slate-400">語速</p><p className="font-bold text-sm">{style.rate}</p></div>
              <div className="p-2 bg-slate-50 rounded"><p className="text-[10px] text-slate-400">音調</p><p className="font-bold text-sm">{style.pitch}</p></div>
              <div className="p-2 bg-slate-50 rounded"><p className="text-[10px] text-slate-400">音量</p><p className="font-bold text-sm">{style.volume}</p></div>
              <div className="p-2 bg-slate-50 rounded"><p className="text-[10px] text-slate-400">段落停頓</p><p className="font-bold text-sm">{style.pauseMs}ms</p></div>
              <div className="p-2 bg-purple-50 rounded"><p className="text-[10px] text-purple-400">數字停頓</p><p className="font-bold text-sm text-purple-700">{style.numberPauseMs}ms</p></div>
              <div className="p-2 bg-indigo-50 rounded"><p className="text-[10px] text-indigo-400">重點強度</p><p className="font-bold text-sm text-indigo-700">{style.emphasisStrength}/3</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-2 bg-purple-50 rounded border border-purple-100">
                <p className="text-[10px] text-purple-500 font-bold">聲音</p>
                <p className="text-xs text-slate-700">{style.voiceDesc}</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded border border-indigo-100">
                <p className="text-[10px] text-indigo-500 font-bold">節奏</p>
                <p className="text-xs text-slate-700">{style.rhythmDesc}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-[10px] text-blue-500 font-bold">語氣</p>
                <p className="text-xs text-slate-700">{style.toneDesc}</p>
              </div>
            </div>

            <button onClick={() => speakText(`這是${style.name}的試聽範例。聲音清楚穩定，有穿透力，段落分明，適合團隊現場收聽。`, style)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs hover:bg-purple-100 transition-colors border border-purple-200">
              <Play className="w-3 h-3" /> 試聽此風格
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面四：播放控制頁
// ═══════════════════════════════════════
export function BroadcastPlaybackControl() {
  const scripts = useMemo(getDefaultScripts, []);
  const [selectedScript, setSelectedScript] = useState(0);
  const [scene, setScene] = useState<PlaybackScene>('會議室');
  const [isPlaying, setIsPlaying] = useState(false);

  const script = scripts[selectedScript];
  const suggestion = script ? getPlaybackSuggestion(script, scene) : null;

  const handlePlay = () => {
    if (!script) return;
    if (isPlaying) { stopSpeaking(); setIsPlaying(false); return; }
    setIsPlaying(true);
    const adjustedStyle = {
      ...script.style,
      rate: scene === '手機播放' ? script.style.rate * 0.9 : script.style.rate,
      volume: scene === '大聲播放' ? 1.0 : scene === '會議室' ? 0.95 : 0.85,
    };
    speakText(script.ttsContent, adjustedStyle, () => setIsPlaying(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🔊 播放控制</h2>
        <p className="text-slate-500 mt-1">場景適配 · 穿透力優化 · 專業女聲即時播放</p>
      </div>

      {/* 稿件選擇 */}
      <div className="flex gap-2 flex-wrap">
        {scripts.map((s, i) => (
          <button key={s.id} onClick={() => setSelectedScript(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === selectedScript ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s.title}
          </button>
        ))}
      </div>

      {/* 場景選擇 */}
      <Card>
        <CardHeader title="📍 播放場景" />
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(['大聲播放', '會議室', '手機播放'] as PlaybackScene[]).map(s => (
              <button key={s} onClick={() => setScene(s)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${s === scene ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-2xl mb-1">{s === '大聲播放' ? '📢' : s === '會議室' ? '🏢' : '📱'}</p>
                <p className="text-sm font-semibold text-slate-800">{s}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 播放建議 */}
      {suggestion && (
        <Card className="border-purple-200">
          <CardHeader title={`🎯 ${suggestion.mode}`} />
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-[10px] text-purple-400">建議音量</p>
                <p className="text-lg font-bold text-purple-700">{suggestion.volume}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-[10px] text-indigo-400">建議語速</p>
                <p className="text-lg font-bold text-indigo-700">{suggestion.speed}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-blue-400">停頓規則</p>
                <p className="text-xs font-bold text-blue-700">{suggestion.pauseRule}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-[10px] text-emerald-400">風格</p>
                <p className="text-xs font-bold text-emerald-700">{script?.style.name}</p>
              </div>
            </div>

            {/* 播放按鈕 */}
            <div className="flex justify-center gap-3 mb-4">
              <button onClick={handlePlay}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
                {isPlaying ? <><Square className="w-5 h-5" /> 停止播放</> : <><Volume2 className="w-5 h-5" /> 開始播放</>}
              </button>
              <button onClick={() => { stopSpeaking(); setIsPlaying(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                <VolumeX className="w-5 h-5" />
              </button>
            </div>

            {/* 場景注意事項 */}
            {suggestion.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 mb-1">⚠️ 場景注意</p>
                {suggestion.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">• {w}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TTS 朗讀版預覽 */}
      {script && (
        <Card>
          <CardHeader title="🔊 TTS 朗讀版預覽（數字已轉中文）" />
          <CardContent>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">{script.ttsContent}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
