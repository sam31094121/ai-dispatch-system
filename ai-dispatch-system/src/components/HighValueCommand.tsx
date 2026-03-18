// ==========================================
// 高價成交總控台 + 員工個人頁
// 帝王配色 · 全 inline style · 3D立體空間
// ==========================================
import React, { useState } from 'react';
import type { HighValueProfile, HighValueSuggestion, HighValueAlert } from '../engine/highValueEngine';
import { EMPEROR_UI, MU, HUO, SHUI, TU, JIN, EMPEROR } from '../constants/wuxingColors';

// ── 維度縮寫（排行榜5格）──
const SCORE_SHORT: Record<string, string> = {
  opening: '開口', courage: '膽量', closing: '收口', valueExpr: '價值', priceEndure: '承壓',
  rejection: '拒絕', leadDialog: '主導', burstPotential: '爆發', bigClient: '大客', stability: '穩定',
};


// 維度功能描述 — 讓每個字有意境
const SCORE_DESC: Record<string, string> = {
  opening:       '敢開大單',
  courage:       '不退不縮',
  closing:       '穩住收口',
  valueExpr:     '講透價值',
  priceEndure:   '扛住價格',
  rejection:     '化解拒絕',
  leadDialog:    '掌控節奏',
  burstPotential:'爆發動能',
  bigClient:     '大客掌控',
  stability:     '戰力穩定',
};

// 維度對應五行色系
const SCORE_PALETTE: Record<string, typeof MU> = {
  opening:       HUO,
  courage:       HUO,
  closing:       JIN,
  valueExpr:     TU,
  priceEndure:   SHUI,
  rejection:     MU,
  leadDialog:    TU,
  burstPotential:HUO,
  bigClient:     JIN,
  stability:     MU,
};

// 等級配色
function levelStyle(level: string) {
  if (level === '爆發大單主攻手') return { bg: '#2d0a3f', color: '#c084fc', border: '#7e22ce55', glow: '#c084fc' };
  if (level === '高價穩定手')    return { bg: '#0a1a2e', color: '#60a5fa', border: '#1d4ed855', glow: '#60a5fa' };
  if (level === '潛力培養中')    return { bg: '#1a1200', color: '#fbbf24', border: '#92400e55', glow: '#fbbf24' };
  return { bg: '#111', color: '#94a3b8', border: '#33333355', glow: '#94a3b8' };
}

// ── CSS 注入（只注入一次）──
let _injected = false;
function injectStyles() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes hv3dFloat {
      0%,100%{transform:perspective(600px) translateZ(0) rotateX(0deg)}
      50%{transform:perspective(600px) translateZ(6px) rotateX(0.8deg)}
    }
    @keyframes hvScanH {
      0%{transform:translateX(-100%)} 100%{transform:translateX(300%)}
    }
    @keyframes hvPulseRed {
      0%,100%{box-shadow:0 0 6px #ef444433,inset 0 0 6px transparent}
      50%{box-shadow:0 0 18px #ef4444aa,inset 0 0 8px #ef444411}
    }
    @keyframes hvScoreIn {
      from{opacity:0;transform:translateY(8px) scale(0.85)} to{opacity:1;transform:translateY(0) scale(1)}
    }
    @keyframes hvRowSlide {
      from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)}
    }
    @keyframes hvGlowPulse {
      0%,100%{filter:drop-shadow(0 0 3px currentColor)}
      50%{filter:drop-shadow(0 0 9px currentColor) drop-shadow(0 0 16px currentColor)}
    }
    @keyframes hvBarFill {
      from{width:0} to{width:var(--bar-w)}
    }
    @keyframes hvTopCard {
      0%,100%{box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)}
      50%{box-shadow:0 4px 24px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.07)}
    }
    @keyframes hvRankGlow {
      0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 8px 2px #c084fc55}
    }
    @keyframes hvBarPop {
      0%{width:0;opacity:.6} 80%{opacity:1} 100%{width:var(--bar-w)}
    }
    @keyframes hvPctCount {
      from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)}
    }
    @keyframes hvLevelBeat {
      0%,100%{transform:scale(1)} 50%{transform:scale(1.03)}
    }
    @keyframes hvShimmer {
      0%{background-position:200% center}
      100%{background-position:-200% center}
    }
    .hv-row:hover {
      background: linear-gradient(90deg, rgba(192,132,252,0.04), rgba(96,165,250,0.03), rgba(192,132,252,0.02)) !important;
      transform: translateX(3px);
      box-shadow: inset 3px 0 0 rgba(192,132,252,0.25);
    }
    .hv-row { transition: background 0.18s, transform 0.18s, box-shadow 0.18s; }
    .hv-score-cell:hover {
      transform: perspective(200px) translateZ(8px) scale(1.15);
      z-index: 2;
      box-shadow: 0 6px 20px rgba(0,0,0,.7), 0 0 12px rgba(192,132,252,0.2) !important;
    }
    .hv-score-cell { transition: transform 0.18s, box-shadow 0.18s; position: relative; }
    .hv-alert-high { animation: hvPulseRed 1.8s ease-in-out infinite; }
    .hv-top1 { animation: hvRankGlow 2.5s ease-in-out infinite; }
    .hv-ability-cell:hover {
      transform: perspective(300px) translateZ(10px) scale(1.04);
      z-index: 2;
      box-shadow: 0 8px 24px rgba(0,0,0,.6) !important;
    }
    .hv-ability-cell { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }

    /* 行背景：按排名分層 */
    .hv-row-top1  { background: linear-gradient(90deg, rgba(126,34,206,0.12) 0%, rgba(45,10,63,0.18) 40%, rgba(3,5,12,0.0) 100%) !important; border-left: 2px solid rgba(192,132,252,0.4) !important; }
    .hv-row-top3  { background: linear-gradient(90deg, rgba(96,165,250,0.06) 0%, rgba(29,78,216,0.08) 40%, rgba(3,5,12,0.0) 100%) !important; border-left: 2px solid rgba(96,165,250,0.2) !important; }
    .hv-row-top8  { background: linear-gradient(90deg, rgba(20,83,45,0.07) 0%, rgba(6,78,59,0.05) 40%, transparent 100%) !important; border-left: 2px solid rgba(34,197,94,0.12) !important; }
    .hv-row-rest  { background: linear-gradient(90deg, rgba(15,23,42,0.5) 0%, rgba(8,12,28,0.3) 60%, transparent 100%) !important; border-left: 1px solid rgba(255,255,255,0.03) !important; }
  `;
  document.head.appendChild(s);
}

// ─── 總控台 ───
interface CommandProps {
  profiles: HighValueProfile[];
  suggestions: HighValueSuggestion[];
  alerts: HighValueAlert[];
  teamRally: string;
}

export function HighValueCommandCenter({ profiles, alerts, teamRally }: CommandProps) {
  injectStyles();
  const [sortField, setSortField] = useState<string>('totalScore');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const bigDealCount = profiles.filter(p => p.canLeadBigDeal).length;
  const topProfile = profiles[0];
  const avgScore = Math.round(profiles.reduce((s, p) => s + p.totalScore, 0) / profiles.length);
  const scoreKeys = Object.keys(profiles[0]?.scores ?? {}).slice(0, 5);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    let valA = sortField === 'totalScore' ? a.totalScore : (a.scores as any)[sortField] || 0;
    let valB = sortField === 'totalScore' ? b.totalScore : (b.scores as any)[sortField] || 0;
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  return (
    <div style={{
      background: 'radial-gradient(ellipse 80% 60% at 20% 10%, #0d0520 0%, #060212 35%, #020308 60%, #000508 100%)',
      height: '100vh', width: '100%',
      display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden',
      fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
      boxShadow: 'inset 0 0 120px rgba(0,0,0,0.9), inset 0 0 60px rgba(126,34,206,0.04)',
    }}>

      {/* 🔮 左側：戰術儀表板 (獨立滾動) */}
      <div style={{
        background: 'linear-gradient(160deg, rgba(22,8,38,0.95) 0%, rgba(10,5,20,0.88) 30%, rgba(4,8,18,0.92) 65%, rgba(2,6,14,0.97) 100%)',
        padding: '12px', overflowY: 'auto',
        borderRight: '1px solid rgba(192,132,252,0.10)',
        boxShadow: 'inset -1px 0 20px rgba(126,34,206,0.06), 2px 0 0 rgba(192,132,252,0.04)',
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        
        {/* ══ 頁首欄 ══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'linear-gradient(135deg, #2a0d42 0%, #1a0929 40%, #0a0418 80%, #060210 100%)',
          borderRadius: 8,
          border: '1px solid rgba(192,132,252,0.18)',
          borderTop: '1px solid rgba(192,132,252,0.28)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.7), 0 1px 0 rgba(192,132,252,0.12), inset 0 1px 0 rgba(192,132,252,0.08)',
          animation: 'hv3dFloat 4s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px #c084fc)', animation: 'hvGlowPulse 3s ease-in-out infinite' }}>💎</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#c084fc', letterSpacing: '0.04em', lineHeight: 1.1, textShadow: '0 0 10px rgba(192,132,252,0.6)' }}>高價總控台</div>
              <div style={{ fontSize: 8, color: '#9d4ecf66', marginTop: 1 }}>能力排行 · 告警</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: MU.bright, boxShadow: `0 0 4px ${MU.bright}`, animation: 'hvGlowPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, color: MU.bright, fontWeight: 800 }}>LIVE</span>
          </div>
        </div>

        {/* ══ 4 指標卡 (2x2) ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: '可攻大單', val: `${bigDealCount}`, unit: '人', color: '#c084fc', bg: 'linear-gradient(135deg,#2d0a3f 0%,#1a0529 50%,#0a0218 100%)', border: 'rgba(192,132,252,0.22)', pct: bigDealCount/profiles.length },
            { label: '核心主攻', val: topProfile?.name ?? '-', unit: '', color: MU.bright, bg: `linear-gradient(135deg,${MU.abyss} 0%,#050e06 60%,#020a04 100%)`, border: `${MU.shadow}bb`, pct: (topProfile?.totalScore ?? 0)/100 },
            { label: '異常告警', val: `${alerts.length}`, unit: '條', color: alerts.length > 0 ? '#f87171' : MU.bright, bg: alerts.length > 0 ? 'linear-gradient(135deg,#2d0000 0%,#1a0000 50%,#080000 100%)' : `linear-gradient(135deg,${MU.abyss},#020a04)`, border: alerts.length > 0 ? 'rgba(239,68,68,0.28)' : `${MU.shadow}bb`, pct: alerts.length > 0 ? Math.min(alerts.length/10, 1) : 0 },
            { label: '團隊均分', val: `${avgScore}`, unit: '', color: SHUI.bright, bg: `linear-gradient(135deg,${SHUI.abyss} 0%,#020812 60%,#010508 100%)`, border: `${SHUI.shadow}bb`, pct: avgScore/100 },
          ].map(m => (
            <div key={m.label} style={{
              background: m.bg,
              border: `1px solid ${m.border}`,
              borderTop: `1px solid ${m.border.replace('0.22','0.35').replace('bb','dd')}`,
              borderRadius: 7, padding: '7px',
              boxShadow: `0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(0,0,0,0.3)`,
            }}>
              <div style={{ fontSize: 8, color: EMPEROR_UI.textDim, letterSpacing: '0.05em', marginBottom: 2 }}>{m.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:1, lineHeight:1.1 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: m.color, textShadow: `0 0 8px ${m.color}55` }}>{m.val}</span>
                {m.unit && <span style={{ fontSize:8, color:`${m.color}88`, fontWeight:700 }}>{m.unit}</span>}
              </div>
              <div style={{ height:2, borderRadius:2, background:'rgba(255,255,255,.04)', overflow:'hidden', margin:'3px 0 2px' }}>
                <div style={{ height:'100%', borderRadius:2, background:`linear-gradient(90deg,${m.color}55,${m.color})`, width:`${Math.round((m.pct??0)*100)}%`, boxShadow:`0 0 4px ${m.color}44`, transition:'width .6s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* ══ 異常告警 ══ */}
        {alerts.length > 0 && (
          <div style={{ background: 'linear-gradient(160deg,#150000,#0a0000,#050000)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(239,68,68,0.08)' }}>
            <div style={{ padding: '6px 10px', background: 'linear-gradient(135deg,#2a0000,#1c0000,#0a0000)', borderBottom: '1px solid rgba(239,68,68,0.14)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: '#f87171' }}>
              <span>🚨</span> 高價異常告警 ({alerts.length})
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '200px', overflowY: 'auto' }}>
              {alerts.map((a, i) => (
                <div key={i} className={a.severity === '高' ? 'hv-alert-high' : ''} style={{ padding: '5px 8px', borderRadius: 5, background: a.severity === '高' ? '#1c0000' : '#140800', border: `1px solid ${a.severity === '高' ? '#ef444422' : '#92400e22'}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#fca5a5' }}>{a.name}</span>
                      <span style={{ fontSize: 6, padding: '0px 3px', borderRadius: 2, background: '#2d0000', color: '#f87171', border: '1px solid #ef444422' }}>{a.alertType}</span>
                    </div>
                    <div style={{ fontSize: 8, color: '#fca5a544', lineHeight: 1.3 }}>{a.content}</div>
                  </div>
                  <div style={{ fontSize: 7, color: '#f87171', fontWeight: 800, background: '#2d0000', padding: '2px 5px', borderRadius: 3, border: '1px solid #ef444422', whiteSpace: 'nowrap' }}>{a.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ 團隊喊話 ══ */}
        {teamRally && (
          <div style={{ background: 'linear-gradient(160deg,#0e0618,#08050c,#040210)', border: '1px solid rgba(126,34,206,0.14)', borderRadius: 8, overflow: 'hidden', marginTop: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(192,132,252,0.06)' }}>
            <div style={{ padding: '6px 10px', background: 'linear-gradient(135deg,#1e0832,#11041c,#08050c)', borderBottom: '1px solid rgba(126,34,206,0.18)', fontSize: 9, fontWeight: 900, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📣</span> 團隊喊話
            </div>
            <div style={{ padding: '8px' }}>
              <pre style={{ fontSize: 9, color: '#c0b8d4', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, fontFamily: 'inherit' }}>{teamRally}</pre>
            </div>
          </div>
        )}

      </div>

      {/* 📊 右側：戰力大盤排行榜 */}
      <div style={{
        padding: '12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: 'radial-gradient(ellipse 100% 80% at 60% 10%, rgba(15,5,30,0.6) 0%, transparent 70%)',
      }}>
        
        {/* 表頭 (固定在頂端) */}
        <div style={{
          padding: '8px 12px',
          background: 'linear-gradient(90deg, #1e0838 0%, #110824 30%, #07051a 65%, #03040e 100%)',
          borderBottom: '2px solid rgba(192,132,252,0.18)',
          borderTop: '1px solid rgba(192,132,252,0.12)',
          display: 'grid', gridTemplateColumns: `36px 1fr 64px ${scoreKeys.map(() => '42px').join(' ')}`,
          gap: 6, alignItems: 'center',
          fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(192,132,252,0.10)',
        }}>
          <span style={{ color: EMPEROR_UI.textDim, cursor: 'pointer' }} onClick={() => handleSort('totalScore')}>名次</span>
          <span style={{ color: '#c084fc' }}>🏆 姓名 · 戰力等級</span>
          <div 
            style={{ color: '#00e5ff', textAlign: 'center', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            onClick={() => handleSort('totalScore')}
          >
            總分 {sortField === 'totalScore' && (sortOrder === 'desc' ? '▼' : '▲')}
          </div>
          {scoreKeys.map(k => (
            <div 
              key={k} 
              style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s' }}
              className="glow-text-btn"
              onClick={() => handleSort(k)}
            >
              <div style={{ color: SCORE_PALETTE[k]?.bright ?? EMPEROR_UI.textDim, fontSize: 9, fontWeight: 900 }}>
                {SCORE_SHORT[k] ?? k} {sortField === k && (sortOrder === 'desc' ? '▼' : '▲')}
              </div>
              <div style={{ color: EMPEROR_UI.textDim, fontSize: 7, marginTop: 1 }}>{SCORE_DESC[k]?.slice(0, 3)}</div>
            </div>
          ))}
        </div>

        {/* 員工列表 (獨立滾動) */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {sortedProfiles.map((p, index) => {
            const ls = levelStyle(p.level);
            const scores5 = scoreKeys.map(k => (p.scores as Record<string, number>)[k] ?? 0);
            const isTop = p.name === topProfile?.name;
            const scoreColor = index < 3 ? '#00e5ff' : index < 8 ? SHUI.bright : EMPEROR_UI.textDim;
            const rankIndex = profiles.findIndex(op => op.name === p.name) + 1; // 原名次

            const rowClass = rankIndex === 1 ? 'hv-row-top1' : rankIndex <= 3 ? 'hv-row-top3' : rankIndex <= 8 ? 'hv-row-top8' : 'hv-row-rest';

            return (
              <div
                key={p.name}
                className={`hv-row ${rowClass}${isTop ? ' hv-top1' : ''}`}
                style={{
                  padding: '7px 12px',
                  display: 'grid', gridTemplateColumns: `36px 1fr 64px ${scoreKeys.map(() => '42px').join(' ')}`,
                  gap: 6, alignItems: 'center',
                  borderBottom: `1px solid rgba(255,255,255,0.025)`,
                  animation: `hvRowSlide 0.25s ease-out ${index * 0.015}s both`,
                }}
              >
                {/* 名次 */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900,
                  background: rankIndex === 1 ? 'linear-gradient(135deg,#4c1d95,#7e22ce)' : rankIndex <= 3 ? '#2d0a3f' : rankIndex <= 8 ? SHUI.abyss : '#1a1b26',
                  border: `1.5px solid ${rankIndex === 1 ? '#c084fc' : rankIndex <= 3 ? '#7e22ceaa' : rankIndex <= 8 ? SHUI.shadow : '#2f3147'}`,
                  color: rankIndex <= 3 ? '#fff' : rankIndex <= 8 ? SHUI.bright : '#94a3b8',
                  boxShadow: rankIndex === 1 ? '0 0 8px #c084fc66' : 'none',
                  flexShrink: 0,
                }}>{rankIndex}</div>

                {/* 姓名 + 等級 */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textShadow: isTop ? '0 0 8px #c084fc66' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 1, fontSize: 7, padding: '1px 4px', borderRadius: 3, background: ls.bg, color: ls.color, border: `1px solid ${ls.border}`, fontWeight: 700 }}>
                    {p.level}
                  </span>
                </div>

                {/* 總分 📊 股票條 */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: scoreColor, fontFamily: 'Orbitron', textShadow: index < 3 ? `0 0 8px ${scoreColor}88` : 'none' }}>
                    {p.totalScore}
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden', margin: '2px 0 1px' }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg, ${ls.glow}88, ${scoreColor})`, width: `${p.totalScore}%`, transition: 'width .6s ease' }} />
                  </div>
                </div>

                {/* 5格分數 */}
                {scores5.map((v, j) => {
                  const p2 = SCORE_PALETTE[scoreKeys[j]] ?? MU;
                  const vc = v >= 80 ? p2.bright : v >= 60 ? TU.bright : v >= 40 ? HUO.bright : '#f87171';
                  const cellBg = v >= 80
                    ? `linear-gradient(160deg, ${p2.abyss} 0%, #08040f 60%, #020106 100%)`
                    : v >= 65
                    ? `linear-gradient(160deg, rgba(10,14,26,0.9) 0%, rgba(5,8,18,0.95) 100%)`
                    : v >= 45
                    ? `linear-gradient(160deg, rgba(18,8,4,0.8) 0%, rgba(10,5,2,0.9) 100%)`
                    : `linear-gradient(160deg, rgba(22,4,4,0.75) 0%, rgba(12,2,2,0.9) 100%)`;
                  const cellBorder = v >= 80
                    ? p2.shadow
                    : v >= 65 ? 'rgba(96,165,250,0.10)' : v >= 45 ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.14)';
                  return (
                    <div key={j} className="hv-score-cell" style={{
                      borderRadius: 5, padding: '3px 2px',
                      background: cellBg,
                      border: `1px solid ${cellBorder}`,
                      boxShadow: v >= 80 ? `inset 0 1px 0 ${p2.bright}14, 0 2px 6px rgba(0,0,0,0.4)` : '0 1px 4px rgba(0,0,0,0.3)',
                      textAlign: 'center', position: 'relative'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: vc, fontFamily: 'Orbitron', textShadow: v >= 80 ? `0 0 4px ${vc}66` : 'none' }}>{v}</div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2, margin: '2px 3px 0' }}>
                        <div style={{ height: '100%', background: vc, width: `${v}%`, transition: 'width .5s ease' }} />
                      </div>
                    </div>
                  );
                })}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}


// ─── 員工個人頁 ───
interface PersonalProps {
  profiles: HighValueProfile[];
  suggestions: HighValueSuggestion[];
}

export function HighValuePersonalPage({ profiles, suggestions }: PersonalProps) {
  injectStyles();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const profile = profiles[selectedIdx];
  const sugg = suggestions.find(s => s.name === profile?.name);
  if (!profile || !sugg) return null;

  const ls = levelStyle(profile.level);
  const scoreEntries = Object.entries(profile.scores) as [string, number][];
  const pct = (v: number) => Math.round(v);

  // 分成兩組：核心5維 + 隱性5維
  const core5 = scoreEntries.slice(0, 5);
  const hidden5 = scoreEntries.slice(5, 10);

  return (
    <div style={{
      background: EMPEROR_UI.pageBg, minHeight: '100vh',
      padding: '10px 12px 18px',
      fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
    }}>

      {/* ── 頁首：姓名 + 等級 + 大單狀態 ── */}
      <div style={{
        padding: '10px 14px', borderRadius: 12, marginBottom: 8,
        background: 'linear-gradient(135deg,#1a0929,#0d0814)',
        border: '1px solid #7e22ce44',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        animation: 'hv3dFloat 4s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, animation: 'hvGlowPulse 3s ease-in-out infinite' }}>💎</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#c084fc', lineHeight: 1.1, textShadow: '0 0 12px #c084fc88' }}>
              {profile.name}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: EMPEROR_UI.textDim }}>
                狀態：<span style={{ color: SHUI.bright, fontWeight: 800 }}>{sugg.status}</span>
              </span>
              <span style={{ fontSize: 9, color: EMPEROR_UI.textDim }}>
                膽量：<span style={{ color: HUO.bright, fontWeight: 800 }}>{sugg.courageLevel}</span>
              </span>
            </div>
          </div>
        </div>
        {/* 等級徽章 + 總分 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: EMPEROR_UI.textDim, letterSpacing: '.1em', marginBottom: 1 }}>OVERALL SCORE</div>
            <div style={{
              fontSize: 32, fontWeight: 900, lineHeight: 1, color: '#c084fc',
              textShadow: '0 0 18px #c084fc88, 0 0 36px #c084fc44',
              animation: 'hvLevelBeat 3s ease-in-out infinite',
            }}>{profile.totalScore}</div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 8,
            background: ls.bg, color: ls.color, border: `1px solid ${ls.border}`,
            fontSize: 10, fontWeight: 900, letterSpacing: '0.04em',
            boxShadow: `0 0 10px ${ls.glow}44`,
            textAlign: 'center',
          }}>
            <div>戰力核定</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{profile.level}</div>
          </div>
        </div>
      </div>

      {/* ── 員工切換（緊湊 pill 列）── */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {profiles.map((p, i) => {
          const pls = levelStyle(p.level);
          const isActive = i === selectedIdx;
          return (
            <button key={p.name} onClick={() => setSelectedIdx(i)} style={{
              padding: '3px 10px', borderRadius: 5,
              background: isActive ? pls.bg : 'transparent',
              color: isActive ? pls.color : EMPEROR_UI.textDim,
              border: `1px solid ${isActive ? pls.border : EMPEROR_UI.borderMain + '44'}`,
              fontSize: 11, fontWeight: isActive ? 900 : 600,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: isActive ? `0 0 6px ${pls.glow}33` : 'none',
            }}>{p.name}</button>
          );
        })}
      </div>

      {/* ── 核心5維：戰力六角儀表 ── */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: '1px solid #7e22ce33',
        borderRadius: 10, marginBottom: 8, overflow: 'hidden',
      }}>
        {/* 區塊標題 */}
        <div style={{
          padding: '7px 14px',
          background: 'linear-gradient(135deg,#2d0a3f,#0d0814)',
          borderBottom: '1px solid #7e22ce22',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#c084fc', letterSpacing: '0.08em' }}>⚔️ 核心戰力 — 5 大成交維度</span>
          <span style={{ fontSize: 9, color: EMPEROR_UI.textDim }}>點格查看意境</span>
        </div>

        {/* 5格橫向：全寬佔滿 */}
        <div style={{
          padding: '8px 8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 6,
        }}>
          {core5.map(([key, val]) => {
            const p2 = SCORE_PALETTE[key] ?? MU;
            const c = val >= 80 ? p2.bright : val >= 60 ? TU.bright : val >= 40 ? HUO.bright : '#f87171';
            const pctVal = pct(val);
            return (
              <div key={key} className="hv-ability-cell" style={{
                textAlign: 'center', padding: '10px 6px 8px', borderRadius: 10,
                background: `linear-gradient(160deg, ${EMPEROR.obsidian}, ${p2.abyss})`,
                border: `1px solid ${p2.shadow}`,
                boxShadow: `0 2px 12px rgba(0,0,0,.5), inset 0 1px 0 ${p2.bright}14`,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* 掃描光 */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%',
                  background: `linear-gradient(90deg,transparent,${p2.bright}0a,transparent)`,
                  animation: 'hvScanH 4s linear infinite',
                  pointerEvents: 'none',
                }} />

                {/* 維度名 */}
                <div style={{
                  fontSize: 9, color: p2.text, fontWeight: 700,
                  letterSpacing: '.06em', marginBottom: 4,
                }}>{SCORE_SHORT[key] ?? key}</div>

                {/* 大分數 */}
                <div style={{
                  fontSize: 26, fontWeight: 900, color: c, lineHeight: 1,
                  textShadow: `0 0 12px ${c}88, 0 0 24px ${c}44`,
                  animation: 'hvScoreIn 0.5s ease-out',
                }}>{val}</div>

                {/* 百分比條 */}
                <div style={{ margin: '5px 0 4px', height: 4, borderRadius: 4, background: EMPEROR.obsidianMid, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${p2.core}, ${c})`,
                    width: `${pctVal}%`,
                    boxShadow: `0 0 6px ${c}88`,
                    transition: 'width .6s cubic-bezier(.34,1.56,.64,1)',
                  }} />
                </div>

                {/* 百分比 + 功能描述 */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 8,
                }}>
                  <span style={{ color: c, fontWeight: 900, fontFamily: 'monospace' }}>{pctVal}%</span>
                  <span style={{ color: p2.text, letterSpacing: '.03em' }}>{SCORE_DESC[key] ?? ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 隱性指標 5 維 ── */}
      {hidden5.length > 0 && (
        <div style={{
          background: EMPEROR_UI.cardBg, border: `1px solid ${SHUI.shadow}44`,
          borderRadius: 10, marginBottom: 8, overflow: 'hidden',
        }}>
          <div style={{
            padding: '7px 14px',
            background: `linear-gradient(135deg,${SHUI.abyss},#0d0814)`,
            borderBottom: `1px solid ${SHUI.shadow}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: SHUI.bright, letterSpacing: '0.08em' }}>💡 隱性指標六維度 (Metrics)</span>
            <span style={{ fontSize: 9, color: EMPEROR_UI.textDim }}>深層戰力分析</span>
          </div>

          <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {hidden5.map(([key, val]) => {
              const p2 = SCORE_PALETTE[key] ?? SHUI;
              const c = val >= 80 ? p2.bright : val >= 60 ? TU.bright : val >= 40 ? HUO.bright : '#f87171';
              const pctVal = pct(val);
              return (
                <div key={key} className="hv-ability-cell" style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr 36px 52px',
                  gap: 8, alignItems: 'center',
                  padding: '6px 10px', borderRadius: 8,
                  background: `linear-gradient(90deg, ${p2.abyss}, ${EMPEROR.obsidian})`,
                  border: `1px solid ${p2.shadow}44`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* 掃描光 */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%',
                    background: `linear-gradient(90deg,transparent,${p2.bright}08,transparent)`,
                    animation: 'hvScanH 5s linear infinite',
                    pointerEvents: 'none',
                  }} />

                  {/* 維度名稱 + 意境 */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: p2.bright }}>{SCORE_SHORT[key] ?? key}</div>
                    <div style={{ fontSize: 8, color: p2.text, marginTop: 1 }}>{SCORE_DESC[key] ?? ''}</div>
                  </div>

                  {/* 進度條 */}
                  <div style={{ height: 6, borderRadius: 4, background: EMPEROR.obsidianMid, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${p2.core}, ${c})`,
                      width: `${pctVal}%`,
                      boxShadow: `0 0 8px ${c}77`,
                      transition: 'width .6s cubic-bezier(.34,1.56,.64,1)',
                    }} />
                  </div>

                  {/* 百分比 */}
                  <div style={{
                    fontSize: 11, fontWeight: 900, color: c, textAlign: 'right',
                    fontFamily: 'monospace', textShadow: `0 0 6px ${c}66`,
                  }}>{pctVal}%</div>

                  {/* 分數 */}
                  <div style={{
                    fontSize: 16, fontWeight: 900, color: c, textAlign: 'right',
                    textShadow: `0 0 8px ${c}88`,
                  }}>{val}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4 建議卡 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, marginBottom: 8 }}>
        {[
          { label: '💡 今日建議', text: sugg.suggestion,       color: SHUI.bright, bg: SHUI.abyss, border: SHUI.shadow },
          { label: '⚠️ 壓力提醒', text: sugg.pressure,         color: '#f87171',   bg: '#1a0000',  border: '#7f1d1d44' },
          { label: '🔥 激勵',     text: sugg.motivation,        color: HUO.bright,  bg: HUO.abyss,  border: HUO.shadow },
          { label: '🎯 收單要求', text: sugg.closeRequirement,  color: '#c084fc',   bg: '#1a0929',  border: '#7e22ce44' },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg, border: `1px solid ${card.border}`,
            borderRadius: 8, padding: '8px 10px',
            boxShadow: `inset 0 1px 0 ${card.color}11`,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 900, color: card.color,
              marginBottom: 4, letterSpacing: '0.06em',
              textShadow: `0 0 6px ${card.color}66`,
            }}>{card.label}</div>
            <div style={{ fontSize: 11, color: EMPEROR_UI.textSecondary, lineHeight: 1.7 }}>{card.text}</div>
          </div>
        ))}
      </div>

      {/* ── 主攻方向 ── */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderAccent}`,
        borderRadius: 9, padding: '10px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 800, color: EMPEROR_UI.textDim, marginBottom: 3, letterSpacing: '0.08em' }}>今日最適合攻的客戶類型</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: MU.bright, textShadow: `0 0 6px ${MU.bright}44` }}>{sugg.bestClientType}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 800, color: EMPEROR_UI.textDim, marginBottom: 3, letterSpacing: '0.08em' }}>今日最適合講的高價方向</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#c084fc', textShadow: '0 0 6px #c084fc44' }}>{sugg.bestPriceDirection}</div>
        </div>
      </div>

    </div>
  );
}
