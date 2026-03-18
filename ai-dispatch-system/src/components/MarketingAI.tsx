// ==========================================
// AI 行銷建議頁 — 帝王配色 · 功能意境字
// ==========================================
import React, { useState } from 'react';
import { getGroupColor } from '../engine/aiEngine';
import type { MarketingSuggestion, TrendAnalysis } from '../engine/trendEngine';
import { EMPEROR_UI, EMPEROR, MU, HUO, SHUI, TU, JIN } from '../constants/wuxingColors';

// ── CSS 注入 ──
let _mktInjected = false;
function injectMktStyles() {
  if (_mktInjected || typeof document === 'undefined') return;
  _mktInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes mktScan  { 0%{left:-60%} 100%{left:120%} }
    @keyframes mktPop   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mktGlow  { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes mktAlert { 0%,100%{box-shadow:0 0 6px #ef444433} 50%{box-shadow:0 0 16px #ef4444aa} }
    .mkt-row:hover  { background:rgba(255,255,255,.025)!important; transform:translateX(2px); }
    .mkt-row  { transition: background .15s, transform .15s; cursor: pointer; }
    .mkt-card:hover { border-color:var(--bc)!important; }
    .mkt-card { transition: border-color .2s; }
  `;
  document.head.appendChild(s);
}

const CARD: React.CSSProperties = {
  background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`,
  borderRadius: 10, position: 'relative', overflow: 'hidden',
};
const SCAN: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, bottom: 0, width: '45%',
  background: `linear-gradient(90deg,transparent,${JIN.bright}06,transparent)`,
  animation: 'mktScan 5s linear infinite', pointerEvents: 'none',
};
const BADGE: React.CSSProperties = {
  display: 'inline-block', fontSize: 10, padding: '1px 7px',
  borderRadius: 4, fontWeight: 900, letterSpacing: '.04em',
};

const GROUP_PALETTE: Record<string, typeof MU> = { A1: HUO, A2: MU, B: TU, C: SHUI };

interface Props {
  suggestions: MarketingSuggestion[];
  trends: TrendAnalysis[];
}

export default function MarketingAIDashboard({ suggestions, trends }: Props) {
  injectMktStyles();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const total = suggestions.length;

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100%', padding: '8px 12px 14px', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ── 頁首 ── */}
      <div style={{ ...CARD, padding: '10px 14px', marginBottom: 8, border: `1px solid ${HUO.shadow}` }}>
        <div style={SCAN} />
        <div style={{ fontSize: 15, fontWeight: 900, color: HUO.bright, textShadow: `0 0 10px ${HUO.bright}66` }}>🎯 AI 行銷建議中心</div>
        <div style={{ fontSize: 10, color: EMPEROR_UI.textDim, marginTop: 2 }}>全員個人化建議 · 壓力 · 激勵 · 改進 · 推薦話術 · 課程</div>
      </div>

      {/* ── 重點加強名單（後5名）── */}
      <div style={{ ...CARD, marginBottom: 8, border: `1px solid ${'#7f1d1d'}`, animation: 'mktAlert 2s ease-in-out infinite' }}>
        <div style={SCAN} />
        <div style={{ padding: '7px 14px', background: 'linear-gradient(90deg,#2d0a0a,#140000)', borderBottom: '1px solid #7f1d1d33', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, animation: 'mktGlow 2s ease-in-out infinite' }}>⚠️</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#f87171', letterSpacing: '.08em' }}>重點加強名單（後 5 名）</span>
          <span style={{ ...BADGE, background: '#3d0000', color: '#f87171', border: '1px solid #ef444433', marginLeft: 'auto' }}>需即時介入</span>
        </div>
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {suggestions.slice(-5).map((s, i) => {
            const gp = GROUP_PALETTE[s.group] ?? SHUI;
            return (
              <div key={s.name} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr auto',
                gap: 8, alignItems: 'center',
                padding: '6px 10px', borderRadius: 8,
                background: '#1a0000', border: '1px solid #7f1d1d33',
                animation: `mktPop .3s ease-out ${i * .05}s both`,
              }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#3d0000', border: '1px solid #ef444444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#f87171' }}>
                  #{s.rank}
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: EMPEROR_UI.textPrimary }}>{s.name}</span>
                  <span style={{ ...BADGE, background: gp.abyss, color: gp.bright, border: `1px solid ${gp.shadow}`, marginLeft: 6 }}>{s.group}</span>
                </div>
                <div style={{ fontSize: 10, color: '#fca5a5', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.improvement}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 全員建議列表 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {suggestions.map((s, idx) => {
          const gp = GROUP_PALETTE[s.group] ?? SHUI;
          const trend = trends.find(t => t.name === s.name);
          const isExpanded = expandedIdx === idx;
          const isBottom5 = s.rank >= total - 4;
          const up = (trend?.momentum ?? 1) >= 1;

          return (
            <div key={s.name} className="mkt-card" style={{
              ...CARD,
              border: `1px solid ${isBottom5 ? '#7f1d1d' : gp.shadow + '66'}`,
              ['--bc' as string]: gp.bright,
            }}>
              <div style={SCAN} />
              {/* 摘要行 */}
              <div
                className="mkt-row"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                style={{
                  padding: '8px 12px',
                  display: 'grid', gridTemplateColumns: '32px 1fr auto',
                  gap: 8, alignItems: 'center',
                  animation: `mktPop .3s ease-out ${idx * .02}s both`,
                }}
              >
                {/* 名次 */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: s.rank <= 3 ? gp.void : gp.abyss,
                  border: `1.5px solid ${s.rank <= 3 ? gp.bright : gp.shadow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: gp.bright,
                  boxShadow: s.rank <= 3 ? `0 0 8px ${gp.bright}55` : 'none',
                }}>{s.rank}</div>

                {/* 姓名 + 趨勢 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: EMPEROR_UI.textPrimary }}>{s.name}</span>
                    {trend && (
                      <span style={{ fontSize: 9, color: up ? MU.bright : HUO.bright }}>{trend.trendLabel}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 1 }}>
                    {trend && (
                      <>
                        <span style={{ color: up ? MU.text : HUO.text }}>動能 {(trend.momentum * 100).toFixed(0)}%</span>
                        <span style={{ marginLeft: 6 }}>3月 ${trend.marRevenue.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 右側標籤 + 展開箭頭 */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                  {isBottom5 && <span style={{ ...BADGE, background: '#3d0000', color: '#f87171', border: '1px solid #ef444433' }}>重點</span>}
                  <span style={{ ...BADGE, background: gp.abyss, color: gp.bright, border: `1px solid ${gp.shadow}` }}>{getGroupColor(s.group).label.replace(/　.*$/, '')}</span>
                  <span style={{ fontSize: 11, color: EMPEROR_UI.textDim, transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
              </div>

              {/* 展開詳情 */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${gp.shadow}33`, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {/* 趨勢數據 */}
                  {trend && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 2 }}>
                      {([
                        ['2月總業績', `$${trend.febRevenue.toLocaleString()}`, SHUI],
                        ['3月累積', `$${trend.marRevenue.toLocaleString()}`, MU],
                        ['2月日均', `$${trend.febDailyAvg.toLocaleString()}`, TU],
                        ['動能比', `${(trend.momentum*100).toFixed(0)}%`, up ? MU : HUO],
                      ] as const).map(([lbl, val, p]) => (
                        <div key={lbl} style={{ background: p.abyss, border: `1px solid ${p.shadow}`, borderRadius: 7, padding: '6px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: p.text }}>{lbl}</div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: p.bright, marginTop: 1 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 四大建議 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { icon: '💡', label: 'AI 建議', text: s.suggestion,   p: SHUI },
                      { icon: '⚠️', label: '壓力',    text: s.pressure,     p: HUO  },
                      { icon: '🔥', label: '激勵',    text: s.motivation,   p: MU   },
                      { icon: '🎯', label: '改進方向', text: s.improvement,  p: TU   },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.p.abyss, border: `1px solid ${c.p.shadow}`, borderRadius: 8, padding: '7px 9px' }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: c.p.bright, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{c.icon}</span><span>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: EMPEROR_UI.textSecondary, lineHeight: 1.6 }}>{c.text}</div>
                      </div>
                    ))}
                  </div>

                  {/* 話術 + 課程 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { icon: '💬', label: 'AI 推薦話術', text: s.script,  p: JIN  },
                      { icon: '📚', label: 'AI 推薦課程', text: s.course,  p: gp   },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.p.abyss, border: `1px solid ${c.p.shadow}`, borderRadius: 8, padding: '7px 9px' }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: c.p.bright, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{c.icon}</span><span>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: EMPEROR_UI.textSecondary, lineHeight: 1.6 }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
