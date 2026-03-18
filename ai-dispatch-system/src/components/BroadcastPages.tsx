// ==========================================
// 女聲智慧播報系統 - 前端頁面（強化升級版）
// 專業女聲穿透力 + 品質檢查 + 聲音規則面板
// ==========================================
import React, { useState, useMemo } from 'react';
import {
  broadcastStyles, generateBroadcastScript, speakText, stopSpeaking,
  getPlaybackSuggestion, VOICE_RULES,
  type BroadcastScript, type BroadcastStyle, type PlaybackScene,
} from '../engine/broadcastEngine';
import { EMPEROR_UI, EMPEROR, HUO, JIN, MU, SHUI, TU } from '../constants/wuxingColors';

// ─── CSS 注入 ───
let _bcInjected = false;
function injectBcStyles() {
  if (_bcInjected || typeof document === 'undefined') return;
  _bcInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes bcScan { 0%{left:-60%} 100%{left:110%} }
    @keyframes bcPop  { 0%{transform:scale(.96);opacity:.6} 100%{transform:scale(1);opacity:1} }
    @keyframes bcPulse{ 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes bcPlay { 0%,100%{box-shadow:0 0 6px ${HUO.glow}66} 50%{box-shadow:0 0 18px ${HUO.glow}cc} }
    .bc-card:hover { border-color:${JIN.shadow}!important; box-shadow:0 4px 20px ${JIN.core}22!important; }
    .bc-btn:hover  { filter:brightness(1.15); }
    .bc-tab-active { background:${JIN.void}!important; color:${JIN.bright}!important; border-color:${JIN.shadow}!important; }
    .bc-tab:hover  { border-color:${JIN.shadow}44!important; }
  `;
  document.head.appendChild(s);
}

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

// ─── 共用樣式 ───
const PAGE: React.CSSProperties = { display:'flex', flexDirection:'column', gap:10, padding:'8px 12px 12px', background:EMPEROR_UI.pageBg, minHeight:'100%' };
const CARD: React.CSSProperties = { background:EMPEROR.obsidian, border:`1px solid ${EMPEROR_UI.borderMain}`, borderRadius:10, padding:'10px 14px', position:'relative', overflow:'hidden', transition:'all .2s' };
const CARD_SCAN: React.CSSProperties = { position:'absolute', top:0, left:0, width:'50%', height:'100%', background:`linear-gradient(90deg,transparent,${JIN.glow}08,transparent)`, animation:'bcScan 4s linear infinite', pointerEvents:'none' };
const BADGE: React.CSSProperties = { display:'inline-block', fontSize:10, padding:'1px 7px', borderRadius:4, fontWeight:700, letterSpacing:'.04em' };
const SECTION_TITLE: React.CSSProperties = { fontSize:15, fontWeight:900, color:EMPEROR_UI.textPrimary, margin:0, letterSpacing:'.04em' };
const SUB: React.CSSProperties = { fontSize:11, color:EMPEROR_UI.textMuted, marginTop:2 };

// ═══════════════════════════════════════
// 頁面一：女聲播報總控台
// ═══════════════════════════════════════
export function BroadcastCommandCenter() {
  injectBcStyles();
  const scripts = useMemo(getDefaultScripts, []);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showTts, setShowTts] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handlePlay = (script: BroadcastScript) => {
    if (playing === script.id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(script.id);
    speakText(script.ttsContent, script.style, () => setPlaying(null));
  };

  const handleCopy = (script: BroadcastScript) => {
    navigator.clipboard.writeText(script.reformattedContent);
    setCopied(script.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const allChecksPass = scripts.every(s => s.qualityChecks.every(c => c.pass));

  const metrics = [
    { label:'今日播報稿', val:`${scripts.length} 份`, p:JIN },
    { label:'聲音定位', val:'專業管理型', p:MU },
    { label:'品質檢查', val:allChecksPass ? '✓ PASS' : '待修正', p:allChecksPass ? TU : HUO },
    { label:'穿透力', val:'🔒 鎖死', p:SHUI },
  ];

  return (
    <div style={PAGE}>
      {/* 頁首 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <div>
          <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🎙️ 女聲播報總控台</h2>
          <p style={SUB}>專業管理型女聲 · 女性行銷團隊專用 · 穿透力強化版</p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background:m.p.abyss, border:`1px solid ${m.p.shadow}`, borderRadius:8, padding:'4px 10px', textAlign:'center', boxShadow:`0 0 8px ${m.p.core}22` }}>
              <div style={{ fontSize:9, color:m.p.text, letterSpacing:'.08em' }}>{m.label}</div>
              <div style={{ fontSize:12, fontWeight:900, color:m.p.bright }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 鎖死特質 */}
      <div style={{ ...CARD, padding:'8px 12px' }}>
        <div style={CARD_SCAN} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
          <span style={{ fontSize:10, color:JIN.text, fontWeight:700, marginRight:4 }}>🔒 鎖死特質：</span>
          {VOICE_RULES.required.map(r => (
            <span key={r} style={{ ...BADGE, background:JIN.abyss, color:JIN.bright, border:`1px solid ${JIN.shadow}` }}>{r}</span>
          ))}
        </div>
      </div>

      {/* 播報稿列表 */}
      {scripts.map(script => {
        const isPlay = playing === script.id;
        return (
          <div key={script.id} className="bc-card" style={{ ...CARD, border:`1px solid ${isPlay ? HUO.bright+'66' : EMPEROR_UI.borderMain}`, boxShadow:isPlay ? `0 0 16px ${HUO.glow}44, 0 0 32px ${HUO.core}22` : 'none', animation:isPlay ? 'bcPlay 1.5s ease-in-out infinite' : 'none' }}>
            <div style={CARD_SCAN} />
            {/* 標題列 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, gap:8 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:900, color:EMPEROR_UI.textPrimary }}>{script.title}</span>
                  <span style={{ ...BADGE, background:JIN.abyss, color:JIN.bright, border:`1px solid ${JIN.shadow}` }}>{script.type}</span>
                  <span style={{ ...BADGE, background:SHUI.abyss, color:SHUI.bright, border:`1px solid ${SHUI.shadow}` }}>{script.style.name}</span>
                </div>
                <div style={{ fontSize:10, color:EMPEROR_UI.textDim, marginTop:2 }}>
                  語速 {script.style.rate} · 音調 {script.style.pitch} · 段落停頓 {script.style.pauseMs}ms · 數字停頓 {script.style.numberPauseMs}ms
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="bc-btn" onClick={() => handlePlay(script)} style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${isPlay ? HUO.shadow : MU.shadow}`, background:isPlay ? HUO.abyss : MU.abyss, color:isPlay ? HUO.bright : MU.bright, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                  {isPlay ? '⏹ 停止' : '▶ 播放'}
                </button>
                <button className="bc-btn" onClick={() => handleCopy(script)} style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${copied === script.id ? TU.shadow : EMPEROR_UI.borderMain}`, background:copied === script.id ? TU.abyss : EMPEROR.obsidianMid, color:copied === script.id ? TU.bright : EMPEROR_UI.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                  {copied === script.id ? '✓ 已複製' : '複製'}
                </button>
              </div>
            </div>

            {/* 重排預覽 */}
            <div style={{ background:EMPEROR.obsidianMid, border:`1px solid ${EMPEROR_UI.borderMain}`, borderRadius:7, padding:'7px 10px', maxHeight:100, overflowY:'auto', marginBottom:6 }}>
              <pre style={{ fontSize:11, color:EMPEROR_UI.textSecondary, whiteSpace:'pre-wrap', fontFamily:'inherit', lineHeight:1.55, margin:0 }}>{script.reformattedContent}</pre>
            </div>

            {/* TTS 展開 */}
            <button className="bc-btn" onClick={() => setShowTts(showTts === script.id ? null : script.id)} style={{ fontSize:10, color:JIN.text, cursor:'pointer', background:'none', border:'none', padding:0, fontWeight:700 }}>
              {showTts === script.id ? '▼ 收起 TTS' : '▶ TTS 朗讀版（數字→中文）'}
            </button>
            {showTts === script.id && (
              <div style={{ background:SHUI.abyss, border:`1px solid ${SHUI.shadow}`, borderRadius:7, padding:'7px 10px', maxHeight:100, overflowY:'auto', marginTop:5 }}>
                <pre style={{ fontSize:11, color:EMPEROR_UI.textSecondary, whiteSpace:'pre-wrap', fontFamily:'inherit', lineHeight:1.55, margin:0 }}>{script.ttsContent}</pre>
              </div>
            )}

            {/* 品質檢查 */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
              {script.qualityChecks.map((c, i) => (
                <span key={i} style={{ ...BADGE, background:c.pass ? TU.abyss : HUO.abyss, color:c.pass ? TU.bright : HUO.bright, border:`1px solid ${c.pass ? TU.shadow : HUO.shadow}` }}>
                  {c.pass ? '✓' : '✗'} {c.item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面二：播報稿管理頁
// ═══════════════════════════════════════
export function BroadcastScriptManager() {
  injectBcStyles();
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
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>📝 播報稿管理</h2>
        <p style={SUB}>原始 → 重排 → TTS 朗讀版 · 三段對比</p>
      </div>

      {/* 稿件切換 */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {scripts.map((s, i) => (
          <button key={s.id} className={i === selected ? 'bc-tab-active' : 'bc-tab'} onClick={() => setSelected(i)} style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidian, color:EMPEROR_UI.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {s.title}
          </button>
        ))}
      </div>

      {script && (
        <>
          {/* 三段對比 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {([
              { label:'📄 原始內容', content:script.originalContent, key:'原始', p:EMPEROR_UI },
              { label:'🎙️ 重排版', content:script.reformattedContent, key:'重排', p:null, border:JIN.shadow },
              { label:'🔊 TTS 朗讀版', content:script.ttsContent, key:'TTS', p:null, border:SHUI.shadow },
            ] as const).map(({ label, content, key, border }) => (
              <div key={key} style={{ ...CARD, border:`1px solid ${border ?? EMPEROR_UI.borderMain}` }}>
                <div style={CARD_SCAN} />
                <div style={{ fontSize:11, fontWeight:700, color:JIN.text, marginBottom:6 }}>{label}</div>
                <pre style={{ fontSize:10, color:EMPEROR_UI.textSecondary, whiteSpace:'pre-wrap', fontFamily:'inherit', lineHeight:1.55, maxHeight:160, overflowY:'auto', margin:0 }}>{content}</pre>
                <button className="bc-btn" onClick={() => handleCopy(content, key)} style={{ marginTop:6, fontSize:10, color:copied===key ? TU.bright : EMPEROR_UI.textDim, background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
                  {copied===key ? '✓ 已複製' : `複製${key}版`}
                </button>
              </div>
            ))}
          </div>

          {/* 風格 + 品質 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={CARD}>
              <div style={CARD_SCAN} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, textAlign:'center' }}>
                {([['語氣',script.style.toneDesc,HUO],['節奏',script.style.rhythmDesc,MU],['聲音',script.style.voiceDesc,JIN]] as const).map(([lbl,val,p]) => (
                  <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:7, padding:'6px 4px' }}>
                    <div style={{ fontSize:9, color:p.text }}>{lbl}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:p.bright, marginTop:2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={CARD}>
              <div style={CARD_SCAN} />
              <div style={{ fontSize:10, color:EMPEROR_UI.textDim, fontWeight:700, marginBottom:5 }}>品質檢查</div>
              {script.qualityChecks.map((c, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, marginBottom:3 }}>
                  <span style={{ color:c.pass ? TU.bright : HUO.bright }}>{c.pass ? '✓' : '✗'} {c.item}</span>
                  <span style={{ color:EMPEROR_UI.textDim, fontSize:9 }}>{c.note}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面三：播報風格設定頁
// ═══════════════════════════════════════
export function BroadcastStyleSettings() {
  injectBcStyles();
  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>⚙️ 播報風格設定</h2>
        <p style={SUB}>專業女聲鎖死規則 · 5 種場景風格 · 穿透力參數</p>
      </div>

      {/* 永久鎖死規則 */}
      <div style={{ ...CARD, border:`1px solid ${JIN.shadow}` }}>
        <div style={CARD_SCAN} />
        <div style={{ fontSize:12, fontWeight:900, color:JIN.bright, marginBottom:8 }}>🔒 專業女聲鎖死規則（永久生效）</div>
        <div style={{ fontSize:11, color:EMPEROR_UI.textSecondary, marginBottom:2 }}>{VOICE_RULES.identity}</div>
        <div style={{ fontSize:10, color:EMPEROR_UI.textDim, marginBottom:8 }}>收聽對象：{VOICE_RULES.target}</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          {([
            { title:'✅ 必要特質（鎖死）', items:VOICE_RULES.required, p:TU },
            { title:'🚫 禁止風格（鎖死）', items:VOICE_RULES.forbidden, p:HUO },
          ] as const).map(({ title, items, p }) => (
            <div key={title} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:8, padding:'7px 10px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:p.bright, marginBottom:5 }}>{title}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {items.map((r: string) => (
                  <span key={r} style={{ ...BADGE, background:p.void, color:p.text, border:`1px solid ${p.shadow}` }}>{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {([
            { title:'🎯 穿透力要求', items:VOICE_RULES.penetration, p:MU },
            { title:'🗣️ 語氣鎖死', items:VOICE_RULES.tone, p:SHUI },
          ] as const).map(({ title, items, p }) => (
            <div key={title} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:8, padding:'7px 10px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:p.bright, marginBottom:5 }}>{title}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {items.map((r: string) => (
                  <span key={r} style={{ ...BADGE, background:p.void, color:p.text, border:`1px solid ${p.shadow}` }}>{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 種風格 */}
      {broadcastStyles.map(style => (
        <div key={style.id} className="bc-card" style={CARD}>
          <div style={CARD_SCAN} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:JIN.abyss, border:`1px solid ${JIN.shadow}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📻</div>
              <div>
                <div style={{ fontSize:13, fontWeight:900, color:EMPEROR_UI.textPrimary }}>{style.name}</div>
                <span style={{ ...BADGE, background:JIN.abyss, color:JIN.text, border:`1px solid ${JIN.shadow}` }}>{style.scenario}</span>
              </div>
            </div>
            <span style={{ ...BADGE, background:TU.abyss, color:TU.bright, border:`1px solid ${TU.shadow}` }}>啟用中</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, textAlign:'center', marginBottom:8 }}>
            {([
              ['語速',`${style.rate}`,SHUI],['音調',`${style.pitch}`,MU],['音量',`${style.volume}`,JIN],
              ['段落停頓',`${style.pauseMs}ms`,TU],['數字停頓',`${style.numberPauseMs}ms`,HUO],['重點強度',`${style.emphasisStrength}/3`,MU],
            ] as const).map(([lbl,val,p]) => (
              <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:6, padding:'5px 2px' }}>
                <div style={{ fontSize:9, color:p.text }}>{lbl}</div>
                <div style={{ fontSize:11, fontWeight:700, color:p.bright, marginTop:1 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 }}>
            {([['聲音',style.voiceDesc,JIN],['節奏',style.rhythmDesc,SHUI],['語氣',style.toneDesc,HUO]] as const).map(([lbl,val,p]) => (
              <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:7, padding:'6px 8px' }}>
                <div style={{ fontSize:9, color:p.text, fontWeight:700 }}>{lbl}</div>
                <div style={{ fontSize:11, color:EMPEROR_UI.textSecondary, marginTop:2 }}>{val}</div>
              </div>
            ))}
          </div>

          <button className="bc-btn" onClick={() => speakText(`這是${style.name}的試聽範例。聲音清楚穩定，有穿透力，段落分明，適合團隊現場收聽。`, style)} style={{ padding:'5px 14px', borderRadius:7, border:`1px solid ${MU.shadow}`, background:MU.abyss, color:MU.bright, fontSize:11, fontWeight:700, cursor:'pointer' }}>
            ▶ 試聽此風格
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面四：播放控制頁
// ═══════════════════════════════════════
export function BroadcastPlaybackControl() {
  injectBcStyles();
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
    const adjustedStyle: BroadcastStyle = {
      ...script.style,
      rate: scene === '手機播放' ? script.style.rate * 0.9 : script.style.rate,
      volume: scene === '大聲播放' ? 1.0 : scene === '會議室' ? 0.95 : 0.85,
    };
    speakText(script.ttsContent, adjustedStyle, () => setIsPlaying(false));
  };

  const SCENES: { label: PlaybackScene; icon: string }[] = [
    { label:'大聲播放', icon:'📢' },
    { label:'會議室', icon:'🏢' },
    { label:'手機播放', icon:'📱' },
  ];

  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🔊 播放控制</h2>
        <p style={SUB}>場景適配 · 穿透力優化 · 專業女聲即時播放</p>
      </div>

      {/* 稿件選擇 */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {scripts.map((s, i) => (
          <button key={s.id} className={i === selectedScript ? 'bc-tab-active' : 'bc-tab'} onClick={() => setSelectedScript(i)} style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidian, color:EMPEROR_UI.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {s.title}
          </button>
        ))}
      </div>

      {/* 場景選擇 */}
      <div style={CARD}>
        <div style={CARD_SCAN} />
        <div style={{ fontSize:11, fontWeight:700, color:EMPEROR_UI.textDim, marginBottom:8 }}>📍 播放場景</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {SCENES.map(sc => (
            <button key={sc.label} className="bc-btn" onClick={() => setScene(sc.label)} style={{ padding:'10px 6px', borderRadius:9, border:`2px solid ${sc.label===scene ? JIN.bright : EMPEROR_UI.borderMain}`, background:sc.label===scene ? JIN.abyss : EMPEROR.obsidianMid, cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
              <div style={{ fontSize:22, marginBottom:3 }}>{sc.icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color:sc.label===scene ? JIN.bright : EMPEROR_UI.textMuted }}>{sc.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 播放建議 */}
      {suggestion && (
        <div style={{ ...CARD, border:`1px solid ${JIN.shadow}` }}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:12, fontWeight:900, color:JIN.bright, marginBottom:8 }}>🎯 {suggestion.mode}</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, textAlign:'center', marginBottom:10 }}>
            {([
              ['建議音量',`${suggestion.volume}`,JIN],
              ['建議語速',`${suggestion.speed}`,MU],
              ['停頓規則',suggestion.pauseRule,SHUI],
              ['風格',script?.style.name??'',TU],
            ] as const).map(([lbl,val,p]) => (
              <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:8, padding:'8px 4px' }}>
                <div style={{ fontSize:9, color:p.text }}>{lbl}</div>
                <div style={{ fontSize:12, fontWeight:700, color:p.bright, marginTop:2 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* 播放按鈕 */}
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:10 }}>
            <button className="bc-btn" onClick={handlePlay} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 18px', borderRadius:8, border:`1px solid ${isPlaying ? HUO.shadow : JIN.shadow}`, background:isPlaying ? HUO.abyss : JIN.abyss, color:isPlaying ? HUO.bright : JIN.bright, fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:isPlaying ? `0 0 16px ${HUO.glow}44` : `0 0 16px ${JIN.glow}44` }}>
              {isPlaying ? '⏹ 停止播放' : '▶ 開始播放'}
            </button>
            <button className="bc-btn" onClick={() => { stopSpeaking(); setIsPlaying(false); }} style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidianMid, color:EMPEROR_UI.textMuted, fontSize:14, cursor:'pointer' }}>
              🔇
            </button>
          </div>

          {/* 場景注意事項 */}
          {suggestion.warnings.length > 0 && (
            <div style={{ background:HUO.abyss, border:`1px solid ${HUO.shadow}`, borderRadius:7, padding:'7px 10px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:HUO.bright, marginBottom:4 }}>⚠️ 場景注意</div>
              {suggestion.warnings.map((w, i) => (
                <div key={i} style={{ fontSize:11, color:EMPEROR_UI.textSecondary }}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TTS 預覽 */}
      {script && (
        <div style={CARD}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:11, fontWeight:700, color:SHUI.text, marginBottom:6 }}>🔊 TTS 朗讀版（數字已轉中文）</div>
          <pre style={{ fontSize:11, color:EMPEROR_UI.textSecondary, whiteSpace:'pre-wrap', fontFamily:'inherit', lineHeight:1.55, maxHeight:160, overflowY:'auto', margin:0 }}>{script.ttsContent}</pre>
        </div>
      )}
    </div>
  );
}
