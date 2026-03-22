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

// ─── 分數格評級標籤 ───
function scoreGrade(v: number): string {
  if (v >= 90) return 'S+';
  if (v >= 80) return 'S';
  if (v >= 70) return 'A';
  if (v >= 60) return 'B';
  if (v >= 45) return 'C';
  if (v >= 30) return 'D';
  return 'F';
}

// ─── 股票式趨勢符號 ───
function scoreTrend(v: number): { sym: string; color: string } {
  if (v >= 85) return { sym: '▲▲', color: '#00ff9c' };
  if (v >= 70) return { sym: '▲', color: '#22d3ee' };
  if (v >= 55) return { sym: '─', color: '#94a3b8' };
  if (v >= 35) return { sym: '▼', color: '#fb923c' };
  return { sym: '▼▼', color: '#f87171' };
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandAlerts, setExpandAlerts] = useState(false);

  const bigDealCount = profiles.filter(p => p.canLeadBigDeal).length;
  const topProfile = profiles[0];
  const avgScore = Math.round(profiles.reduce((s, p) => s + p.totalScore, 0) / profiles.length);
  const maxScore = Math.max(...profiles.map(p => p.totalScore));
  const minScore = Math.min(...profiles.map(p => p.totalScore));
  const scoreKeys = Object.keys(profiles[0]?.scores ?? {}).slice(0, 5);
  const highAlerts = alerts.filter(a => a.severity === '高');

  const handleSort = (field: string) => {
    setSortField(field);
    setSortOrder(prev => (sortField === field && prev === 'desc') ? 'asc' : 'desc');
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    const valA = sortField === 'totalScore' ? a.totalScore : (a.scores as Record<string,number>)[sortField] ?? 0;
    const valB = sortField === 'totalScore' ? b.totalScore : (b.scores as Record<string,number>)[sortField] ?? 0;
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  // 頂部指標欄（橫向一行，極致緊湊）
  const metrics = [
    {
      key: 'total', label: '全員', sub: `${profiles.length}人`, val: profiles.length,
      pct: 1, color: '#c084fc', tip: '本次納入排行人數',
      extra: `均分${avgScore}`,
    },
    {
      key: 'big', label: '可攻大單', sub: `${bigDealCount}人`, val: bigDealCount,
      pct: bigDealCount / profiles.length, color: '#00e5ff', tip: '具備大單攻堅資格（膽量+承壓達標）',
      extra: `佔比${Math.round(bigDealCount/profiles.length*100)}%`,
    },
    {
      key: 'max', label: '最高分', sub: `${maxScore}分`, val: maxScore,
      pct: maxScore / 100, color: '#00ff9c', tip: topProfile?.name ?? '',
      extra: topProfile?.name ?? '',
    },
    {
      key: 'avg', label: '均分', sub: `${avgScore}分`, val: avgScore,
      pct: avgScore / 100, color: '#22d3ee', tip: '全隊平均戰力分數',
      extra: avgScore >= 70 ? '▲強' : avgScore >= 55 ? '─中' : '▼弱',
    },
    {
      key: 'min', label: '最低分', sub: `${minScore}分`, val: minScore,
      pct: minScore / 100, color: '#fb923c', tip: '最需強化成員',
      extra: `差距${maxScore - minScore}`,
    },
    {
      key: 'alert', label: '告警', sub: `${alerts.length}條`, val: alerts.length,
      pct: Math.min(alerts.length / 10, 1), color: highAlerts.length > 0 ? '#f87171' : '#fb923c',
      tip: `高級${highAlerts.length}條 需即時處理`,
      extra: `高危${highAlerts.length}`,
    },
  ];

  const COL = `28px 1fr 54px ${scoreKeys.map(() => '46px').join(' ')}`;

  return (
    <div style={{
      background: 'radial-gradient(ellipse 80% 60% at 20% 10%, #0d0520 0%, #060212 35%, #020308 60%, #000508 100%)',
      height: '100vh', width: '100%', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
    }}>

      {/* ══ 頂部總覽列（單行，全部數據化）══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '0 10px',
        background: 'linear-gradient(90deg,#1a0929 0%,#0d0520 40%,#060212 100%)',
        borderBottom: '1px solid rgba(192,132,252,0.14)',
        flexShrink: 0, minHeight: 38,
      }}>
        {/* 品牌 */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginRight:10, flexShrink:0 }}>
          <span style={{ fontSize:14, filter:'drop-shadow(0 0 5px #c084fc)', animation:'hvGlowPulse 3s ease-in-out infinite' }}>💎</span>
          <div>
            <div style={{ fontSize:11, fontWeight:900, color:'#c084fc', letterSpacing:'0.04em', lineHeight:1, textShadow:'0 0 8px rgba(192,132,252,0.6)' }}>高價總控台</div>
            <div style={{ fontSize:7, color:'rgba(192,132,252,0.35)', letterSpacing:'0.08em' }}>HIGH·VALUE·CMD</div>
          </div>
        </div>
        {/* 分隔線 */}
        <div style={{ width:1, height:24, background:'rgba(192,132,252,0.15)', marginRight:10, flexShrink:0 }}/>

        {/* 指標格 × 6 */}
        {metrics.map((m, mi) => (
          <React.Fragment key={m.key}>
            <div title={m.tip} style={{ padding:'4px 10px', cursor:'default', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                <span style={{ fontSize:14, fontWeight:900, color:m.color, fontFamily:'Orbitron', textShadow:`0 0 6px ${m.color}66`, lineHeight:1 }}>{m.sub.replace('人','').replace('分','').replace('條','')}</span>
                <span style={{ fontSize:8, color:`${m.color}99`, fontWeight:700 }}>{m.sub.replace(/[0-9]/g,'')}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
                <div style={{ flex:1, height:2, background:'rgba(255,255,255,0.04)', borderRadius:2, overflow:'hidden', minWidth:30 }}>
                  <div style={{ height:'100%', background:`linear-gradient(90deg,${m.color}44,${m.color})`, width:`${Math.round(m.pct*100)}%`, transition:'width .6s ease' }}/>
                </div>
                <span style={{ fontSize:7, color:`${m.color}88`, whiteSpace:'nowrap' }}>{m.extra}</span>
              </div>
              <div style={{ fontSize:7, color:'rgba(255,255,255,0.2)', marginTop:1, letterSpacing:'0.04em' }}>{m.label}</div>
            </div>
            {mi < metrics.length - 1 && <div style={{ width:1, height:20, background:'rgba(255,255,255,0.05)', flexShrink:0 }}/>}
          </React.Fragment>
        ))}

        {/* 右側LIVE + 告警快鍵 */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {highAlerts.length > 0 && (
            <div
              onClick={() => setExpandAlerts(e => !e)}
              className="hv-alert-high"
              style={{ padding:'2px 8px', borderRadius:4, background:'#1c0000', border:'1px solid #ef444433', cursor:'pointer',
                fontSize:9, fontWeight:900, color:'#f87171', display:'flex', alignItems:'center', gap:3 }}>
              🚨 {highAlerts.length}條高危 {expandAlerts ? '▲' : '▼'}
            </div>
          )}
          <div style={{ display:'flex', gap:3, alignItems:'center' }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'#00ff9c', boxShadow:'0 0 4px #00ff9c', animation:'hvGlowPulse 2s ease-in-out infinite' }}/>
            <span style={{ fontSize:8, color:'#00ff9c', fontWeight:800 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ══ 告警展開欄（可收合）══ */}
      {expandAlerts && highAlerts.length > 0 && (
        <div style={{ background:'#0d0000', borderBottom:'1px solid #ef444422', padding:'4px 10px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
          {highAlerts.map((a, i) => (
            <div key={i} style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:'#1c0000', border:'1px solid #ef444433', color:'#fca5a5', display:'flex', gap:4, alignItems:'center' }}>
              <span style={{ fontWeight:900, color:'#f87171' }}>{a.name}</span>
              <span style={{ color:'#ef444488' }}>{a.alertType}</span>
              <span style={{ color:'#fca5a566' }}>{a.action}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══ 排行表（全屏，極致壓縮）══ */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:'6px 10px 4px' }}>

        {/* 表頭 */}
        <div style={{
          display:'grid', gridTemplateColumns:COL, gap:4, alignItems:'center',
          padding:'4px 8px 5px',
          background:'linear-gradient(90deg,#1e0838 0%,#0d0520 50%,#03040e 100%)',
          borderBottom:'1.5px solid rgba(192,132,252,0.18)',
          borderRadius:'6px 6px 0 0',
          flexShrink:0,
        }}>
          <span style={{ fontSize:8, color:'rgba(255,255,255,0.3)', cursor:'pointer' }} onClick={() => handleSort('totalScore')}>#</span>
          <span style={{ fontSize:9, color:'#c084fc', fontWeight:900 }}>姓名 · 等級</span>
          {/* 總分欄頭 */}
          <div style={{ textAlign:'center', cursor:'pointer', userSelect:'none' }} onClick={() => handleSort('totalScore')}>
            <div style={{ fontSize:9, color:'#00e5ff', fontWeight:900 }}>
              總分{sortField==='totalScore' && <span style={{ fontSize:7 }}>{sortOrder==='desc'?'▼':'▲'}</span>}
            </div>
            <div style={{ fontSize:7, color:'rgba(0,229,255,0.4)' }}>綜合戰力</div>
          </div>
          {/* 5格維度頭 */}
          {scoreKeys.map(k => {
            const pal = SCORE_PALETTE[k] ?? MU;
            const teamAvg = Math.round(profiles.reduce((s,p)=>s+((p.scores as Record<string,number>)[k]??0),0)/profiles.length);
            return (
              <div key={k} style={{ textAlign:'center', cursor:'pointer', userSelect:'none' }} onClick={() => handleSort(k)}>
                <div style={{ fontSize:9, color:pal.bright, fontWeight:900 }}>
                  {SCORE_SHORT[k]??k}{sortField===k && <span style={{ fontSize:7 }}>{sortOrder==='desc'?'▼':'▲'}</span>}
                </div>
                <div style={{ fontSize:7, color:'rgba(255,255,255,0.2)' }}>{SCORE_DESC[k]?.slice(0,2)}·均{teamAvg}</div>
              </div>
            );
          })}
        </div>

        {/* 員工列（壓縮至每行34px，21人一屏可見）*/}
        <div style={{ flex:1, overflowY:'auto', paddingRight:2 }}>
          {sortedProfiles.map((p, index) => {
            const ls = levelStyle(p.level);
            const scores5 = scoreKeys.map(k => (p.scores as Record<string,number>)[k] ?? 0);
            const rankIndex = profiles.findIndex(op => op.name === p.name) + 1;
            const isTop1 = rankIndex === 1;
            const sc = rankIndex <= 3 ? '#00e5ff' : rankIndex <= 8 ? SHUI.bright : EMPEROR_UI.textDim;
            const rowClass = isTop1 ? 'hv-row hv-row-top1 hv-top1' : rankIndex <= 3 ? 'hv-row hv-row-top3' : rankIndex <= 8 ? 'hv-row hv-row-top8' : 'hv-row hv-row-rest';
            const isHov = hoveredRow === p.name;
            const trend = scoreTrend(p.totalScore);

            return (
              <div
                key={p.name}
                className={rowClass}
                onMouseEnter={() => setHoveredRow(p.name)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display:'grid', gridTemplateColumns:COL, gap:4, alignItems:'center',
                  padding:'3px 8px',
                  borderBottom:'1px solid rgba(255,255,255,0.022)',
                  animation:`hvRowSlide 0.2s ease-out ${index*0.012}s both`,
                  transition:'background 0.15s',
                }}
              >
                {/* 名次泡 */}
                <div style={{
                  width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontWeight:900, flexShrink:0,
                  background: isTop1 ? 'linear-gradient(135deg,#4c1d95,#7e22ce)' : rankIndex<=3 ? '#2d0a3f' : rankIndex<=8 ? SHUI.abyss : '#111',
                  border:`1.5px solid ${isTop1?'#c084fc':rankIndex<=3?'#7e22ceaa':rankIndex<=8?SHUI.shadow:'#2a2a3a'}`,
                  color: rankIndex<=3?'#fff':rankIndex<=8?SHUI.bright:'#64748b',
                  boxShadow: isTop1?'0 0 7px #c084fc66':'none',
                }}>{rankIndex}</div>

                {/* 姓名列：姓名 + 等級badge + hover時展開描述 */}
                <div style={{ minWidth:0, display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:900, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textShadow:isTop1?'0 0 7px #c084fc55':'none', lineHeight:1.15 }}>
                      {p.name}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <span style={{ fontSize:6.5, padding:'0 3px', borderRadius:2, background:ls.bg, color:ls.color, border:`1px solid ${ls.border}55`, fontWeight:700, whiteSpace:'nowrap', lineHeight:1.4 }}>
                        {p.level}
                      </span>
                      {isHov && p.canLeadBigDeal && (
                        <span style={{ fontSize:6, color:'#00e5ff', background:'rgba(0,229,255,0.1)', padding:'0 3px', borderRadius:2, border:'1px solid rgba(0,229,255,0.2)' }}>大單✓</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 總分：數字 + 趨勢符 + mini條 */}
                <div style={{ textAlign:'center' }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:2 }}>
                    <span style={{ fontSize:14, fontWeight:900, color:sc, fontFamily:'Orbitron', textShadow:rankIndex<=3?`0 0 7px ${sc}77`:'none', lineHeight:1 }}>{p.totalScore}</span>
                    <span style={{ fontSize:7, color:trend.color, fontWeight:900 }}>{trend.sym}</span>
                  </div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.03)', borderRadius:2, overflow:'hidden', margin:'1px 2px 0' }}>
                    <div style={{ height:'100%', background:`linear-gradient(90deg,${ls.glow}66,${sc})`, width:`${p.totalScore}%`, transition:'width .5s ease' }}/>
                  </div>
                  <div style={{ fontSize:6, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:0.5 }}>{scoreGrade(p.totalScore)}</div>
                </div>

                {/* 5格分數：數字 + 等級 + 趨勢 + mini熱力條 */}
                {scores5.map((v, j) => {
                  const pal = SCORE_PALETTE[scoreKeys[j]] ?? MU;
                  const vc = v>=85?'#00ff9c':v>=70?pal.bright:v>=55?'#e2e8f0':v>=35?'#fb923c':'#f87171';
                  const tr = scoreTrend(v);
                  const teamAvg2 = Math.round(profiles.reduce((s2,pp)=>s2+((pp.scores as Record<string,number>)[scoreKeys[j]]??0),0)/profiles.length);
                  const vsAvg = v - teamAvg2;
                  const cellBg = v>=80 ? `linear-gradient(160deg,${pal.abyss},#05030c)` : v>=60 ? 'rgba(8,10,22,0.9)' : v>=40 ? 'rgba(16,6,2,0.85)' : 'rgba(18,2,2,0.85)';
                  return (
                    <div
                      key={j}
                      className="hv-score-cell"
                      title={`${SCORE_SHORT[scoreKeys[j]]}：${v}分（${SCORE_DESC[scoreKeys[j]]}）\n等級：${scoreGrade(v)}\n vs 均值${teamAvg2}（${vsAvg>=0?'+':''}${vsAvg}）`}
                      style={{
                        borderRadius:4, padding:'2px 2px 1px',
                        background:cellBg,
                        border:`1px solid ${v>=80?pal.shadow:v>=60?'rgba(96,165,250,0.08)':v>=40?'rgba(251,191,36,0.07)':'rgba(239,68,68,0.13)'}`,
                        textAlign:'center',
                      }}
                    >
                      {/* 數字行 + 趨勢 */}
                      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:1 }}>
                        <span style={{ fontSize:11, fontWeight:900, color:vc, fontFamily:'Orbitron', lineHeight:1, textShadow:v>=80?`0 0 3px ${vc}55`:'none' }}>{v}</span>
                        <span style={{ fontSize:6, color:tr.color, lineHeight:1 }}>{tr.sym[0]}</span>
                      </div>
                      {/* 熱力條 */}
                      <div style={{ height:2, background:'rgba(255,255,255,0.02)', borderRadius:2, margin:'1px 2px 0', overflow:'hidden' }}>
                        <div style={{ height:'100%', background:vc, width:`${v}%`, opacity:.8, transition:'width .4s ease' }}/>
                      </div>
                      {/* 等級 + vs均值 */}
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1px', padding:'0 1px' }}>
                        <span style={{ fontSize:6, color:vc, opacity:.7, fontWeight:700 }}>{scoreGrade(v)}</span>
                        <span style={{ fontSize:6, color:vsAvg>=0?'#00ff9c88':'#f8717188' }}>{vsAvg>=0?'+':''}{vsAvg}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 底部：告警摘要 + 喊話 */}
          {(alerts.length > 0 || teamRally) && (
            <div style={{ display:'flex', gap:6, padding:'6px 0 2px', flexWrap:'wrap' }}>
              {teamRally && (
                <div style={{ flex:'1 1 200px', background:'rgba(14,6,24,0.7)', border:'1px solid rgba(126,34,206,0.14)', borderRadius:6, padding:'5px 8px' }}>
                  <div style={{ fontSize:8, color:'#c084fc', fontWeight:900, marginBottom:3 }}>📣 喊話</div>
                  <pre style={{ fontSize:8, color:'#b0a8c8', whiteSpace:'pre-wrap', lineHeight:1.5, margin:0, fontFamily:'inherit' }}>{teamRally.slice(0, 120)}{teamRally.length>120?'…':''}</pre>
                </div>
              )}
              {!expandAlerts && alerts.length > 0 && (
                <div style={{ flex:'1 1 200px', background:'rgba(12,0,0,0.7)', border:'1px solid rgba(239,68,68,0.12)', borderRadius:6, padding:'5px 8px' }}>
                  <div style={{ fontSize:8, color:'#f87171', fontWeight:900, marginBottom:3 }}>🚨 告警 ({alerts.length})</div>
                  {alerts.slice(0, 3).map((a,i)=>(
                    <div key={i} style={{ fontSize:7.5, color:'#fca5a5', lineHeight:1.4 }}>
                      <span style={{ color:'#f87171', fontWeight:800 }}>{a.name}</span> · {a.alertType} · <span style={{ color:'#fca5a566' }}>{a.action}</span>
                    </div>
                  ))}
                  {alerts.length > 3 && <div style={{ fontSize:7, color:'rgba(248,113,113,0.4)', marginTop:2 }}>+{alerts.length-3} 條</div>}
                </div>
              )}
            </div>
          )}
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
